import { useState, useRef } from "react";
import {
  AttackChainState,
  AttackPhase,
  PhaseResult,
  PHASE_ORDER,
  createChainId,
  parseChainOutput,
  buildPhaseContext,
} from "@/lib/attackChain";
import { buildAttackPhasePrompt } from "@/lib/prompts";
import { formatMemoryForPrompt, extractLearnings } from "@/lib/agentMemory";

const MAX_PIVOTS_PER_PHASE = 3;
const MAX_ITERATIONS_PER_PHASE = 10;

export function useAttackChain(
  provider: string,
  model: string,
  apiKey: string,
  getHeaders: () => Record<string, string>
) {
  const [chain, setChain] = useState<AttackChainState>({
    id: "",
    target: "",
    currentPhase: "idle",
    phases: [],
    totalPivots: 0,
    startedAt: 0,
  });

  const [phaseStream, setPhaseStream] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  /** Fetch relevant memories for the current target/phase */
  const fetchMemory = async (target: string, phase: string): Promise<string[]> => {
    try {
      const res = await fetch(`/api/memory?query=${encodeURIComponent(target + " " + phase)}&limit=5`);
      const data = await res.json();
      if (data.success && data.results.length > 0) {
        return formatMemoryForPrompt(data.results);
      }
    } catch {
      // Memory unavailable — continue without it
    }
    return [];
  };

  /** Store learnings from a completed phase */
  const storeMemory = async (phase: string, output: string, success: boolean, target: string) => {
    try {
      const learnings = extractLearnings(output, phase, success, target);
      for (const learning of learnings) {
        await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(learning),
        });
      }
    } catch {
      // Memory store unavailable — non-critical
    }
  };

  /** Execute a single agent call and stream the response */
  const streamPhaseCall = async (
    systemPrompt: string,
    userMessage: string,
    signal: AbortSignal
  ): Promise<string> => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getHeaders() },
      body: JSON.stringify({
        provider,
        model,
        apiKey,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.details || err.error || `Phase call failed: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      setPhaseStream((prev) => prev + chunk);
    }

    return accumulated;
  };

  /** Execute commands found in phase output (agent tool use) */
  const executePhaseActions = async (output: string): Promise<string> => {
    let result = "";

    // Check for <run_command>...</run_command>
    const cmdMatches = output.matchAll(/<run_command>([\s\S]*?)<\/run_command>/g);
    for (const match of cmdMatches) {
      const command = match[1].trim();
      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        });
        const data = await res.json();
        result += `\n[CMD: ${command}]\nSTDOUT: ${data.stdout || "(empty)"}\nSTDERR: ${data.stderr || ""}\n`;
      } catch (err: unknown) {
        result += `\n[CMD FAILED: ${command}] ${err instanceof Error ? err.message : String(err)}\n`;
      }
    }

    // Check for <write_file>...</write_file>
    const writeMatches = output.matchAll(/<write_file\s+path="([^"]+)">([\s\S]*?)<\/write_file>/g);
    for (const match of writeMatches) {
      const filepath = match[1];
      const content = match[2].replace(/^\n/, "");
      try {
        const res = await fetch("/api/workspace/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filepath, content }),
        });
        const data = await res.json();
        result += `\n[WROTE: ${filepath}] ${data.success ? "OK" : data.error}\n`;
      } catch (err: unknown) {
        result += `\n[WRITE FAILED: ${filepath}] ${err instanceof Error ? err.message : String(err)}\n`;
      }
    }

    return result;
  };

  /** Run a single phase with retry/pivot logic */
  const runPhase = async (
    phase: AttackPhase,
    target: string,
    previousPhases: PhaseResult[],
    signal: AbortSignal
  ): Promise<PhaseResult> => {
    const startTime = Date.now();
    let pivotCount = 0;
    let fullOutput = "";
    const allFindings: string[] = [];
    let success = false;
    const failedApproaches: string[] = [];

    // Fetch relevant memories
    const memories = await fetchMemory(target, phase);

    for (let attempt = 0; attempt < MAX_ITERATIONS_PER_PHASE; attempt++) {
      if (signal.aborted) break;

      const context = buildPhaseContext(previousPhases, memories);
      const systemPrompt = buildAttackPhasePrompt(phase, target, context, failedApproaches);

      // Build the user message based on attempt state
      let userMessage = `Execute ${phase} phase against: ${target}`;
      if (pivotCount > 0) {
        userMessage = `Previous approach failed. This is pivot attempt ${pivotCount}/${MAX_PIVOTS_PER_PHASE}. Try a DIFFERENT technique.\n\nFailed approaches:\n${failedApproaches.join("\n")}\n\nTarget: ${target}`;
      }

      setPhaseStream("");
      const output = await streamPhaseCall(systemPrompt, userMessage, signal);
      fullOutput += output + "\n";

      // Execute any tool calls in the output
      const actionResults = await executePhaseActions(output);
      if (actionResults) {
        fullOutput += actionResults;
        setPhaseStream((prev) => prev + `\n\n📟 Action Results:\n${actionResults}`);
      }

      // Parse for sentinels
      const parsed = parseChainOutput(output + actionResults);
      allFindings.push(...parsed.findings);

      if (parsed.shouldAbort) {
        break;
      }

      if (parsed.isComplete) {
        success = true;
        break;
      }

      if (parsed.exploitSuccess !== null) {
        success = parsed.exploitSuccess;
        break;
      }

      if (parsed.shouldPivot || parsed.exploitFailed) {
        pivotCount++;
        failedApproaches.push(output.slice(0, 200));
        setChain((s) => ({ ...s, totalPivots: s.totalPivots + 1 }));

        if (pivotCount >= MAX_PIVOTS_PER_PHASE) {
          // Max pivots reached — move on with partial results
          break;
        }
        continue;
      }

      // If no sentinel found, assume the model needs another iteration with context
      // Feed the action results back and let it continue
      if (!actionResults) {
        // No actions and no sentinels — model is just outputting text, consider phase done
        success = true;
        break;
      }
    }

    const result: PhaseResult = {
      phase,
      output: fullOutput,
      findings: allFindings,
      success,
      duration: Date.now() - startTime,
      pivotCount,
    };

    // Store learnings
    await storeMemory(phase, fullOutput, success, target);

    return result;
  };

  /** Run the full attack chain */
  const runChain = async (target: string) => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const chainId = createChainId();
    setChain({
      id: chainId,
      target,
      currentPhase: PHASE_ORDER[0],
      phases: [],
      totalPivots: 0,
      startedAt: Date.now(),
    });
    setPhaseStream("");

    const completedPhases: PhaseResult[] = [];

    for (const phase of PHASE_ORDER) {
      if (signal.aborted) break;

      setChain((s) => ({ ...s, currentPhase: phase }));
      setPhaseStream("");

      try {
        const result = await runPhase(phase, target, completedPhases, signal);
        completedPhases.push(result);
        setChain((s) => ({ ...s, phases: [...completedPhases] }));
      } catch (err: unknown) {
        if (signal.aborted) break;
        completedPhases.push({
          phase,
          output: `Error: ${err instanceof Error ? err.message : String(err)}`,
          findings: [],
          success: false,
          duration: 0,
          pivotCount: 0,
        });
        setChain((s) => ({ ...s, phases: [...completedPhases] }));
      }
    }

    setChain((s) => ({
      ...s,
      currentPhase: signal.aborted ? "aborted" : "complete",
      completedAt: Date.now(),
      finalReport: completedPhases.find((p) => p.phase === "report")?.output,
    }));
  };

  const abort = () => {
    abortRef.current?.abort();
    setChain((s) => ({ ...s, currentPhase: "aborted" }));
  };

  const reset = () => {
    setChain({
      id: "",
      target: "",
      currentPhase: "idle",
      phases: [],
      totalPivots: 0,
      startedAt: 0,
    });
    setPhaseStream("");
  };

  return { chain, phaseStream, runChain, abort, reset };
}
