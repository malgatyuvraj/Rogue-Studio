<p align="center">
  <a href="https://github.com/malgatyuvraj/Rogue-Studio/stargazers"><img src="https://img.shields.io/github/stars/malgatyuvraj/Rogue-Studio?style=for-the-badge" alt="GitHub stars" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/License-MIT-16a34a?style=for-the-badge" alt="MIT License" />
</p>

# Rogue Studio

> AI without guardrails. Create anything with Rogue Studio, use local or cloud models, generate runnable artifacts, and keep the full build loop in one open-source workspace.

**The core idea is simple:** build without restrictions, inspect the output, run it, fix it, and keep moving without getting boxed in by provider lock-in or a fragmented toolchain.

Rogue Studio is a single interface for building with models, inspecting generated files, running code locally, and launching Heretic-powered forge jobs without bouncing between tools.

It is designed for people who want a fast feedback loop: prompt, inspect the artifact, run it, fix it, and keep moving.

## Unrestricted AI, One Workspace

Rogue Studio is built for open-ended creation with full user control. Start with an idea, choose the model stack you want, generate code or content, run it locally, and iterate inside the same interface.

If the project goal is flexibility, speed, control, and an AI workflow that does not feel boxed in, that is the point of Rogue Studio.

<p align="center">
  <a href="#quick-start"><strong>Quick start</strong></a>
  ·
  <a href="#what-you-get"><strong>What you get</strong></a>
  ·
  <a href="#how-it-works"><strong>How it works</strong></a>
  ·
  <a href="#contributing"><strong>Contributing</strong></a>
</p>

## Why Rogue Studio

- One workspace for local models and hosted APIs.
- Artifact-first chat flow with extracted code blocks, file tabs, copy, and download actions.
- Built-in execution loop for Python, JavaScript, and Bash.
- Streaming forge panel for running Heretic jobs from the UI.
- Browser-local API key storage for provider credentials.
- Clean Next.js codebase that is easy to fork, theme, and extend.

## What You Get

| Capability | What it does |
| --- | --- |
| Multi-provider chat | Switch between Ollama, OpenAI, Anthropic, Gemini, OpenRouter, and Groq from one interface. |
| Live artifacts | Automatically extracts code blocks from model output and presents them in a syntax-highlighted panel. |
| Local execution | Runs Python, JavaScript, and Bash directly from the artifact panel and streams `stdout` and `stderr` back into the UI. |
| Model Forge | Sends Heretic jobs through a built-in terminal-style stream so you can launch model workflows from the browser. |
| Responsive interface | Works across desktop and mobile layouts with an app-like sidebar and sheet pattern. |

## Quick Start

### Prerequisites

- Node.js 18 or newer
- npm or pnpm
- Optional: [Ollama](https://ollama.com) for local inference
- Optional: [uv](https://docs.astral.sh/uv/) plus a local [Heretic](https://github.com/p-e-w/heretic) checkout for the forge workflow

### Install and run

```bash
git clone https://github.com/malgatyuvraj/Rogue-Studio.git
cd Rogue-Studio
npm install
npm run dev
```

Open `http://localhost:3000`.

### Run with local models

```bash
# macOS
brew install ollama

# Pull and run a recommended model
ollama run hf.co/p-e-w/gemma-3-12b-it-heretic-GGUF
```

Then choose `Local (Ollama / Heretic)` inside the app.

### Use cloud providers

1. Select a provider in the sidebar.
2. Paste an API key.
3. Enter the model ID you want to use.
4. Start prompting.

API keys are stored in browser `localStorage` and sent only to the provider you choose.

## Forge Setup

The forge route is wired to run Heretic locally and stream logs back into the UI.

To use it, make sure you have:

- `uv` installed
- a working `heretic-master` checkout on your machine
- the path in [src/app/api/forge/route.ts](src/app/api/forge/route.ts) aligned with your local directory layout

If you already keep Heretic next to this repo, you are close. If your folders differ, update that path once and the forge UI will use your local setup.

## Safety Notes

- The execution route runs code on the machine hosting the app.
- The current sandbox uses timeouts and temporary files, not container isolation.
- Review generated code before running it, especially when using third-party model providers.

That honesty matters in open source. A trustworthy README converts better than hype.

## How It Works

```text
Prompt -> provider adapter -> streamed response -> artifact extraction -> optional local execution
                                          \-> optional forge workflow -> streamed terminal output
```

### App structure

```text
src/
  app/
    page.tsx
    layout.tsx
    globals.css
    api/
      chat/route.ts
      execute/route.ts
      forge/route.ts
```

### API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/chat` | `POST` | Streams model responses from the selected provider. |
| `/api/execute` | `POST` | Executes Python, JavaScript, or Bash locally and returns output. |
| `/api/forge` | `POST` | Streams Heretic forge logs over server-sent events. |

## Tech Stack

- [Next.js 16](https://nextjs.org)
- [React 19](https://react.dev)
- [TypeScript 5](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Framer Motion](https://motion.dev)
- [Prism React Renderer](https://github.com/FormidableLabs/prism-react-renderer)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Lucide React](https://lucide.dev)

## Contributing

Contributions are welcome, especially in these areas:

- provider adapters and model presets
- stronger execution isolation
- artifact UX and file management
- forge reliability and environment detection
- onboarding polish, screenshots, and docs

Typical workflow:

```bash
git checkout -b feature/your-change
npm run lint
```

Open a pull request with a clear description of what changed and why.

## License

Rogue Studio is released under the [MIT License](LICENSE).

## Acknowledgments

- [Heretic](https://github.com/p-e-w/heretic) for the forge workflow inspiration and local model tooling
- [Ollama](https://ollama.com) for making local model serving simple
- The open-source AI tooling community

---

Rogue Studio is an open-source project built for developers who want transparency, extensibility, and full control over their AI workflow.

If Rogue Studio saves you time or gives you a better local AI workflow, star the repo. It helps more builders find the project.
