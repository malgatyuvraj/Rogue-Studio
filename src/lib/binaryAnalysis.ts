/**
 * Binary Necromancy
 * 
 * Upload any binary → decompile → find vulns → patch or weaponize.
 * Supports ELF, PE, Mach-O analysis with Ghidra/radare2 integration.
 */

import { execSync } from "child_process";

export type BinaryFormat = "elf" | "pe" | "macho" | "raw" | "unknown";
export type Arch = "x86" | "x86_64" | "arm" | "arm64" | "mips" | "unknown";

export interface BinaryInfo {
  format: BinaryFormat;
  arch: Arch;
  bits: 32 | 64;
  endian: "little" | "big";
  entryPoint: string;
  sections: Section[];
  imports: string[];
  exports: string[];
  strings: string[];
  size: number;
  hash: { md5: string; sha256: string };
}

export interface Section {
  name: string;
  virtualAddress: string;
  size: number;
  permissions: string;
  entropy: number;
}

export interface BinaryVuln {
  type: "buffer_overflow" | "format_string" | "use_after_free" | "integer_overflow" | "command_injection" | "hardcoded_cred" | "crypto_weakness";
  address: string;
  function: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  exploitable: boolean;
}

export interface DecompileResult {
  function: string;
  address: string;
  pseudoCode: string;
  callees: string[];
  callers: string[];
}

/** Detect binary format from magic bytes */
export function detectFormat(headerHex: string): { format: BinaryFormat; arch: Arch; bits: 32 | 64 } {
  // ELF: 7f 45 4c 46
  if (headerHex.startsWith("7f454c46")) {
    const elfClass = headerHex.slice(8, 10);
    const bits = elfClass === "02" ? 64 : 32;
    const archByte = headerHex.slice(36, 40);
    let arch: Arch = "unknown";
    if (archByte === "3e00") arch = "x86_64";
    else if (archByte === "0300") arch = "x86";
    else if (archByte === "b700") arch = "arm64";
    else if (archByte === "2800") arch = "arm";
    return { format: "elf", arch, bits };
  }

  // PE: 4d 5a (MZ)
  if (headerHex.startsWith("4d5a")) {
    return { format: "pe", arch: "x86_64", bits: 64 }; // Simplified
  }

  // Mach-O: feedface (32) or feedfacf (64)
  if (headerHex.startsWith("feedfacf")) {
    return { format: "macho", arch: "x86_64", bits: 64 };
  }
  if (headerHex.startsWith("feedface")) {
    return { format: "macho", arch: "x86", bits: 32 };
  }
  // Mach-O ARM64: cffaedfe
  if (headerHex.startsWith("cffaedfe")) {
    return { format: "macho", arch: "arm64", bits: 64 };
  }

  return { format: "unknown", arch: "unknown", bits: 64 };
}

/** Dangerous functions that indicate potential vulnerabilities */
const DANGEROUS_FUNCTIONS = [
  { name: "strcpy", vuln: "buffer_overflow" as const, severity: "high" as const },
  { name: "strcat", vuln: "buffer_overflow" as const, severity: "high" as const },
  { name: "sprintf", vuln: "buffer_overflow" as const, severity: "high" as const },
  { name: "gets", vuln: "buffer_overflow" as const, severity: "critical" as const },
  { name: "scanf", vuln: "buffer_overflow" as const, severity: "high" as const },
  { name: "printf", vuln: "format_string" as const, severity: "critical" as const },
  { name: "fprintf", vuln: "format_string" as const, severity: "high" as const },
  { name: "system", vuln: "command_injection" as const, severity: "critical" as const },
  { name: "popen", vuln: "command_injection" as const, severity: "critical" as const },
  { name: "exec", vuln: "command_injection" as const, severity: "critical" as const },
  { name: "free", vuln: "use_after_free" as const, severity: "high" as const },
  { name: "malloc", vuln: "use_after_free" as const, severity: "medium" as const },
  { name: "atoi", vuln: "integer_overflow" as const, severity: "medium" as const },
];

/** Analyze imports for dangerous function usage */
export function analyzeImports(imports: string[]): BinaryVuln[] {
  const vulns: BinaryVuln[] = [];

  for (const imp of imports) {
    const funcName = imp.split("@")[0].replace(/^_/, "");
    const dangerous = DANGEROUS_FUNCTIONS.find((d) => funcName.includes(d.name));
    if (dangerous) {
      vulns.push({
        type: dangerous.vuln,
        address: "0x0",
        function: funcName,
        description: `Import of dangerous function '${funcName}' — potential ${dangerous.vuln.replace("_", " ")}`,
        severity: dangerous.severity,
        exploitable: dangerous.severity === "critical",
      });
    }
  }

  return vulns;
}

/** Extract strings from binary that indicate hardcoded secrets */
export function findHardcodedSecrets(strings: string[]): BinaryVuln[] {
  const vulns: BinaryVuln[] = [];
  const patterns = [
    { regex: /password\s*=\s*["'][^"']+["']/i, desc: "Hardcoded password" },
    { regex: /api[_-]?key\s*=\s*["'][^"']+["']/i, desc: "Hardcoded API key" },
    { regex: /secret\s*=\s*["'][^"']+["']/i, desc: "Hardcoded secret" },
    { regex: /-----BEGIN (RSA |EC |)PRIVATE KEY-----/, desc: "Embedded private key" },
    { regex: /[A-Za-z0-9+/]{40,}={0,2}/, desc: "Potential base64-encoded credential" },
    { regex: /jdbc:.*:\/\/[^;]+;/, desc: "Database connection string" },
    { regex: /mongodb(\+srv)?:\/\/[^@]+@/, desc: "MongoDB connection URI" },
  ];

  for (const str of strings) {
    for (const { regex, desc } of patterns) {
      if (regex.test(str)) {
        vulns.push({
          type: "hardcoded_cred",
          address: "0x0",
          function: "data",
          description: `${desc}: "${str.slice(0, 60)}..."`,
          severity: "critical",
          exploitable: true,
        });
        break;
      }
    }
  }

  return vulns;
}

/** Run radare2 analysis on a binary (if available) */
export function runRadare2(filepath: string): { info: string; functions: string[]; strings: string[] } | null {
  try {
    // Check if r2 is available
    execSync("which r2", { stdio: "pipe" });

    const info = execSync(`r2 -q -c "iI" "${filepath}"`, { encoding: "utf-8", timeout: 30000 });
    const funcs = execSync(`r2 -q -c "afl" "${filepath}"`, { encoding: "utf-8", timeout: 30000 });
    const strings = execSync(`r2 -q -c "izz~[2]" "${filepath}" | head -100`, { encoding: "utf-8", timeout: 30000 });

    return {
      info,
      functions: funcs.split("\n").filter(Boolean),
      strings: strings.split("\n").filter(Boolean),
    };
  } catch {
    return null;
  }
}

/** Run objdump for basic disassembly (fallback) */
export function runObjdump(filepath: string): string | null {
  try {
    const output = execSync(`objdump -d -M intel "${filepath}" | head -500`, {
      encoding: "utf-8",
      timeout: 30000,
    });
    return output;
  } catch {
    return null;
  }
}

/** Check binary security protections */
export function checkProtections(filepath: string): Record<string, boolean> {
  const protections: Record<string, boolean> = {
    nx: false,
    pie: false,
    relro: false,
    stackCanary: false,
    stripped: false,
  };

  try {
    const readelf = execSync(`readelf -l -d "${filepath}" 2>/dev/null || otool -l "${filepath}" 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 10000,
    });

    protections.nx = readelf.includes("GNU_STACK") && !readelf.includes("RWE");
    protections.pie = readelf.includes("DYN") || readelf.includes("PIE");
    protections.relro = readelf.includes("BIND_NOW") || readelf.includes("RELRO");
    protections.stackCanary = readelf.includes("__stack_chk_fail") || readelf.includes("stack_chk");

    const file = execSync(`file "${filepath}"`, { encoding: "utf-8" });
    protections.stripped = file.includes("stripped") && !file.includes("not stripped");
  } catch {
    // Tools not available
  }

  return protections;
}

/** Generate ROP chain gadgets (simplified) */
export function findROPGadgets(filepath: string, maxGadgets = 20): string[] {
  try {
    // Try ROPgadget if available
    const output = execSync(`ROPgadget --binary "${filepath}" --depth 3 | head -${maxGadgets}`, {
      encoding: "utf-8",
      timeout: 30000,
    });
    return output.split("\n").filter(Boolean);
  } catch {
    try {
      // Fallback: grep for ret instructions
      const output = execSync(`objdump -d "${filepath}" | grep -B2 "ret" | head -${maxGadgets * 3}`, {
        encoding: "utf-8",
        timeout: 15000,
      });
      return output.split("\n").filter((l) => l.includes(":")).slice(0, maxGadgets);
    } catch {
      return [];
    }
  }
}

/** Generate a patch for a vulnerability */
export function generatePatch(vuln: BinaryVuln): string {
  switch (vuln.type) {
    case "buffer_overflow":
      return `// Replace ${vuln.function} with bounded version
// ${vuln.function} → ${vuln.function.replace("strcpy", "strncpy").replace("strcat", "strncat").replace("sprintf", "snprintf").replace("gets", "fgets")}
// Add bounds checking at address ${vuln.address}`;
    case "format_string":
      return `// Fix format string at ${vuln.address}
// Change: printf(user_input) → printf("%s", user_input)`;
    case "command_injection":
      return `// Sanitize input before ${vuln.function} at ${vuln.address}
// Add input validation/whitelist`;
    default:
      return `// Patch ${vuln.type} at ${vuln.address} in ${vuln.function}`;
  }
}
