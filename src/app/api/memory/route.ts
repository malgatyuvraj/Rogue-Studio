import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { assertLocalhost } from "@/lib/security";
import {
  MemoryStore,
  MemoryEntry,
  createMemoryEntry,
  searchMemory,
  pruneMemory,
  MemoryType,
  MEMORY_FILE,
} from "@/lib/agentMemory";

const MEMORY_PATH = path.resolve(process.cwd(), "rogue_workspace", MEMORY_FILE);

function loadStore(): MemoryStore {
  try {
    if (fs.existsSync(MEMORY_PATH)) {
      const data = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf-8"));
      return data as MemoryStore;
    }
  } catch {
    // Corrupted file — start fresh
  }
  return { entries: [], version: 1 };
}

function saveStore(store: MemoryStore): void {
  const dir = path.dirname(MEMORY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(store, null, 2), "utf-8");
}

/** GET /api/memory?query=...&type=...&limit=... — Search memories */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") || "";
  const type = url.searchParams.get("type") as MemoryType | null;
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const store = loadStore();

  if (query) {
    const results = searchMemory(store, query, type || undefined, limit);
    return NextResponse.json({ success: true, results, total: store.entries.length });
  }

  // Return all entries (most recent first) if no query
  const entries = [...store.entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  return NextResponse.json({ success: true, results: entries, total: store.entries.length });
}

/** POST /api/memory — Add a memory entry */
export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const { type, content, tags, target, phase } = body;

    if (!type || !content) {
      return NextResponse.json({ error: "type and content are required" }, { status: 400 });
    }

    const entry: MemoryEntry = createMemoryEntry(
      type as MemoryType,
      content,
      tags || [],
      target,
      phase
    );

    const store = loadStore();
    store.entries.push(entry);
    const pruned = pruneMemory(store);
    saveStore(pruned);

    return NextResponse.json({ success: true, entry, total: pruned.entries.length });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/** DELETE /api/memory — Clear all memories or specific entry */
export async function DELETE(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      const store = loadStore();
      store.entries = store.entries.filter((e) => e.id !== id);
      saveStore(store);
      return NextResponse.json({ success: true, deleted: id });
    }

    // Clear all
    saveStore({ entries: [], version: 1 });
    return NextResponse.json({ success: true, cleared: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
