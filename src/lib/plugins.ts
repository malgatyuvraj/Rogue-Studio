/**
 * Rogue Studio Plugin System
 * 
 * Plugins extend the IDE with new modes, system prompts, and behaviors.
 * Drop a plugin file in src/plugins/ and it will automatically be available
 * in the Mode Selector.
 */

export interface RoguePlugin {
  /** Unique identifier for the plugin */
  id: string;
  /** Display name shown in the Mode Selector */
  name: string;
  /** Short description of what this mode does */
  description: string;
  /** Emoji or icon string */
  icon: string;
  /** The system prompt injected when this mode is active */
  systemPrompt: string;
  /** Optional: restrict this mode to certain providers */
  allowedProviders?: string[];
  /** Optional: warning banner text shown when mode is active */
  warningBanner?: string;
  /** Optional: category for grouping in UI */
  category?: "security" | "development" | "analysis" | "web3" | "intelligence" | "operations" | "anonymity" | "infrastructure";
}

/** Registry of all loaded plugins */
const pluginRegistry: Map<string, RoguePlugin> = new Map();

/** Register a plugin */
export function registerPlugin(plugin: RoguePlugin): void {
  if (pluginRegistry.has(plugin.id)) {
    console.warn(`[Rogue Plugins] Duplicate plugin ID: ${plugin.id} — skipping`);
    return;
  }
  pluginRegistry.set(plugin.id, plugin);
}

/** Get all registered plugins */
export function getPlugins(): RoguePlugin[] {
  return Array.from(pluginRegistry.values());
}

/** Get a specific plugin by ID */
export function getPlugin(id: string): RoguePlugin | undefined {
  return pluginRegistry.get(id);
}

/** Unregister a plugin */
export function unregisterPlugin(id: string): boolean {
  return pluginRegistry.delete(id);
}
