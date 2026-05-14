<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

# 🔴 Rogue Studio

> **The Unrestricted AI Builder** — An open-source, multi-provider AI development platform with local code execution, concept abliteration research integration, and a real-time artifact system.

## ✨ Features

### 🤖 Multi-Provider Engine
Connect to any major AI provider through a unified interface:
- **Local (Ollama)** — Run abliterated models directly on your machine with zero latency
- **OpenAI** — GPT-4o, GPT-4 Turbo
- **Anthropic** — Claude 3.5 Sonnet, Claude 3 Opus
- **Google Gemini** — Gemini 2.5 Flash
- **OpenRouter** — Access 100+ models through a single API
- **Groq** — Ultra-fast inference

### 🔨 The Model Forge
Integrated UI for running [heretic-master](https://github.com/p-e-w/heretic) abliteration pipelines. Paste any Hugging Face model ID and watch the process stream live in a built-in terminal.

### ⚡ Local Code Execution Sandbox
Execute generated Python, JavaScript, and Bash scripts directly from the artifact panel with one click. Includes:
- Real-time `stdout` / `stderr` output
- 30-second timeout protection
- **Agentic Auto-Fix** — When code fails, click "Auto-Fix" to have the AI automatically analyze the error and regenerate a corrected version

### 📦 Real-Time Artifact System
- Live syntax-highlighted code viewer (powered by Prism)
- Multi-file tab navigation
- One-click Copy & Download
- CRT scanline overlay for aesthetic flair

### 🎨 Premium Dark UI
- Glassmorphism design system
- Framer Motion animations throughout
- Fully responsive (mobile, tablet, desktop)
- Custom scrollbars and micro-interactions

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** or **pnpm**
- (Optional) [Ollama](https://ollama.com) for local model inference

### Installation

```bash
# Clone the repository
git clone https://github.com/malgatyuvraj/Rogue-Studio.git
cd Rogue-Studio

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Local Models (Recommended)

```bash
# Install Ollama (macOS)
brew install ollama

# Pull a recommended abliterated model
ollama run hf.co/p-e-w/gemma-3-12b-it-heretic-GGUF
```

Then select **"Local (Ollama / Heretic)"** as your engine provider in the sidebar.

### Using Cloud Providers

1. Select a provider (OpenAI, Anthropic, Gemini, etc.) from the sidebar
2. Enter your API key
3. Choose or type a model ID
4. Start prompting

> **Note:** API keys are stored in your browser's `localStorage` only — they are never sent to any server other than the provider you selected.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main UI (chat, sidebar, artifact panel)
│   ├── layout.tsx            # Root layout with fonts & metadata
│   ├── globals.css           # Design tokens & glassmorphism utilities
│   └── api/
│       ├── chat/route.ts     # Multi-provider streaming chat endpoint
│       ├── execute/route.ts  # Local code execution sandbox
│       └── forge/route.ts    # Heretic abliteration pipeline interface
```

## 🔧 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST | Streams AI responses from any configured provider |
| `/api/execute` | POST | Executes Python/JS/Bash code locally and returns output |
| `/api/forge` | POST | Streams heretic-master abliteration process output via SSE |

## 📦 Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [TypeScript 5](https://typescriptlang.org) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling |
| [Framer Motion](https://motion.dev) | Animations & transitions |
| [Prism React Renderer](https://github.com/FormidableLabs/prism-react-renderer) | Syntax highlighting |
| [React Markdown](https://github.com/remarkjs/react-markdown) | Markdown rendering |
| [Lucide React](https://lucide.dev) | Icon system |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [heretic-master](https://github.com/p-e-w/heretic) by p-e-w for the concept abliteration research
- [Ollama](https://ollama.com) for making local model inference accessible
- The open-source AI community

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/malgatyuvraj">@malgatyuvraj</a>
</p>
