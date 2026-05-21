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
    return NextResponse.json({ torAvailable: true });
  } catch {
    return NextResponse.json({
      torAvailable: false,
      installInstructions: {
        mac: "brew install tor",
        linux: "sudo apt install tor",
        windows: "Download from https://www.torproject.org"
      }
    });
  }
}

export async function POST(req: Request) {
  if (process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT) {
    return NextResponse.json({
      error: "Ghost Deploy requires local deployment. This instance is cloud-hosted."
    }, { status: 501 });
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
    
    // For now, we simulate the success if tor is installed.
    await execAsync("which tor");
    
    const simulatedOnion = "rogue" + Math.random().toString(36).substring(2, 15) + "v3.onion";

    return NextResponse.json({
      success: true,
      url: `http://${simulatedOnion}`,
      message: `Tor Hidden Service established for ${targetDir}. (Simulation active)`
    });

  } catch (err: any) {
    return NextResponse.json({
      error: "Tor deployment failed",
      details: err.message
    }, { status: 500 });
  }
}
