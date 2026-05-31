"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, FileEdit, Terminal, Trash2, Eye, StopCircle } from "lucide-react";

interface AgentLogEntry {
  action: string;
  detail: string;
  status: "running" | "success" | "error";
  output?: string;
}

interface AgentLogPanelProps {
  log: AgentLogEntry[];
  iteration: number;
  maxIterations: number;
  isRunning: boolean;
  onStop: () => void;
}

function LogEntry({ entry, index }: { entry: AgentLogEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    running: <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />,
    success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    error: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  }[entry.status];

  const actionIcon = {
    WRITE_FILE: <FileEdit className="w-3 h-3 text-yellow-400" />,
    READ_FILE: <Eye className="w-3 h-3 text-blue-400" />,
    DELETE_FILE: <Trash2 className="w-3 h-3 text-red-400" />,
    RUN_COMMAND: <Terminal className="w-3 h-3 text-purple-400" />,
    ERROR: <XCircle className="w-3 h-3 text-red-400" />,
    ABORTED: <StopCircle className="w-3 h-3 text-orange-400" />,
  }[entry.action] || <Terminal className="w-3 h-3 text-zinc-400" />;

  return (
    <div className="border-l-2 border-zinc-800 pl-3 py-1.5 hover:border-zinc-600 transition-colors">
      <button
        onClick={() => entry.output && setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left group"
      >
        <span className="text-[10px] text-zinc-600 font-mono w-5">{String(index + 1).padStart(2, "0")}</span>
        {statusIcon}
        {actionIcon}
        <span className="text-xs text-zinc-300 truncate flex-1">{entry.detail}</span>
        {entry.output && (
          expanded
            ? <ChevronDown className="w-3 h-3 text-zinc-500" />
            : <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
        )}
      </button>
      {expanded && entry.output && (
        <pre className="mt-1.5 ml-7 p-2 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-400 overflow-auto max-h-40 font-mono">
          {entry.output}
        </pre>
      )}
    </div>
  );
}

export function AgentLogPanel({ log, iteration, maxIterations, isRunning, onStop }: AgentLogPanelProps) {
  if (log.length === 0 && !isRunning) return null;

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-zinc-300">Agent Timeline</span>
          <span className="text-[10px] text-zinc-500 font-mono">
            Step {iteration}/{maxIterations}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <>
              <span className="flex items-center gap-1 text-[10px] text-blue-400">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Running
              </span>
              <button
                onClick={onStop}
                className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
              >
                Stop
              </button>
            </>
          )}
          {!isRunning && log.length > 0 && (
            <span className="text-[10px] text-zinc-500">
              {log.filter((e) => e.status === "success").length} actions completed
            </span>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
        {log.map((entry, i) => (
          <LogEntry key={i} entry={entry} index={i} />
        ))}
        {isRunning && log.length === 0 && (
          <div className="flex items-center gap-2 p-2 text-xs text-zinc-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Agent is thinking...
          </div>
        )}
      </div>
    </div>
  );
}
