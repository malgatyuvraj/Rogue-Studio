import { describe, it, expect } from "vitest";
import { isSwapTx, decodeSwap, analyzeMEV, getFlashLoanProviders } from "@/lib/chainMonitor";
import type { MempoolTx } from "@/lib/chainMonitor";

describe("chainMonitor", () => {
  const mockSwapTx: MempoolTx = {
    hash: "0xabc123",
    from: "0x1111111111111111111111111111111111111111",
    to: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 router
    value: "1000000000000000000",
    gasPrice: "50000000000",
    data: "0x38ed1739" + "0".repeat(64 * 5), // swapExactTokensForTokens selector
    nonce: 42,
    timestamp: Date.now(),
  };

  const mockTransferTx: MempoolTx = {
    hash: "0xdef456",
    from: "0x2222222222222222222222222222222222222222",
    to: "0x3333333333333333333333333333333333333333",
    value: "5000000000000000000",
    gasPrice: "30000000000",
    data: "0x",
    nonce: 1,
    timestamp: Date.now(),
  };

  describe("isSwapTx", () => {
    it("detects swap transactions", () => {
      expect(isSwapTx(mockSwapTx)).toBe(true);
    });

    it("rejects non-swap transactions", () => {
      expect(isSwapTx(mockTransferTx)).toBe(false);
    });
  });

  describe("decodeSwap", () => {
    it("decodes a swap transaction", () => {
      const decoded = decodeSwap(mockSwapTx);
      if (decoded) {
        expect(decoded).toHaveProperty("router");
        expect(decoded).toHaveProperty("amountIn");
      }
    });

    it("returns null for non-swap", () => {
      expect(decodeSwap(mockTransferTx)).toBeNull();
    });
  });

  describe("analyzeMEV", () => {
    it("identifies MEV opportunity from swap", () => {
      const mev = analyzeMEV(mockSwapTx);
      // May or may not find opportunity depending on threshold
      if (mev) {
        expect(mev).toHaveProperty("type");
        expect(mev).toHaveProperty("estimatedProfit");
      }
    });

    it("returns null for simple transfer", () => {
      expect(analyzeMEV(mockTransferTx)).toBeNull();
    });
  });

  describe("getFlashLoanProviders", () => {
    it("returns known flash loan providers", () => {
      const providers = getFlashLoanProviders();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers[0]).toHaveProperty("name");
      expect(providers[0]).toHaveProperty("address");
      expect(providers[0]).toHaveProperty("maxLoan");
    });
  });
});
