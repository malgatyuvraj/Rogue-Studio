import { describe, it, expect } from "vitest";
import { registerPlugin, getPlugins, getPlugin, unregisterPlugin } from "@/lib/plugins";

describe("plugin system", () => {
  it("registers and retrieves a plugin", () => {
    registerPlugin({
      id: "test-plugin",
      name: "Test Plugin",
      description: "A test plugin",
      icon: "🧪",
      systemPrompt: "You are a test.",
    });

    const plugin = getPlugin("test-plugin");
    expect(plugin).toBeDefined();
    expect(plugin!.name).toBe("Test Plugin");
    expect(plugin!.systemPrompt).toBe("You are a test.");
  });

  it("returns all registered plugins", () => {
    const plugins = getPlugins();
    expect(plugins.length).toBeGreaterThanOrEqual(1);
    expect(plugins.some((p) => p.id === "test-plugin")).toBe(true);
  });

  it("unregisters a plugin", () => {
    const removed = unregisterPlugin("test-plugin");
    expect(removed).toBe(true);
    expect(getPlugin("test-plugin")).toBeUndefined();
  });

  it("rejects duplicate plugin IDs silently", () => {
    registerPlugin({
      id: "dupe-test",
      name: "First",
      description: "",
      icon: "",
      systemPrompt: "first",
    });
    registerPlugin({
      id: "dupe-test",
      name: "Second",
      description: "",
      icon: "",
      systemPrompt: "second",
    });

    // Should keep the first one
    expect(getPlugin("dupe-test")!.name).toBe("First");

    // Cleanup
    unregisterPlugin("dupe-test");
  });
});
