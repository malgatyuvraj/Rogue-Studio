import { describe, it, expect } from "vitest";
import { encodeChain, decodeChain, generateReverseShell, forgePayload } from "@/lib/payloadForge";
import type { PayloadConfig, EncodingChain } from "@/lib/payloadForge";

describe("payloadForge", () => {
  describe("encodeChain / decodeChain", () => {
    it("base64 roundtrip", () => {
      const chain: EncodingChain = { steps: [{ encoder: "base64" }] };
      const encoded = encodeChain("hello world", chain);
      expect(encoded).not.toBe("hello world");
      const decoded = decodeChain(encoded, chain);
      expect(decoded).toBe("hello world");
    });

    it("xor roundtrip with key", () => {
      const chain: EncodingChain = { steps: [{ encoder: "xor", key: "secret" }] };
      const encoded = encodeChain("payload data", chain);
      expect(encoded).not.toBe("payload data");
      const decoded = decodeChain(encoded, chain);
      expect(decoded).toBe("payload data");
    });

    it("multi-step encoding", () => {
      const chain: EncodingChain = {
        steps: [
          { encoder: "base64" },
          { encoder: "hex" },
        ],
      };
      const encoded = encodeChain("test", chain);
      const decoded = decodeChain(encoded, chain);
      expect(decoded).toBe("test");
    });
  });

  describe("generateReverseShell", () => {
    it("generates python reverse shell", () => {
      const shell = generateReverseShell("linux_x64", "python", "10.0.0.1", 4444);
      expect(shell).toContain("10.0.0.1");
      expect(shell).toContain("4444");
    });

    it("generates bash reverse shell", () => {
      const shell = generateReverseShell("linux_x64", "bash", "192.168.1.1", 9001);
      expect(shell).toContain("192.168.1.1");
      expect(shell).toContain("9001");
    });
  });

  describe("forgePayload", () => {
    it("generates a complete payload structure", () => {
      const config: PayloadConfig = {
        type: "reverse_shell",
        platform: "linux_x64",
        format: "python",
        lhost: "10.0.0.1",
        lport: 4444,
        evasion: [],
      };
      const result = forgePayload(config);
      expect(result).toHaveProperty("code");
      expect(result).toHaveProperty("format");
      expect(result.format).toBe("python");
    });
  });
});
