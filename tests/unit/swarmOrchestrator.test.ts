import { describe, it, expect } from "vitest";
import { parseBlueStream, parseRedStream } from "@/lib/swarmOrchestrator";

describe("swarmOrchestrator", () => {
  describe("parseBlueStream", () => {
    it("detects <done> sentinel and strips it from content", () => {
      const result = parseBlueStream("Here is the code\n<done>");
      expect(result.isDone).toBe(true);
      expect(result.content).toBe("Here is the code");
    });

    it("returns isDone=false for normal content", () => {
      const result = parseBlueStream("function hello() { return 'world'; }");
      expect(result.isDone).toBe(false);
      expect(result.content).toBe("function hello() { return 'world'; }");
    });

    it("handles empty chunks", () => {
      const result = parseBlueStream("");
      expect(result.isDone).toBe(false);
      expect(result.content).toBe("");
    });
  });

  describe("parseRedStream", () => {
    it("detects <vulnerable> verdict", () => {
      const result = parseRedStream("Found XSS in line 12 <vulnerable>");
      expect(result.verdict).toBe("vulnerable");
      expect(result.content).toContain("Found XSS");
    });

    it("detects <secure> verdict", () => {
      const result = parseRedStream("No issues found <secure>");
      expect(result.verdict).toBe("secure");
      expect(result.content).toContain("No issues found");
    });

    it("returns null verdict for in-progress content", () => {
      const result = parseRedStream("Analyzing the code for vulnerabilities...");
      expect(result.verdict).toBeNull();
      expect(result.content).toBe("Analyzing the code for vulnerabilities...");
    });
  });
});
