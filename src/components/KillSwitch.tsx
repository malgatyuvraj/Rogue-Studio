interface KillSwitchProps {
  active: boolean;
  onToggle: () => void;
}

export function KillSwitch({ active, onToggle }: KillSwitchProps) {
  return (
    <button
      onClick={onToggle}
      title={active ? "Air-Gap ACTIVE — only Ollama permitted" : "Air-Gap INACTIVE"}
      className={`
        relative w-16 h-16 rounded-full border-4 font-black text-xs
        transition-all duration-300 select-none shrink-0
        ${active
          ? "bg-red-950 border-red-500 text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.6)]"
          : "bg-zinc-900 border-zinc-600 text-zinc-500 hover:border-zinc-400"
        }
      `}
    >
      {active ? "🔒 ON" : "OFF"}
    </button>
  );
}
