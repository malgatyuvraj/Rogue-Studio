import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function GET() {
  try {
    await execAsync("which tor");
    return Response.json({ torAvailable: true });
  } catch {
    return Response.json({
      torAvailable: false,
      installInstructions: {
        mac: "brew install tor",
        linux: "sudo apt install tor",
        windows: "Download Tor Expert Bundle from https://www.torproject.org/download/tor/"
      }
    });
  }
}

export async function POST(req: Request) {
  // Block cloud-hosted deployments — Tor requires local binary
  if (process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT || process.env.FLY_APP_NAME) {
    return Response.json(
      {
        error: "Ghost Deploy requires a local self-hosted deployment.",
        details: "This instance is running on a cloud provider. Run Rogue Studio locally to use Tor .onion hosting."
      },
      { status: 501 }
    );
  }

  try {
    const { workspacePath } = await req.json();
    
    // Validate or default path
    const targetDir = workspacePath || path.join(os.homedir(), ".gemini", "antigravity", "brain");

    // In a full implementation, this would:
    // 1. Spawn `npx http-server` on a random port (e.g. 8080)
    // 2. Write a temporary torrc mapping HiddenServiceDir to port 8080
    // 3. Spawn `tor -f torrc`
    // 4. Return the generated .onion address
    
    // TODO: Real Tor daemon spawn — requires local binary (detected via GET /api/deploy/tor)
    return Response.json({
      status: "simulated",
      message: "Tor daemon not yet integrated. Use GET /api/deploy/tor to check binary availability.",
      onionUrl: null
    });

  } catch (err: any) {
    return NextResponse.json({
      error: "Tor deployment failed",
      details: err.message
    }, { status: 500 });
  }
}
