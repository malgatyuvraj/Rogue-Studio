import { NextResponse } from "next/server";

/**
 * GET /api/models
 * 
 * Probes the local Ollama instance for available models.
 * Used by the frontend to auto-populate the model selector
 * instead of requiring manual entry.
 */
export async function GET() {
  const ollamaBase = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

  try {
    const response = await fetch(`${ollamaBase}/api/tags`, {
      signal: AbortSignal.timeout(3000), // 3s timeout — don't hang if Ollama is down
    });

    if (!response.ok) {
      return NextResponse.json({
        available: false,
        models: [],
        error: `Ollama returned ${response.status}`,
      });
    }

    const data = await response.json();
    const models = (data.models || []).map(
      (m: { name: string; size: number; modified_at: string }) => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at,
      })
    );

    return NextResponse.json({
      available: true,
      models,
      endpoint: ollamaBase,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      available: false,
      models: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not connect to Ollama. Is it running?",
    });
  }
}
