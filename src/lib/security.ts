import { NextResponse } from "next/server";

/**
 * Validates that the request is coming from localhost.
 * Used to protect dangerous endpoints (execute, forge, workspace mutations)
 * from being accessed when deployed publicly.
 * 
 * Set LOCALHOST_ONLY=false in env to disable (e.g., in Docker with proper network isolation).
 */
export function assertLocalhost(req: Request): NextResponse | null {
  const localhostOnly = process.env.LOCALHOST_ONLY !== "false";

  if (!localhostOnly) return null; // Guard disabled

  const host = req.headers.get("host") || "";
  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]");

  if (!isLocal) {
    return NextResponse.json(
      {
        error: "Access denied",
        details:
          "This endpoint is restricted to localhost. Set LOCALHOST_ONLY=false in your environment to allow remote access (only do this behind a reverse proxy with auth).",
      },
      { status: 403 }
    );
  }

  return null; // Access granted
}

/**
 * Sanitizes a string to be safely used as a command argument.
 * Allows only alphanumeric, hyphens, underscores, dots, slashes, and colons.
 * Rejects anything with shell metacharacters.
 */
export function sanitizeCommandArg(input: string): string | null {
  // Allow model IDs like "hf.co/org/model-name:tag" and paths
  const safe = /^[a-zA-Z0-9._\-/:@]+$/;
  if (!safe.test(input)) return null;
  return input;
}
