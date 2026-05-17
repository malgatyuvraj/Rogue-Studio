import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const WORKSPACE_ROOT = path.resolve(process.cwd(), 'rogue_workspace');

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Ensure workspace exists
    if (!fs.existsSync(WORKSPACE_ROOT)) {
      fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
    }

    // ── Mode 1: Raw command execution (used by the agentic loop) ──
    if (body.command && typeof body.command === 'string') {
      const command = body.command;

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: WORKSPACE_ROOT,
          timeout: 300000,          // 5 minute timeout — no artificial limits
          maxBuffer: 50 * 1024 * 1024, // 50MB max output
          env: { ...process.env, HOME: os.homedir() },
        });
        return NextResponse.json({ stdout, stderr });
      } catch (execError: any) {
        return NextResponse.json({
          stdout: execError.stdout || '',
          stderr: execError.stderr || execError.message,
        });
      }
    }

    // ── Mode 2: Legacy single-file execution (existing behavior) ──
    const { code, language } = body;

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Either { command } or { code, language } is required.' },
        { status: 400 }
      );
    }

    let fileName = 'script.txt';
    let command = '';

    const lowerLang = language.toLowerCase();
    if (lowerLang === 'python' || lowerLang === 'py') {
      fileName = `script_${Date.now()}.py`;
      command = `python3 "${WORKSPACE_ROOT}/${fileName}"`;
    } else if (lowerLang === 'bash' || lowerLang === 'sh') {
      fileName = `script_${Date.now()}.sh`;
      command = `bash "${WORKSPACE_ROOT}/${fileName}"`;
    } else if (
      lowerLang === 'javascript' ||
      lowerLang === 'js' ||
      lowerLang === 'typescript' ||
      lowerLang === 'ts'
    ) {
      fileName = `script_${Date.now()}.js`;
      command = `node "${WORKSPACE_ROOT}/${fileName}"`;
    } else {
      return NextResponse.json(
        { error: `Execution for language '${language}' is not supported in the local sandbox yet.` },
        { status: 400 }
      );
    }

    const filePath = path.join(WORKSPACE_ROOT, fileName);
    fs.writeFileSync(filePath, code);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: WORKSPACE_ROOT,
        timeout: 300000,
        maxBuffer: 50 * 1024 * 1024,
      });
      return NextResponse.json({ stdout, stderr });
    } catch (execError: any) {
      return NextResponse.json({
        stdout: execError.stdout || '',
        stderr: execError.stderr || execError.message,
      });
    } finally {
      // Cleanup temp script file
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
