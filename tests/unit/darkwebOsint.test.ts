import { describe, it, expect } from "vitest";
import { OSINT_SOURCES } from "@/lib/darkwebOsint";

describe("darkwebOsint", () => {
  describe("OSINT_SOURCES", () => {
    it("exports a non-empty source list", () => {
      expect(OSINT_SOURCES.length).toBeGreaterThan(0);
    });

    it("each source has required fields", () => {
      OSINT_SOURCES.forEach((source) => {
        expect(source).toHaveProperty("id");
        expect(source).toHaveProperty("name");
        expect(source).toHaveProperty("type");
        expect(source).toHaveProperty("description");
      });
    });

    it("sources include breach databases", () => {
      const breachSources = OSINT_SOURCES.filter((s) => s.type === "breach_db");
      expect(breachSources.length).toBeGreaterThan(0);
    });
  });
});
