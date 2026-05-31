import { describe, it, expect } from "vitest";
import { isExternalProvider } from "@/lib/aiGate";

describe("aiGate", () => {
  it("blocks known external providers", () => {
    expect(isExternalProvider("openai")).toBe(true);
    expect(isExternalProvider("anthropic")).toBe(true);
    expect(isExternalProvider("gemini")).toBe(true);
    expect(isExternalProvider("groq")).toBe(true);
    expect(isExternalProvider("deepseek")).toBe(true);
    expect(isExternalProvider("together")).toBe(true);
    expect(isExternalProvider("openrouter")).toBe(true);
  });

  it("allows ollama as local provider", () => {
    expect(isExternalProvider("ollama")).toBe(false);
  });

  it("allows unknown providers (open model ecosystem)", () => {
    expect(isExternalProvider("custom-local")).toBe(false);
    expect(isExternalProvider("")).toBe(false);
  });
});
