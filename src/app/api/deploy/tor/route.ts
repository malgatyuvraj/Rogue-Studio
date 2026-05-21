import { NextResponse } from "next/server";
import { exec, spawn } from "child_process";
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
    const targetDir = workspacePath || path.join(os.homedir(), ".gemini", "antigravity", "brain");

    // 1. Verify Tor is installed
    try {
      await execAsync("which tor");
    } catch {
      throw new Error("Tor binary not found. Please install Tor to use Ghost Deploy.");
    }

    // 2. Setup directories
    const torDir = path.join(os.tmpdir(), `rogue_tor_${Date.now()}`);
    const hiddenServiceDir = path.join(torDir, "hidden_service");
    await fs.mkdir(hiddenServiceDir, { recursive: true });
    // Tor requires the hidden service directory to be strictly permissioned (0o700)
    await fs.chmod(hiddenServiceDir, 0o700);

    // 3. Find available port (simplified: use random high port)
    const port = Math.floor(Math.random() * 10000) + 10000;

    // 4. Write torrc
    const torrcPath = path.join(torDir, "torrc");
    const torrcContent = `SocksPort 0
HiddenServiceDir ${hiddenServiceDir}
HiddenServicePort 80 127.0.0.1:${port}
`;
    await fs.writeFile(torrcPath, torrcContent);

    // 5. Start Tor daemon
    const torProcess = spawn("tor", ["-f", torrcPath], { detached: true, stdio: "ignore" });
    torProcess.unref();

    // 6. Start HTTP server to serve the workspace
    const serverProcess = spawn("npx", ["-y", "http-server", targetDir, "-p", port.toString(), "-s"], { detached: true, stdio: "ignore" });
    serverProcess.unref();

    // 7. Poll for hostname file
    const hostnamePath = path.join(hiddenServiceDir, "hostname");
    let onionUrl = null;
    for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
      try {
        const hostname = await fs.readFile(hostnamePath, "utf8");
        onionUrl = hostname.trim();
        break;
      } catch {
        // Wait 1s and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!onionUrl) {
      throw new Error("Failed to generate .onion address. Tor daemon might have failed to start.");
    }

    return Response.json({
      status: "active",
      message: "Tor hidden service successfully deployed.",
      onionUrl: `http://${onionUrl}`,
      port
    });

  } catch (err: unknown) {
    return NextResponse.json({
      error: "Tor deployment failed",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
