import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">👻</div>
        <h1 className="text-2xl font-bold text-zinc-200 mb-2">404 — Not Found</h1>
        <p className="text-zinc-500 text-sm mb-6">
          This page doesn&apos;t exist in any dimension.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
        >
          Return to Base
        </Link>
      </div>
    </div>
  );
}
