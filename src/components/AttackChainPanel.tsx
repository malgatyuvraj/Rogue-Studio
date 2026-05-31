"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  AttackChainState,
  AttackPhase,
  PHASE_ORDER,
  PHASE_META,
} from "@/lib/attackChain";
import {
  Target,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCw,
  Square,
  Clock,
  Brain,
} from "lucide-react";

interface AttackChainPanelProps {
  chain: AttackChainState;
  phaseStream: string;
  onAbort: () => void;
  onReset: () => void;
}

function PhaseNode({
  phase,
  chain,
  phaseStream,
  isActive,
}: {
  phase: AttackPhase;
  chain: AttackChainState;
  phaseStream: string;
  isActive: boolean;
}) {
  const [manualExpand, setManualExpand] = useState(isActive);
  const meta = PHASE_META[phase];
  const result = chain.phases.find((p) => p.phase === phase);
  const streamRef = useRef<HTMLPreElement>(null);

  // Auto-scroll streaming output
  useEffect(() => {
    if (isActive && streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [phaseStream, isActive]);

  // Auto-expand active phase
  const expanded = isActive || manualExpand;

  const getStatus = () => {
    if (isActive) return "running";
    if (result?.success) return "success";
    if (result && !result.success) return "failed";
    return "pending";
  };

  const status = getStatus();

  const statusColors = {
    running: "border-blue-500/50 bg-blue-500/5",
    success: "border-emerald-500/30 bg-emerald-500/5",
    failed: "border-red-500/30 bg-red-500/5",
    pending: "border-zinc-800 bg-zinc-900/30",
  };

  const statusIcons = {
    running: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    failed: <XCircle className="w-4 h-4 text-red-400" />,
    pending: <div className="w-4 h-4 rounded-full border-2 border-zinc-700" />,
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${statusColors[status]}`}>
      {/* Phase Header */}
      <button
        onClick={() => setManualExpand(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        {statusIcons[status]}
        <span className="text-sm">{meta.icon}</span>
        <span className="text-sm font-bold text-zinc-200 flex-1">{meta.label}</span>

        {result && (
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            {result.pivotCount > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <RotateCw className="w-3 h-3" />
                {result.pivotCount} pivots
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(result.duration / 1000).toFixed(1)}s
            </span>
            {result.findings.length > 0 && (
              <span className="text-emerald-400">{result.findings.length} findings</span>
            )}
          </div>
        )}

        {expanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        )}
      </button>

      {/* Phase Content */}
      {expanded && (
        <div className="border-t border-zinc-800/50">
          {/* Findings */}
          {result && result.findings.length > 0 && (
            <div className="px-4 py-2 border-b border-zinc-800/50 bg-zinc-950/50">
              <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Findings</p>
              <ul className="space-y-0.5">
                {result.findings.map((f, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Streaming output */}
          <pre
            ref={streamRef}
            className="px-4 py-3 text-[11px] text-zinc-400 font-mono whitespace-pre-wrap overflow-auto max-h-64 leading-relaxed"
          >
            {isActive ? phaseStream || "Initializing phase..." : result?.output?.slice(0, 2000) || "Waiting..."}
            {isActive && (
              <span className="inline-block w-2 h-4 bg-blue-400/70 animate-pulse ml-0.5" />
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

export function AttackChainPanel({ chain, phaseStream, onAbort, onReset }: AttackChainPanelProps) {
  const isRunning = chain.currentPhase !== "idle" && chain.currentPhase !== "complete" && chain.currentPhase !== "aborted";
  const elapsedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isRunning || !chain.startedAt) return;
    const id = setInterval(() => {
      if (elapsedRef.current) {
        elapsedRef.current.textContent = `${Math.round(((chain.completedAt || Date.now()) - chain.startedAt) / 1000)}s`;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, chain.startedAt, chain.completedAt]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
        <div className="flex items-center gap-3">
          <Target className="w-4 h-4 text-red-400" />
          <div>
            <h3 className="text-xs font-bold text-zinc-200">Attack Chain</h3>
            {chain.target && (
              <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                {chain.target}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <>
              <span ref={elapsedRef} className="text-[10px] text-zinc-500">0s</span>
              <button
                onClick={onAbort}
                className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold hover:bg-red-500/30 transition-colors"
              >
                <Square className="w-3 h-3" /> Abort
              </button>
            </>
          )}
          {(chain.currentPhase === "complete" || chain.currentPhase === "aborted") && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded text-[10px] hover:bg-zinc-700 transition-colors"
            >
              <RotateCw className="w-3 h-3" /> New Chain
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {chain.phases.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800/50 bg-zinc-950/50">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <Brain className="w-3 h-3 text-purple-400" />
            <span>{chain.totalPivots} pivots</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{chain.phases.filter((p) => p.success).length}/{chain.phases.length} phases OK</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <Target className="w-3 h-3 text-red-400" />
            <span>{chain.phases.reduce((a, p) => a + p.findings.length, 0)} total findings</span>
          </div>
        </div>
      )}

      {/* Phase Timeline */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {PHASE_ORDER.map((phase) => (
          <PhaseNode
            key={phase}
            phase={phase}
            chain={chain}
            phaseStream={phaseStream}
            isActive={chain.currentPhase === phase}
          />
        ))}

        {/* Completion Banner */}
        {chain.currentPhase === "complete" && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
            <p className="text-sm font-bold text-emerald-400">
              ✓ Attack Chain Complete
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              {chain.phases.reduce((a, p) => a + p.findings.length, 0)} findings •{" "}
              {chain.totalPivots} auto-pivots •{" "}
              {((chain.completedAt! - chain.startedAt) / 1000).toFixed(1)}s total
            </p>
          </div>
        )}

        {chain.currentPhase === "aborted" && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <p className="text-sm font-bold text-red-400">⬛ Chain Aborted</p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Stopped at {PHASE_META[chain.phases[chain.phases.length - 1]?.phase]?.label || "unknown"} phase
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
