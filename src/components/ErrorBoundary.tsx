"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-zinc-900 border border-red-500/50 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">💀</div>
            <h1 className="text-xl font-bold text-red-400 mb-2">
              Runtime Error
            </h1>
            <p className="text-zinc-400 text-sm mb-4">
              Something went wrong. This has been logged.
            </p>
            <pre className="bg-zinc-950 border border-zinc-800 rounded p-3 text-xs text-red-300 overflow-auto max-h-40 text-left mb-4">
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
