import { describe, it, expect } from "vitest";
import { generateEthWallet, generateWalletBatch, generateUsername, generateDisposableEmail, generateFingerprint, createPersona } from "@/lib/identityRotation";

describe("identityRotation", () => {
  describe("generateEthWallet", () => {
    it("generates a valid-looking wallet", () => {
      const wallet = generateEthWallet();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(wallet.chain).toBe("ethereum");
    });

    it("generates unique wallets", () => {
      const w1 = generateEthWallet();
      const w2 = generateEthWallet();
      expect(w1.address).not.toBe(w2.address);
    });
  });

  describe("generateWalletBatch", () => {
    it("generates requested number of wallets", () => {
      const batch = generateWalletBatch(5);
      expect(batch).toHaveLength(5);
      batch.forEach((w) => expect(w.address).toMatch(/^0x/));
    });
  });

  describe("generateUsername", () => {
    it("generates a string username", () => {
      const name = generateUsername();
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(3);
    });
  });

  describe("generateDisposableEmail", () => {
    it("generates email-like string", () => {
      const email = generateDisposableEmail();
      expect(email).toContain("@");
    });
  });

  describe("generateFingerprint", () => {
    it("generates browser fingerprint", () => {
      const fp = generateFingerprint();
      expect(fp).toHaveProperty("userAgent");
      expect(fp).toHaveProperty("screenResolution");
      expect(fp).toHaveProperty("timezone");
      expect(fp).toHaveProperty("language");
    });
  });

  describe("createPersona", () => {
    it("creates a full persona", () => {
      const persona = createPersona(true);
      expect(persona).toHaveProperty("username");
      expect(persona).toHaveProperty("email");
      expect(persona).toHaveProperty("fingerprint");
      expect(persona).toHaveProperty("wallet");
    });

    it("creates persona without wallet when specified", () => {
      const persona = createPersona(false);
      expect(persona).toHaveProperty("username");
      expect(persona.wallet).toBeUndefined();
    });
  });
});
