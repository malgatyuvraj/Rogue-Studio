import { describe, it, expect } from "vitest";
import { assertLocalhost, sanitizeCommandArg } from "@/lib/security";

describe("security", () => {
  describe("assertLocalhost", () => {
    it("allows localhost requests", () => {
      const req = new Request("http://localhost:3000/api/execute", {
        headers: { host: "localhost:3000" },
      });
      expect(assertLocalhost(req)).toBeNull();
    });

    it("allows 127.0.0.1 requests", () => {
      const req = new Request("http://127.0.0.1:3000/api/execute", {
        headers: { host: "127.0.0.1:3000" },
      });
      expect(assertLocalhost(req)).toBeNull();
    });

    it("blocks remote requests when LOCALHOST_ONLY is not false", () => {
      const req = new Request("http://evil.com/api/execute", {
        headers: { host: "evil.com" },
      });
      const result = assertLocalhost(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });
  });

  describe("sanitizeCommandArg", () => {
    it("allows valid model IDs", () => {
      expect(sanitizeCommandArg("llama3")).toBe("llama3");
      expect(sanitizeCommandArg("hf.co/org/model-name:latest")).toBe(
        "hf.co/org/model-name:latest"
      );
      expect(sanitizeCommandArg("meta-llama/Llama-3.3-70B")).toBe(
        "meta-llama/Llama-3.3-70B"
      );
    });

    it("rejects shell metacharacters", () => {
      expect(sanitizeCommandArg("model; rm -rf /")).toBeNull();
      expect(sanitizeCommandArg("model && cat /etc/passwd")).toBeNull();
      expect(sanitizeCommandArg("$(whoami)")).toBeNull();
      expect(sanitizeCommandArg("model`id`")).toBeNull();
      expect(sanitizeCommandArg("model | cat")).toBeNull();
      expect(sanitizeCommandArg('model"injection')).toBeNull();
    });

    it("rejects empty strings", () => {
      expect(sanitizeCommandArg("")).toBeNull();
    });
  });
});
