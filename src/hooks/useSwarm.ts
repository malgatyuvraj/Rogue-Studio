import { useState, useRef, useCallback } from "react";
import { SwarmState, parseBlueStream, parseRedStream } from "@/lib/swarmOrchestrator";
import { BLUE_TEAM_PROMPT, RED_TEAM_PROMPT } from "@/lib/prompts";

export function useSwarm(provider: string, model: string, apiKey: string, airGapHeaders: Record<string, string>) {
  const [swarm, setSwarm] = useState<SwarmState>({
    role: "idle", blueOutput: "", redOutput: "",
    iteration: 0, verdict: "pending"
  });
  const abortRef = useRef<AbortController | null>(null);

  const runSwarm = useCallback(async (userTask: string) => {
    abortRef.current = new AbortController();

    // ── BLUE TEAM PHASE ──
    setSwarm(s => ({ ...s, role: "blue" }));
    let blueAccumulated = "";

    const blueRes = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...airGapHeaders },
      body: JSON.stringify({
        provider, model, apiKey,
        messages: [
          { role: "system", content: BLUE_TEAM_PROMPT },
          { role: "user", content: userTask }
        ]
      }),
      signal: abortRef.current.signal
    });

    if (!blueRes.ok) {
        throw new Error("Blue Team fetch failed");
    }

    const blueReader = blueRes.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await blueReader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const { isDone, content } = parseBlueStream(chunk);
      blueAccumulated += content;
      setSwarm(s => ({ ...s, blueOutput: s.blueOutput + content }));
      if (isDone) { blueReader.cancel(); break; }
    }

    // ── RED TEAM PHASE ──
    setSwarm(s => ({ ...s, role: "red", iteration: s.iteration + 1 }));

    const redRes = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...airGapHeaders },
      body: JSON.stringify({
        provider, model, apiKey,
        messages: [
          { role: "system", content: RED_TEAM_PROMPT },
          { role: "user", content: `Audit this code:\n\n${blueAccumulated}` }
        ]
      }),
      signal: abortRef.current.signal
    });

    if (!redRes.ok) {
        throw new Error("Red Team fetch failed");
    }

    const redReader = redRes.body!.getReader();
    let finalVerdict: "vulnerable" | "secure" | null = null;

    while (true) {
      const { done, value } = await redReader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const { verdict, content } = parseRedStream(chunk);
      setSwarm(s => ({ ...s, redOutput: s.redOutput + content }));
      if (verdict) { finalVerdict = verdict; redReader.cancel(); break; }
    }

    setSwarm(s => ({
      ...s,
      role: "idle",
      verdict: finalVerdict ?? "pending"
    }));

    // If vulnerable → auto-requeue Blue with patch context (loop continues)
    // Caller decides max iterations to prevent infinite loop
    return finalVerdict;
  }, [provider, model, apiKey, airGapHeaders]);

  const abort = () => abortRef.current?.abort();

  return { swarm, runSwarm, abort, setSwarm };
}
