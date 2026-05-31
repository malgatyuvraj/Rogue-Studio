/**
 * Zero-Day Fuzzer
 * 
 * AI-guided coverage fuzzing with crash triage,
 * input mutation strategies, and auto-exploit generation.
 */

import { randomBytes } from "crypto";

export type FuzzStrategy = "random" | "bitflip" | "arithmetic" | "havoc" | "dictionary" | "grammar" | "ai_guided";

export interface FuzzConfig {
  target: string; // Binary path or URL
  strategy: FuzzStrategy;
  inputFormat: "binary" | "text" | "json" | "xml" | "http";
  maxIterations: number;
  timeout: number; // ms per execution
  dictionary?: string[];
  corpus?: string[];
  coverageGuided: boolean;
}

export interface FuzzResult {
  id: string;
  iteration: number;
  input: string;
  crashed: boolean;
  signal?: string;
  stderr?: string;
  exitCode?: number;
  coverage?: number;
  duration: number;
  newCoverage: boolean;
  crashType?: "segfault" | "overflow" | "heap" | "stack" | "assertion" | "timeout" | "unknown";
}

export interface CrashBucket {
  id: string;
  type: string;
  stackTrace: string;
  minimalInput: string;
  occurrences: number;
  firstSeen: number;
  exploitable: boolean;
  exploitability: "high" | "medium" | "low" | "unknown";
}

export interface FuzzSession {
  id: string;
  config: FuzzConfig;
  startedAt: number;
  iterations: number;
  crashes: CrashBucket[];
  uniquePaths: number;
  currentInput?: string;
  status: "running" | "paused" | "completed" | "crashed";
}

/** Mutate input using various strategies */
export function mutateInput(input: string, strategy: FuzzStrategy, dictionary?: string[]): string {
  switch (strategy) {
    case "random":
      return randomMutate(input);
    case "bitflip":
      return bitflipMutate(input);
    case "arithmetic":
      return arithmeticMutate(input);
    case "havoc":
      return havocMutate(input, dictionary);
    case "dictionary":
      return dictionaryMutate(input, dictionary || DEFAULT_DICTIONARY);
    case "grammar":
      return grammarMutate(input);
    case "ai_guided":
      return aiGuidedMutate(input);
    default:
      return randomMutate(input);
  }
}

function randomMutate(input: string): string {
  const buf = Buffer.from(input);
  const numMutations = Math.floor(Math.random() * 10) + 1;

  for (let i = 0; i < numMutations; i++) {
    const pos = Math.floor(Math.random() * buf.length);
    buf[pos] = Math.floor(Math.random() * 256);
  }

  return buf.toString("binary");
}

function bitflipMutate(input: string): string {
  const buf = Buffer.from(input);
  const pos = Math.floor(Math.random() * buf.length);
  const bit = Math.floor(Math.random() * 8);
  buf[pos] ^= 1 << bit;
  return buf.toString("binary");
}

function arithmeticMutate(input: string): string {
  const buf = Buffer.from(input);
  const pos = Math.floor(Math.random() * buf.length);
  const delta = Math.floor(Math.random() * 35) - 17; // -17 to +17
  buf[pos] = (buf[pos] + delta) & 0xff;
  return buf.toString("binary");
}

function havocMutate(input: string, dictionary?: string[]): string {
  let result = input;
  const ops = Math.floor(Math.random() * 8) + 1;

  for (let i = 0; i < ops; i++) {
    const op = Math.floor(Math.random() * 7);
    switch (op) {
      case 0: result = randomMutate(result); break;
      case 1: result = bitflipMutate(result); break;
      case 2: result = arithmeticMutate(result); break;
      case 3: // Insert random bytes
        const pos = Math.floor(Math.random() * result.length);
        const bytes = randomBytes(Math.floor(Math.random() * 16) + 1).toString("binary");
        result = result.slice(0, pos) + bytes + result.slice(pos);
        break;
      case 4: // Delete bytes
        const start = Math.floor(Math.random() * result.length);
        const len = Math.floor(Math.random() * 8) + 1;
        result = result.slice(0, start) + result.slice(start + len);
        break;
      case 5: // Repeat section
        const rstart = Math.floor(Math.random() * result.length);
        const rlen = Math.floor(Math.random() * 16) + 1;
        result = result.slice(0, rstart) + result.slice(rstart, rstart + rlen).repeat(3) + result.slice(rstart + rlen);
        break;
      case 6: // Dictionary insert
        if (dictionary && dictionary.length > 0) {
          const dpos = Math.floor(Math.random() * result.length);
          const word = dictionary[Math.floor(Math.random() * dictionary.length)];
          result = result.slice(0, dpos) + word + result.slice(dpos);
        }
        break;
    }
  }

  return result;
}

function dictionaryMutate(input: string, dictionary: string[]): string {
  if (dictionary.length === 0) return randomMutate(input);
  const word = dictionary[Math.floor(Math.random() * dictionary.length)];
  const pos = Math.floor(Math.random() * input.length);
  return input.slice(0, pos) + word + input.slice(pos + word.length);
}

function grammarMutate(input: string): string {
  // Grammar-aware mutations for structured inputs
  // Replace format specifiers, boundary values, etc.
  const replacements = [
    [/%s/g, "A".repeat(4096)],
    [/%d/g, String(2147483647)],
    [/%x/g, "DEADBEEF"],
    [/"[^"]*"/g, `"${"A".repeat(1024)}"`],
    [/\d+/g, "4294967295"],
    [/null/g, "undefined"],
    [/true/g, `"${"\\x00".repeat(256)}"`],
  ] as const;

  let result = input;
  const replacement = replacements[Math.floor(Math.random() * replacements.length)];
  result = result.replace(replacement[0], String(replacement[1]));
  return result;
}

function aiGuidedMutate(input: string): string {
  // AI-guided: focus on interesting boundary positions
  // In production, this would query the LLM for mutation hints
  const interestingBytes = [0x00, 0x01, 0x7f, 0x80, 0xff, 0x41, 0x0a, 0x0d];
  const buf = Buffer.from(input);

  // Target boundary positions (start, end, powers of 2)
  const positions = [0, buf.length - 1, 4, 8, 16, 32, 64, 128, 256].filter((p) => p < buf.length);
  const pos = positions[Math.floor(Math.random() * positions.length)];
  buf[pos] = interestingBytes[Math.floor(Math.random() * interestingBytes.length)];

  return buf.toString("binary");
}

/** Default fuzzing dictionary (common attack strings) */
const DEFAULT_DICTIONARY = [
  "\x00",
  "\x00\x00\x00\x00",
  "\xff\xff\xff\xff",
  "%n%n%n%n",
  "%s%s%s%s",
  "%x%x%x%x",
  "A".repeat(256),
  "A".repeat(1024),
  "A".repeat(4096),
  "../../../etc/passwd",
  "{{7*7}}",
  "${7*7}",
  "'; DROP TABLE--",
  "<script>alert(1)</script>",
  "\x41\x41\x41\x41\x41\x41\x41\x41",
  String.fromCharCode(0x7fffffff),
  "-1",
  "0",
  "2147483647",
  "4294967295",
  "NaN",
  "Infinity",
  "null",
  "undefined",
];

/** Triage a crash to determine exploitability */
export function triageCrash(signal: string, stderr: string): CrashBucket["exploitability"] {
  const stderrLower = stderr.toLowerCase();

  // High exploitability indicators
  if (stderrLower.includes("heap-buffer-overflow") || stderrLower.includes("heap-use-after-free")) {
    return "high";
  }
  if (signal === "SIGSEGV" && stderrLower.includes("write")) return "high";
  if (stderrLower.includes("stack-buffer-overflow")) return "high";

  // Medium exploitability
  if (signal === "SIGSEGV") return "medium";
  if (stderrLower.includes("double-free")) return "medium";
  if (stderrLower.includes("null-dereference")) return "medium";

  // Low exploitability
  if (signal === "SIGABRT") return "low";
  if (stderrLower.includes("assertion")) return "low";

  return "unknown";
}

/** Create a new fuzzing session */
export function createFuzzSession(config: FuzzConfig): FuzzSession {
  return {
    id: `fuzz_${Date.now()}_${randomBytes(3).toString("hex")}`,
    config,
    startedAt: Date.now(),
    iterations: 0,
    crashes: [],
    uniquePaths: 0,
    status: "running",
  };
}

/** Generate initial corpus for a target type */
export function generateCorpus(inputFormat: FuzzConfig["inputFormat"], count = 10): string[] {
  const corpus: string[] = [];

  switch (inputFormat) {
    case "json":
      corpus.push('{}', '{"key":"value"}', '{"a":1,"b":true,"c":null}', '{"arr":[1,2,3]}', '{"nested":{"deep":{"value":0}}}');
      break;
    case "xml":
      corpus.push('<?xml version="1.0"?><root/>', '<root><child attr="val">text</child></root>', '<a><b><c/></b></a>');
      break;
    case "http":
      corpus.push('GET / HTTP/1.1\r\nHost: target\r\n\r\n', 'POST /api HTTP/1.1\r\nContent-Length: 4\r\n\r\ntest');
      break;
    case "text":
      corpus.push("hello", "test input", "A".repeat(100), "\n".repeat(50));
      break;
    default:
      for (let i = 0; i < count; i++) {
        corpus.push(randomBytes(Math.floor(Math.random() * 256) + 1).toString("binary"));
      }
  }

  return corpus;
}

export { DEFAULT_DICTIONARY };
