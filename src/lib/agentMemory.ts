/**
 * Agent Memory — Persistent Learning System
 * 
 * Stores successful attack patterns, failed approaches, and
 * learned strategies across sessions. Backed by filesystem JSON.
 * 
 * Memory types:
 * - exploit_success: A technique that worked
 * - exploit_failed: A technique that didn't work (avoid repeating)
 * - pattern: A reusable pattern/strategy
 * - context: Environmental facts (target OS, stack, etc.)
 */

export type MemoryType = "exploit_success" | "exploit_failed" | "pattern" | "context";

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  tags: string[];
  target?: string;
  phase?: string;
  createdAt: number;
  relevanceScore: number; // 0-1, decays over time
}

export interface MemoryStore {
  entries: MemoryEntry[];
  version: number;
}

const MEMORY_FILE = "agent_memory.json";
const MAX_ENTRIES = 500;
const RELEVANCE_DECAY_PER_DAY = 0.02;

/** Create a new memory entry */
export function createMemoryEntry(
  type: MemoryType,
  content: string,
  tags: string[] = [],
  target?: string,
  phase?: string
): MemoryEntry {
  return {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    content,
    tags,
    target,
    phase,
    createdAt: Date.now(),
    relevanceScore: 1.0,
  };
}

/** Apply time-based relevance decay */
export function decayRelevance(entry: MemoryEntry): number {
  const daysSince = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24);
  const decayed = entry.relevanceScore - daysSince * RELEVANCE_DECAY_PER_DAY;
  return Math.max(0.1, decayed); // Never goes below 0.1
}

/** Search memories by relevance to a query */
export function searchMemory(
  store: MemoryStore,
  query: string,
  type?: MemoryType,
  maxResults: number = 10
): MemoryEntry[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  let candidates = store.entries;
  if (type) {
    candidates = candidates.filter((e) => e.type === type);
  }

  // Score by term overlap + tag match + relevance decay
  const scored = candidates.map((entry) => {
    const contentLower = entry.content.toLowerCase();
    const tagStr = entry.tags.join(" ").toLowerCase();

    let score = decayRelevance(entry);

    // Term matching
    for (const term of queryTerms) {
      if (contentLower.includes(term)) score += 0.3;
      if (tagStr.includes(term)) score += 0.5;
    }

    // Boost successful exploits
    if (entry.type === "exploit_success") score += 0.2;

    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((s) => s.entry);
}

/** Format memories for inclusion in an agent prompt */
export function formatMemoryForPrompt(entries: MemoryEntry[]): string[] {
  return entries.map((e) => {
    const typeLabel = {
      exploit_success: "✓ WORKED",
      exploit_failed: "✗ FAILED",
      pattern: "📋 PATTERN",
      context: "🔍 CONTEXT",
    }[e.type];

    return `[${typeLabel}] ${e.content}${e.tags.length > 0 ? ` (tags: ${e.tags.join(", ")})` : ""}`;
  });
}

/** Prune old/low-relevance entries to stay under MAX_ENTRIES */
export function pruneMemory(store: MemoryStore): MemoryStore {
  if (store.entries.length <= MAX_ENTRIES) return store;

  // Sort by decayed relevance, keep top entries
  const scored = store.entries.map((e) => ({
    entry: e,
    score: decayRelevance(e),
  }));
  scored.sort((a, b) => b.score - a.score);

  return {
    entries: scored.slice(0, MAX_ENTRIES).map((s) => s.entry),
    version: store.version,
  };
}

/** Extract learnings from a completed attack chain for memory storage */
export function extractLearnings(
  phaseOutput: string,
  phase: string,
  success: boolean,
  target: string
): MemoryEntry[] {
  const learnings: MemoryEntry[] = [];

  if (success) {
    // Extract the technique that worked
    learnings.push(
      createMemoryEntry(
        "exploit_success",
        `In phase "${phase}" against target type "${target}": ${phaseOutput.slice(0, 300)}`,
        [phase, target],
        target,
        phase
      )
    );
  } else {
    // Record what failed so we don't repeat it
    learnings.push(
      createMemoryEntry(
        "exploit_failed",
        `Failed approach in "${phase}" against "${target}": ${phaseOutput.slice(0, 200)}`,
        [phase, target, "failed"],
        target,
        phase
      )
    );
  }

  return learnings;
}

export { MEMORY_FILE, MAX_ENTRIES };
