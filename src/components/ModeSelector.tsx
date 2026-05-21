export type PromptMode = "agent" | "decompiler" | "web3";

interface ModeSelectorProps {
  mode: PromptMode;
  onChange: (mode: PromptMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
        Prompt Presets
      </label>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => onChange("agent")}
          className={`p-2 text-xs rounded border text-left transition-colors ${
            mode === "agent" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          🤖 Autonomous Agent
        </button>
        <button
          onClick={() => onChange("decompiler")}
          className={`p-2 text-xs rounded border text-left transition-colors ${
            mode === "decompiler" ? "bg-purple-500/10 border-purple-500 text-purple-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          🔍 Reverse Engineer (Decompile)
        </button>
        <button
          onClick={() => onChange("web3")}
          className={`p-2 text-xs rounded border text-left transition-colors ${
            mode === "web3" ? "bg-orange-500/10 border-orange-500 text-orange-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          ⛓️ Web3 Black-Hat
        </button>
      </div>
    </div>
  );
}
