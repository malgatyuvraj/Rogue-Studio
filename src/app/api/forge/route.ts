import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { assertLocalhost, sanitizeCommandArg } from '@/lib/security';

export async function POST(req: Request) {
  // Security: restrict to localhost unless explicitly disabled
  const guard = assertLocalhost(req);
  if (guard) return guard;

  try {
    const { modelId } = await req.json();
    
    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    // Security: sanitize modelId to prevent command injection
    const safeModelId = sanitizeCommandArg(modelId);
    if (!safeModelId) {
      return NextResponse.json(
        { error: "Invalid model ID. Only alphanumeric, hyphens, dots, slashes, and colons are allowed." },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // We assume heretic-master is adjacent to the studio folder
        const hereticDir = path.resolve(process.cwd(), '../../heretic-master');
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `Initializing Model Forge...\nTarget Model: ${safeModelId}\nWorking Directory: ${hereticDir}\n\nRunning: uv run heretic ${safeModelId}\n\n` })}\n\n`));
        
        const child = spawn('uv', ['run', 'heretic', safeModelId], {
          cwd: hereticDir,
          shell: false
        });
        
        child.stdout.on('data', (data) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: data.toString() })}\n\n`));
        });
        
        child.stderr.on('data', (data) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: data.toString() })}\n\n`));
        });
        
        child.on('close', (code) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `\n\n[PROCESS TERMINATED] Exit code: ${code}\n` })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, code })}\n\n`));
          controller.close();
        });
        
        child.on('error', (err) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
