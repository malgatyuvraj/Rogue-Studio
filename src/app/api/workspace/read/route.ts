import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORKSPACE_ROOT = path.resolve(process.cwd(), 'rogue_workspace');

export async function POST(req: Request) {
  try {
    const { filepath } = await req.json();

    if (!filepath || typeof filepath !== 'string') {
      return NextResponse.json({ error: 'filepath is required' }, { status: 400 });
    }

    const resolved = path.resolve(WORKSPACE_ROOT, filepath);
    if (!resolved.startsWith(WORKSPACE_ROOT)) {
      return NextResponse.json({ error: 'Path traversal denied' }, { status: 403 });
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: `File not found: ${filepath}` }, { status: 404 });
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      return NextResponse.json({ error: 'Path is a directory, not a file' }, { status: 400 });
    }

    const content = fs.readFileSync(resolved, 'utf-8');

    return NextResponse.json({
      success: true,
      path: path.relative(WORKSPACE_ROOT, resolved),
      content,
      bytes: stat.size,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
