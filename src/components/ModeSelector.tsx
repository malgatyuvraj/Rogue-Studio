export type Mode = "agent" | "decompiler" | "web3";

const MODES = [
  {
    id: "agent",
    label: "Agent Mode",
    icon: "🤖",
    description: "Standard AI coding agent"
  },
  {
    id: "decompiler",
    label: "Reverse Engineer",
    icon: "🔬",
    description: "De-obfuscate, decompile, reconstruct any code or binary"
  },
  {
    id: "web3",
    label: "Web3 Black-Hat",
    icon: "⛓️",
    description: "Smart contract exploit & vulnerability PoC generator"
  }
];

interface ModeSelectorProps {
  activeMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
        Prompt Presets
      </label>
      <div className="grid grid-cols-1 gap-2">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id as Mode)}
            className={`p-2 text-xs rounded border text-left transition-colors flex flex-col gap-1 ${
              activeMode === mode.id 
                ? (mode.id === 'decompiler' || mode.id === 'web3')
                  ? "bg-amber-900/20 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                  : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <div className="font-bold flex items-center gap-2">
              <span>{mode.icon}</span>
              {mode.label}
            </div>
            <div className={`text-[10px] ${activeMode === mode.id ? 'opacity-90' : 'opacity-60'}`}>
              {mode.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
