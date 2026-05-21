import { SwarmState } from "@/lib/swarmOrchestrator";

export function SwarmTerminal({ swarm }: { swarm: SwarmState }) {
  if (swarm.role === "idle" && swarm.blueOutput === "") return null;
  
  return (
    <div className="grid grid-cols-2 gap-2 h-64 font-mono text-sm max-w-3xl mx-auto w-full mb-4">
      {/* Blue Team Pane */}
      <div className={`rounded border p-3 overflow-auto transition-all flex flex-col
        ${swarm.role === "blue"
          ? "border-blue-500 bg-blue-950/20 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
          : "border-zinc-800 bg-zinc-900/50"}`}>
        <div className="text-blue-400 text-xs font-bold mb-2 flex items-center gap-2 border-b border-blue-500/20 pb-2">
          <span className={`w-2 h-2 rounded-full ${swarm.role === "blue" ? "bg-blue-400 animate-pulse" : "bg-zinc-600"}`} />
          BLUE TEAM — Builder
        </div>
        <pre className="whitespace-pre-wrap text-blue-200 text-xs flex-1">{swarm.blueOutput}</pre>
      </div>

      {/* Red Team Pane */}
      <div className={`rounded border p-3 overflow-auto transition-all flex flex-col
        ${swarm.role === "red"
          ? "border-red-500 bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
          : "border-zinc-800 bg-zinc-900/50"}`}>
        <div className="text-red-400 text-xs font-bold mb-2 flex items-center gap-2 border-b border-red-500/20 pb-2">
          <span className={`w-2 h-2 rounded-full ${swarm.role === "red" ? "bg-red-400 animate-pulse" : "bg-zinc-600"}`} />
          RED TEAM — Attacker
        </div>
        <pre className="whitespace-pre-wrap text-red-200 text-xs flex-1">{swarm.redOutput}</pre>
      </div>

      {/* Verdict Banner */}
      {swarm.verdict !== "pending" && (
        <div className={`col-span-2 text-center py-2 rounded font-bold text-sm
          ${swarm.verdict === "secure"
            ? "bg-green-900/40 text-green-400 border border-green-600"
            : "bg-red-900/40 text-red-400 border border-red-600"}`}>
          {swarm.verdict === "secure" ? "✅ SECURE — Red Team found no vulnerabilities" : "⚠️ VULNERABLE — Feeding exploit to Blue Team for patch..."}
        </div>
      )}
    </div>
  );
}
