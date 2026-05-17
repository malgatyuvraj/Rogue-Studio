import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// All workspace operations are sandboxed to this directory
const WORKSPACE_ROOT = path.resolve(process.cwd(), 'rogue_workspace');

export async function POST(req: Request) {
  try {
    const { filepath, content } = await req.json();

    if (!filepath || typeof filepath !== 'string') {
      return NextResponse.json({ error: 'filepath is required' }, { status: 400 });
    }
    if (content === undefined || content === null) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // Sanitize: resolve and ensure we never escape the workspace root
    const resolved = path.resolve(WORKSPACE_ROOT, filepath);
    if (!resolved.startsWith(WORKSPACE_ROOT)) {
      return NextResponse.json({ error: 'Path traversal denied' }, { status: 403 });
    }

    // Create directories recursively if they don't exist
    const dir = path.dirname(resolved);
    fs.mkdirSync(dir, { recursive: true });

    // Write the file
    fs.writeFileSync(resolved, content, 'utf-8');

    return NextResponse.json({
      success: true,
      path: path.relative(WORKSPACE_ROOT, resolved),
      bytes: Buffer.byteLength(content, 'utf-8'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
