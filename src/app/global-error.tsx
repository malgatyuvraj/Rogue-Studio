"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="max-w-lg w-full bg-zinc-900 border border-red-500/50 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">☠️</div>
          <h1 className="text-xl font-bold text-red-400 mb-2">
            Application Error
          </h1>
          <p className="text-zinc-400 text-sm mb-4">
            A critical error occurred. Error ID: {error.digest || "unknown"}
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 rounded p-3 text-xs text-red-300 overflow-auto max-h-40 text-left mb-4">
            {error.message}
          </pre>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
