import { describe, it, expect } from "vitest";
import { createWarRoom, postIntel, getIntelForAgent, buildAgentContext, parseAgentOutput, getNextWarPhase } from "@/lib/warRoom";

describe("warRoom", () => {
  describe("createWarRoom", () => {
    it("creates a war room with correct target and objectives", () => {
      const wr = createWarRoom("10.0.0.1", ["gain shell access", "exfiltrate data"]);
      expect(wr.target).toBe("10.0.0.1");
      expect(wr.objectives).toHaveLength(2);
      expect(wr.phase).toBe("planning");
      expect(wr.agents).toHaveLength(5); // 5 operational roles
    });
  });

  describe("postIntel", () => {
    it("adds intel to the board", () => {
      const wr = createWarRoom("target.local", ["test"]);
      const updated = postIntel(wr, "recon", "finding", "Port 22 open");
      expect(updated.intelBoard.length).toBe(1);
      expect(updated.intelBoard[0].content).toBe("Port 22 open");
    });
  });

  describe("getIntelForAgent", () => {
    it("returns intel relevant to agent role", () => {
      let wr = createWarRoom("target.local", ["test"]);
      wr = postIntel(wr, "recon", "finding", "SSH on port 22");
      wr = postIntel(wr, "recon", "credential", "admin:admin");
      const intel = getIntelForAgent(wr, "exploit");
      expect(intel.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("buildAgentContext", () => {
    it("builds context string from war room state", () => {
      let wr = createWarRoom("target.local", ["test"]);
      wr = postIntel(wr, "recon", "finding", "Apache 2.4.49 detected");
      const ctx = buildAgentContext(wr, "exploit");
      expect(ctx).toContain("Apache 2.4.49");
    });
  });

  describe("parseAgentOutput", () => {
    it("extracts findings from agent output", () => {
      const output = `
I found something important.
<finding>Port 80 running Apache</finding>
<credential>root:toor</credential>
      `;
      const items = parseAgentOutput(output, "recon");
      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getNextWarPhase", () => {
    it("progresses from planning to active", () => {
      const wr = createWarRoom("target.local", ["test"]);
      const next = getNextWarPhase(wr);
      expect(next).toBe("active");
    });
  });
});
