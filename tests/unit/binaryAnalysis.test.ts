import { describe, it, expect } from "vitest";
import { detectFormat, analyzeImports, findHardcodedSecrets, generatePatch } from "@/lib/binaryAnalysis";
import type { BinaryVuln } from "@/lib/binaryAnalysis";

describe("binaryAnalysis", () => {
  describe("detectFormat", () => {
    it("detects ELF format", () => {
      // ELF magic: 7f 45 4c 46
      const result = detectFormat("7f454c46020101000000000000000000");
      expect(result.format).toBe("elf");
    });

    it("detects PE format", () => {
      // MZ header: 4d 5a
      const result = detectFormat("4d5a90000300000004000000ffff0000");
      expect(result.format).toBe("pe");
    });

    it("detects Mach-O format", () => {
      // Mach-O 64-bit magic: cf fa ed fe
      const result = detectFormat("cffaedfe0c000001000000000200000010");
      expect(result.format).toBe("macho");
    });

    it("returns unknown for unrecognized", () => {
      const result = detectFormat("0000000000000000");
      expect(result.format).toBe("unknown");
    });
  });

  describe("analyzeImports", () => {
    it("flags dangerous imports", () => {
      const imports = ["strcpy", "gets", "printf", "malloc", "system"];
      const vulns = analyzeImports(imports);
      expect(vulns.length).toBeGreaterThan(0);
      expect(vulns.some((v) => v.description.includes("strcpy") || v.description.includes("gets"))).toBe(true);
    });

    it("no critical vulns for safe imports", () => {
      const imports = ["malloc", "calloc", "memcpy"];
      const vulns = analyzeImports(imports);
      expect(vulns.every((v) => v.severity !== "critical")).toBe(true);
    });
  });

  describe("findHardcodedSecrets", () => {
    it("detects API keys in strings", () => {
      const strings = ["normal string", "api_key='sk_live_1234567890abcdef'", "hello"];
      const vulns = findHardcodedSecrets(strings);
      expect(vulns.length).toBeGreaterThan(0);
    });

    it("detects passwords", () => {
      const strings = ["password='hunter2'", "debug_mode"];
      const vulns = findHardcodedSecrets(strings);
      expect(vulns.length).toBeGreaterThan(0);
    });
  });

  describe("generatePatch", () => {
    it("generates patch text for vulnerability", () => {
      const vuln: BinaryVuln = {
        type: "buffer_overflow",
        severity: "critical",
        function: "strcpy",
        address: "0x4012ab",
        description: "Unbounded strcpy",
        exploitable: true,
      };
      const patch = generatePatch(vuln);
      expect(typeof patch).toBe("string");
      expect(patch.length).toBeGreaterThan(0);
    });
  });
});
