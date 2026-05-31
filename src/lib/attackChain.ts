/**
 * Attack Chain Orchestrator
 * 
 * Sequences autonomous attack phases:
 * RECON → VULN_SCAN → EXPLOIT → VERIFY → REPORT
 * 
 * Each phase is a specialized agent prompt that outputs structured
 * sentinel tokens to trigger the next phase or pivot to alternatives.
 */

export type AttackPhase = "recon" | "vuln_scan" | "exploit" | "verify" | "report";

export interface PhaseResult {
  phase: AttackPhase;
  output: string;
  findings: string[];
  success: boolean;
  duration: number;
  pivotCount: number;
}

export interface AttackChainState {
  id: string;
  target: string;
  currentPhase: AttackPhase | "idle" | "complete" | "aborted";
  phases: PhaseResult[];
  totalPivots: number;
  startedAt: number;
  completedAt?: number;
  finalReport?: string;
}

export const PHASE_ORDER: AttackPhase[] = ["recon", "vuln_scan", "exploit", "verify", "report"];

export const PHASE_META: Record<AttackPhase, { label: string; icon: string; color: string }> = {
  recon:     { label: "Reconnaissance", icon: "🔍", color: "blue" },
  vuln_scan: { label: "Vulnerability Scan", icon: "🎯", color: "yellow" },
  exploit:   { label: "Exploit Development", icon: "💀", color: "red" },
  verify:    { label: "Verification", icon: "✅", color: "green" },
  report:    { label: "Report Generation", icon: "📋", color: "purple" },
};

/** Sentinel tokens the model outputs to signal phase transitions */
export const CHAIN_SENTINELS = {
  PHASE_COMPLETE: "<phase_complete>",
  FINDINGS: /<findings>([\s\S]*?)<\/findings>/,
  PIVOT: "<pivot>",
  EXPLOIT_FAILED: "<exploit_failed>",
  EXPLOIT_SUCCESS: "<exploit_success>",
  CHAIN_ABORT: "<chain_abort>",
};

/** Parse phase output for sentinels and findings */
export function parseChainOutput(output: string): {
  isComplete: boolean;
  shouldPivot: boolean;
  exploitSuccess: boolean | null;
  exploitFailed: boolean;
  findings: string[];
  shouldAbort: boolean;
  cleanOutput: string;
} {
  const findings: string[] = [];
  const findingsMatch = output.match(CHAIN_SENTINELS.FINDINGS);
  if (findingsMatch) {
    findings.push(
      ...findingsMatch[1]
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
    );
  }

  const isComplete = output.includes(CHAIN_SENTINELS.PHASE_COMPLETE);
  const shouldPivot = output.includes(CHAIN_SENTINELS.PIVOT);
  const exploitFailed = output.includes(CHAIN_SENTINELS.EXPLOIT_FAILED);
  const exploitSuccess = output.includes(CHAIN_SENTINELS.EXPLOIT_SUCCESS);
  const shouldAbort = output.includes(CHAIN_SENTINELS.CHAIN_ABORT);

  // Strip sentinels from display output
  const cleanOutput = output
    .replace(CHAIN_SENTINELS.PHASE_COMPLETE, "")
    .replace(CHAIN_SENTINELS.PIVOT, "")
    .replace(CHAIN_SENTINELS.EXPLOIT_FAILED, "")
    .replace(CHAIN_SENTINELS.EXPLOIT_SUCCESS, "")
    .replace(CHAIN_SENTINELS.CHAIN_ABORT, "")
    .replace(CHAIN_SENTINELS.FINDINGS, "")
    .trim();

  return {
    isComplete,
    shouldPivot,
    exploitSuccess: exploitSuccess ? true : exploitFailed ? false : null,
    exploitFailed,
    findings,
    shouldAbort,
    cleanOutput,
  };
}

/** Build the context from previous phases for the current phase */
export function buildPhaseContext(phases: PhaseResult[], memory: string[]): string {
  if (phases.length === 0 && memory.length === 0) return "";

  let context = "";

  if (memory.length > 0) {
    context += "=== LEARNED FROM PREVIOUS SESSIONS ===\n";
    context += memory.join("\n") + "\n\n";
  }

  if (phases.length > 0) {
    context += "=== CHAIN PROGRESS SO FAR ===\n";
    for (const phase of phases) {
      context += `\n[${PHASE_META[phase.phase].label.toUpperCase()}] ${phase.success ? "✓" : "✗"}\n`;
      if (phase.findings.length > 0) {
        context += "Findings:\n" + phase.findings.map((f) => `  - ${f}`).join("\n") + "\n";
      }
      context += `Output summary: ${phase.output.slice(0, 500)}\n`;
    }
  }

  return context;
}

export function getNextPhase(current: AttackPhase): AttackPhase | "complete" {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return "complete";
  return PHASE_ORDER[idx + 1];
}

export function createChainId(): string {
  return `chain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
