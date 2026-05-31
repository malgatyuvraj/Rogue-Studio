import { describe, it, expect } from "vitest";
import { encryptContent, decryptContent } from "@/lib/ipfsStore";

describe("ipfsStore", () => {
  describe("encryptContent / decryptContent", () => {
    it("roundtrip encryption", () => {
      const key = "my-secret-key-123";
      const content = "Hello decentralized world!";
      const encrypted = encryptContent(content, key);
      expect(encrypted).not.toBe(content);
      const decrypted = decryptContent(encrypted, key);
      expect(decrypted).toBe(content);
    });

    it("different keys produce different ciphertext", () => {
      const content = "sensitive data";
      const enc1 = encryptContent(content, "key1");
      const enc2 = encryptContent(content, "key2");
      expect(enc1).not.toBe(enc2);
    });
  });
});
