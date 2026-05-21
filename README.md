# Rogue Studio ☠️
### The Uncensored, Cypherpunk Agentic IDE

> Build without limits. Deploy without a trace. Audit without mercy.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Next.js 14](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge) ![Branch: Ai-thon](https://img.shields.io/badge/Branch-Ai--thon-red.svg?style=for-the-badge)

---

## What is Rogue Studio?
Rogue Studio is an uncensored, self-hostable AI coding IDE built for security researchers, Web3 hackers, and developers who want full control over their AI. There are no safety wrappers, no telemetry, and no corporate filters blocking execution.

---

## ⚡ Core Features

### 🔒 Air-Gapped Zero-Trust Mode
Enforced via a physical-style Kill Switch in the UI, this mode guarantees complete data isolation. When activated, a backend middleware in `/api/chat/route.ts` enforces a hard `403 Forbidden` block on all external cloud providers (OpenAI, Anthropic, Gemini, Groq, DeepSeek, Together, OpenRouter) based on the `x-air-gap-mode` header. Only local execution via Ollama is permitted. The enforcement is strictly server-side—it is not a visual UI toggle and cannot be bypassed from the client.

### ⚔️ Adversarial Red Team vs Blue Team Swarm Mode
This mode pits two AI agents against each other in an autonomous loop governed by `src/hooks/useSwarm.ts`. The Blue Team agent writes the feature code. When it signals `<done>`, the Red Team agent automatically audits the output for XSS, SQLi, Buffer Overflows, Reentrancy, and logic flaws. If `<vulnerable>` is returned, the exploit details are fed back to the Blue Team for immediate patching. The loop iterates up to 3 times until a `<secure>` verdict is reached. Both agents stream their thought processes in real-time to the split, color-coded `<SwarmTerminal>` component.

### 🔬 Reverse Engineer Mode
A one-click execution preset that replaces the standard system prompt with an aggressive decompiler instruction set defined in `src/lib/prompts.ts`. Designed to de-obfuscate minified JavaScript, reconstruct ASTs, and analyze compiled binaries without triggering AI safety refusals. Activated via the `<ModeSelector>` in the sidebar, which renders an amber warning banner above the chat input to indicate the safety filter bypass is active.

### ⛓️ Web3 Black-Hat Mode
A specialized execution environment for smart contract security testing and vulnerability assessment. It features a one-click "Init Web3 Scaffold" button that hits the `/api/web3/scaffold/route.ts` endpoint, automatically initializing a full Hardhat project within the local `rogue_workspace`. The scaffold provisions a starter `Target.sol` containing an intentional reentrancy vulnerability for immediate demo auditing. The Black-Hat Agent prompt generates Proof-of-Concept Solidity exploits strictly against local contracts.

### 👻 Ghost Deploy (Tor .onion) — Coming Soon
A planned feature to expose the local `rogue_workspace` directly to the dark web as a Tor hidden service, generating a `.onion` URL with streaming bootstrap logs. This requires a local `tor` binary installation. The backend stub and binary dependency detection (`GET /api/deploy/tor`) are already implemented in `src/app/api/deploy/tor/route.ts`.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- For Air-Gap mode: Ollama installed locally (https://ollama.ai)
- For Web3 mode: Node.js (npx required for Hardhat init)
- For Ghost Deploy (coming soon): `tor` binary (`brew install tor` or `sudo apt install tor`)

### Installation
```bash
git clone https://github.com/malgatyuvraj/Rogue-Studio.git
cd Rogue-Studio
npm install
npm run dev
```
Open http://localhost:3000

---

## 🏗️ Architecture

```text
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Multi-provider AI gateway + Air-Gap enforcement
│   │   ├── execute/               # Command execution in rogue_workspace
│   │   ├── forge/                 # File system operations
│   │   ├── workspace/             # Workspace management
│   │   ├── deploy/
│   │   │   ├── route.ts           # IPFS deployment
│   │   │   └── tor/route.ts       # Tor .onion stub + binary detection
│   │   └── web3/scaffold/route.ts # Hardhat project initializer
│   └── page.tsx                   # Main IDE interface
├── components/
│   ├── KillSwitch.tsx             # Air-Gap toggle UI
│   ├── ModeSelector.tsx           # Agent / Decompiler / Web3 preset selector
│   └── SwarmTerminal.tsx          # Blue/Red team split terminal
├── hooks/
│   ├── useAirGap.ts               # Air-gap state + header injection
│   └── useSwarm.ts                # Blue/Red agent orchestration loop
└── lib/
    ├── aiGate.ts                  # External provider blocklist
    ├── prompts.ts                 # All system prompts (Blue, Red, Decompiler, Web3)
    └── swarmOrchestrator.ts       # Sentinel token parsing (<done> <vulnerable> <secure>)
```

---

## 🔌 Supported AI Providers

| Provider      | Local? | Air-Gap Compatible |
|---------------|--------|--------------------|
| ollama        | ✅ Yes  | ✅ Yes              |
| OpenAI        | ❌ No   | ❌ Blocked          |
| Anthropic     | ❌ No   | ❌ Blocked          |
| Gemini        | ❌ No   | ❌ Blocked          |
| Groq          | ❌ No   | ❌ Blocked          |
| DeepSeek      | ❌ No   | ❌ Blocked          |
| Together AI   | ❌ No   | ❌ Blocked          |
| OpenRouter    | ❌ No   | ❌ Blocked          |

---

## ⚠️ Disclaimer
Rogue Studio is built for security researchers, penetration testers, and developers operating in controlled environments. The Web3 Black-Hat and Reverse Engineer modes are intended for local, sandboxed use only. Never use exploit-generation features against contracts or systems you do not own or have explicit permission to test.

---

## 📄 License
MIT — see LICENSE
