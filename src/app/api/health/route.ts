import { NextResponse } from "next/server";

/**
 * GET /api/health — Health check endpoint for Docker/k8s probes.
 * Returns 200 with system status info.
 */
export async function GET() {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  let ollamaStatus: "ok" | "unreachable" = "unreachable";

  try {
    const res = await fetch(`${ollamaUrl}/api/version`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) ollamaStatus = "ok";
  } catch {
    // Ollama not reachable — not a hard failure
  }

  return NextResponse.json({
    status: "ok",
    version: process.env.npm_package_version || "0.3.0",
    uptime: process.uptime(),
    node: process.version,
    ollama: ollamaStatus,
    timestamp: new Date().toISOString(),
  });
}
