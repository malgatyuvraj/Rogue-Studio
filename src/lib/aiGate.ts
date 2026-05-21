export const EXTERNAL_PROVIDERS = [
  "openai", "anthropic", "gemini",
  "openrouter", "groq", "deepseek", "together"
];

export function isExternalProvider(provider: string): boolean {
  return EXTERNAL_PROVIDERS.includes(provider);
}
