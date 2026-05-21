import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { modelId } = await req.json();
    
    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // We assume heretic-master is adjacent to the studio folder
        const hereticDir = path.resolve(process.cwd(), '../../heretic-master');
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `Initializing Model Forge...\nTarget Model: ${modelId}\nWorking Directory: ${hereticDir}\n\nRunning: uv run heretic ${modelId}\n\n` })}\n\n`));
        
        const child = spawn('uv', ['run', 'heretic', modelId], {
          cwd: hereticDir,
          shell: true
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
