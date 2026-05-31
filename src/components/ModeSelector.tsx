export type Mode = "agent" | "decompiler" | "web3" | "osint" | "payload" | "fuzzer" | "warroom" | "binary" | "anon" | "chainmon" | "identity" | "contract" | "ipfs";

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
  },
  {
    id: "osint",
    label: "OSINT Recon",
    icon: "🕵️",
    description: "Dark web intelligence, breach lookups, target profiling"
  },
  {
    id: "payload",
    label: "Payload Forge",
    icon: "💣",
    description: "Generate shellcode, reverse shells, staged payloads"
  },
  {
    id: "fuzzer",
    label: "Protocol Fuzzer",
    icon: "🎯",
    description: "Malformed inputs to crash parsers, protocols, and APIs"
  },
  {
    id: "warroom",
    label: "War Room",
    icon: "🪖",
    description: "Multi-agent coordinated attack simulation"
  },
  {
    id: "binary",
    label: "Binary Analysis",
    icon: "⚙️",
    description: "ELF/PE/Mach-O disassembly, ROP gadgets, symbols"
  },
  {
    id: "anon",
    label: "Anonymous Ops",
    icon: "👻",
    description: "Tor routing, identity masking, traffic anonymization"
  },
  {
    id: "chainmon",
    label: "Chain Monitor",
    icon: "📡",
    description: "Real-time blockchain tx monitoring and whale alerts"
  },
  {
    id: "identity",
    label: "Identity Rotation",
    icon: "🎭",
    description: "Generate and rotate synthetic identities and fingerprints"
  },
  {
    id: "contract",
    label: "Contract Exploit",
    icon: "💀",
    description: "Automated smart contract vulnerability exploitation"
  },
  {
    id: "ipfs",
    label: "IPFS Storage",
    icon: "📦",
    description: "Decentralized storage, pin content, ghost deploys"
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
        Mode
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id as Mode)}
            title={mode.description}
            className={`px-2 py-1.5 text-[11px] rounded border text-left transition-all flex items-center gap-1.5 truncate ${
              activeMode === mode.id 
                ? (mode.id === 'agent')
                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-semibold"
                  : "bg-amber-900/20 border-amber-500/50 text-amber-400 font-semibold"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <span className="text-sm shrink-0">{mode.icon}</span>
            <span className="truncate">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
