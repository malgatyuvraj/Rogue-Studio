# Contributing to Rogue Studio

Thanks for your interest in contributing! This document covers everything you need to get started.

## Development Setup

```bash
# Clone and install
git clone https://github.com/malgatyuvraj/Rogue-Studio.git
cd Rogue-Studio
npm install

# Copy env (optional — works without keys using Ollama)
cp .env.example .env.local

# Run dev server
npm run dev

# Run tests
npm test

# Run lint
npm run lint
```

## Branch Model

- `main` — stable, production-ready
- `dev` — integration branch for PRs
- Feature branches: `feat/your-feature`
- Bug fixes: `fix/issue-description`

Always branch from `dev` and open PRs against `dev`.

## PR Checklist

Before submitting a PR, ensure:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (add tests for new features)
- [ ] No secrets or API keys committed
- [ ] README updated if adding a user-facing feature
- [ ] Commit messages are descriptive

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling (no CSS modules)
- Server-side logic in `/api` routes
- Client components marked with `"use client"`

## Adding a New AI Provider

1. Add the provider key to `.env.example`
2. Add provider name to `src/lib/aiGate.ts` `EXTERNAL_PROVIDERS` array
3. Add the routing logic in `src/app/api/chat/route.ts`
4. Add a row to the README providers table
5. Write a test in `tests/unit/aiGate.test.ts`

## Building a Plugin

Plugins extend Rogue Studio with new modes. Create a file in `src/plugins/`:

```typescript
import { RoguePlugin } from "@/lib/plugins";

const myPlugin: RoguePlugin = {
  id: "my-plugin-id",
  name: "Display Name",
  description: "What this mode does",
  icon: "🎯",
  systemPrompt: "You are a specialized agent that...",
  // Optional: restrict to certain providers
  allowedProviders: ["ollama", "openai"],
};

export default myPlugin;
```

The plugin will automatically appear in the Mode Selector.

## Testing

- **Unit tests**: `tests/unit/` — test lib functions, parsers, orchestrator logic
- **E2E tests**: `tests/e2e/` — Playwright tests for critical user flows

```bash
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
```

## Security Considerations

Since Rogue Studio handles code execution and AI model access:

- Never commit API keys or secrets
- All filesystem operations must be sandboxed to `rogue_workspace/`
- Path traversal checks are mandatory for any file operation
- Command execution must validate inputs (no shell injection)
- Test security-critical paths explicitly

## Good First Issues

Look for issues labeled `good-first-issue` on GitHub. Common contribution areas:

- Adding new AI provider integrations
- Building plugins (fuzzer, SAST scanner, etc.)
- UI improvements and accessibility
- Documentation and examples
- Test coverage improvements

## Questions?

Open a GitHub Discussion or reach out via Issues. We're happy to help!
