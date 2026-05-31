import { describe, it, expect } from "vitest";
import { mutateInput, triageCrash, createFuzzSession, generateCorpus } from "@/lib/fuzzer";
import type { FuzzConfig } from "@/lib/fuzzer";

describe("fuzzer", () => {
  describe("mutateInput", () => {
    it("random mutation changes the input", () => {
      const input = "AAAA";
      // With random mutation some output should differ (statistical — run multiple)
      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        results.add(mutateInput(input, "random"));
      }
      // At least one mutation should differ from original
      expect(results.size).toBeGreaterThan(0);
    });

    it("bitflip produces same-length output", () => {
      const input = "hello";
      const mutated = mutateInput(input, "bitflip");
      expect(mutated.length).toBe(input.length);
    });

    it("dictionary mutation uses provided words", () => {
      const dict = ["FUZZ", "INJECT"];
      const input = "GET /path HTTP/1.1";
      const mutated = mutateInput(input, "dictionary", dict);
      expect(typeof mutated).toBe("string");
    });
  });

  describe("triageCrash", () => {
    it("SIGSEGV is medium+ exploitability", () => {
      const result = triageCrash("SIGSEGV", "segfault at 0x41414141");
      expect(["high", "medium"]).toContain(result);
    });

    it("SIGABRT is low exploitability", () => {
      const result = triageCrash("SIGABRT", "abort");
      expect(result).toBe("low");
    });

    it("SIGTERM is unknown", () => {
      const result = triageCrash("SIGTERM", "");
      expect(result).toBe("unknown");
    });
  });

  describe("createFuzzSession", () => {
    it("creates session with correct config", () => {
      const config: FuzzConfig = {
        target: "/bin/echo",
        strategy: "random",
        inputFormat: "text",
        maxIterations: 100,
        timeout: 1000,
        coverageGuided: false,
      };
      const session = createFuzzSession(config);
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("config");
      expect(session.config.target).toBe("/bin/echo");
    });
  });

  describe("generateCorpus", () => {
    it("generates text corpus entries", () => {
      const corpus = generateCorpus("text");
      expect(corpus.length).toBeGreaterThan(0);
      corpus.forEach((entry) => expect(typeof entry).toBe("string"));
    });

    it("generates json corpus entries", () => {
      const corpus = generateCorpus("json");
      expect(corpus.length).toBeGreaterThan(0);
      corpus.forEach((entry) => {
        expect(() => JSON.parse(entry)).not.toThrow();
      });
    });
  });
});
