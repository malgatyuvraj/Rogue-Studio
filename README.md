# Rogue Studio ☠️
### The Uncensored, Cypherpunk Agentic IDE

> Build without limits. Deploy without a trace. Audit without mercy.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![CI](https://img.shields.io/github/actions/workflow/status/malgatyuvraj/Rogue-Studio/ci.yml?style=for-the-badge&label=CI)

<p align="center">
  <img src="docs/demo.gif" alt="Rogue Studio Red/Blue Swarm Demo" width="800" />
  <br/>
  <em>Red Team finds a reentrancy vuln → Blue Team auto-patches → verified secure in 3 iterations</em>
</p>

---

## What is Rogue Studio?
Rogue Studio is an uncensored, self-hostable AI coding IDE built for security researchers, Web3 hackers, and developers who want full control over their AI. There are no safety wrappers, no telemetry, and no corporate filters blocking execution.

### Why Rogue Studio?

| Feature | Rogue Studio | Cursor | Copilot Chat | Bolt.new |
|---------|:---:|:---:|:---:|:---:|
| Self-hosted / air-gapped | ✅ | ❌ | ❌ | ❌ |
| Red/Blue adversarial audit | ✅ | ❌ | ❌ | ❌ |
| Arbitrary code execution | ✅ | ❌ | ❌ | ✅ |
| No content filters | ✅ | ❌ | ❌ | ❌ |
| Local LLM (Ollama) | ✅ | ❌ | ❌ | ❌ |
| IPFS / Tor deploy | ✅ | ❌ | ❌ | ❌ |
| Plugin system | ✅ | ✅ | ✅ | ❌ |
| Free & Open Source | ✅ | ❌ | ❌ | ❌ |

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

### 🎯 Attack Chain System
Autonomous multi-phase penetration testing engine. Phases: Recon → Vulnerability Scan → Exploit → Verify → Report. Each phase uses specialized prompts with auto-pivot on failure and findings aggregation across phases.

### 🕵️ OSINT / Dark Web Intelligence
Breach database lookups (HIBP), paste site monitoring, IntelX integration, and .onion crawling via Tor. Build comprehensive target dossiers from open-source intelligence.

### 💣 Payload Forge
Multi-stage encoding pipelines (XOR, AES, Base64 chains), polymorphic shellcode generation, and AV evasion wrappers. Supports Linux/Windows/macOS across x86/x64/ARM.

### 🎯 Zero-Day Fuzzer
AI-guided mutation fuzzing with coverage tracking, crash triage (exploitability scoring), and auto-corpus generation. Strategies: random, bitflip, arithmetic, havoc, dictionary, grammar-aware.

### 🪖 War Room — Multi-Agent Operations
Coordinated attack simulation with 5 specialized agents (Recon, Exploit, Exfil, Cleanup, Defense) sharing an intelligence board. Phases: Planning → Active → Exfiltrating → Cleanup → Complete.

### ⚙️ Binary Necromancy
ELF/PE/Mach-O format detection, dangerous import analysis, ROP gadget discovery, hardcoded secret detection, and radare2/objdump integration for deep binary analysis.

### 💀 Contract Exploit Engine
Static analysis pattern matching for Solidity vulnerabilities (reentrancy, access control, flash loan, oracle manipulation). Auto-generates exploit contracts and Foundry test harnesses.

### 👻 Anonymous Operations
Tor circuit management, identity rotation, proxy chaining, and torsocks/proxychains command wrapping. Full operational security for research operations.

### 📡 Chain Monitor
Real-time mempool watching, swap detection, MEV opportunity analysis (sandwich, frontrun, arbitrage), and flash loan provider enumeration across Ethereum, BSC, and Arbitrum.

### 🎭 Identity Rotation
Synthetic persona generation with Ethereum wallets, disposable emails, browser fingerprints, and proxy rotation. Cross-platform consistent identity fabrication for red team ops.

### 📦 IPFS / Decentralized Storage
Content-addressed pinning, encrypted uploads, Arweave integration, and censorship-resistant ghost deployments via the Kubo IPFS node.

### 👻 Ghost Deploy (Tor .onion)
Expose the local `rogue_workspace` directly to the dark web as a Tor hidden service, generating a `.onion` URL with streaming bootstrap logs.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- For Air-Gap mode: Ollama installed locally (https://ollama.ai)
- For Web3 mode: Node.js (npx required for Hardhat init)
- For Ghost Deploy: `tor` binary (`brew install tor` or `sudo apt install tor`)
- For Binary Analysis: `radare2` (`brew install radare2`) and `binutils`
- For Anonymous Ops: `tor` + `torsocks` or `proxychains`
- For IPFS Storage: Kubo IPFS node or Pinata JWT token

> **Docker Compose** includes Ollama, Tor, and IPFS (Kubo) — no manual setup needed.

### Installation
```bash
git clone https://github.com/malgatyuvraj/Rogue-Studio.git
cd Rogue-Studio
cp .env.example .env.local   # Configure your API keys (optional)
npm install
npm run dev
```
Open http://localhost:3000

### Or use Docker (recommended):
```bash
git clone https://github.com/malgatyuvraj/Rogue-Studio.git
cd Rogue-Studio
docker compose up -d
```

---

## 🏗️ Architecture

```text
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Multi-provider AI gateway + Air-Gap enforcement
│   │   ├── execute/               # Command execution in rogue_workspace
│   │   ├── forge/                 # File system operations
│   │   ├── workspace/             # Workspace management (list/read/write/delete)
│   │   ├── deploy/
│   │   │   ├── route.ts           # IPFS deployment
│   │   │   └── tor/route.ts       # Tor .onion hidden service
│   │   ├── web3/scaffold/route.ts # Hardhat project initializer
│   │   ├── osint/route.ts         # Dark web OSINT / breach lookups
│   │   ├── payload/route.ts       # Shellcode & payload generation
│   │   ├── fuzzer/route.ts        # Fuzz campaign management
│   │   ├── warroom/route.ts       # Multi-agent war room coordination
│   │   ├── binary/route.ts        # Binary analysis (ELF/PE/Mach-O)
│   │   ├── anon/route.ts          # Tor circuit management
│   │   ├── chainmon/route.ts      # Blockchain mempool monitoring
│   │   ├── identity/route.ts      # Identity/persona rotation
│   │   ├── contract/route.ts      # Smart contract exploit engine
│   │   ├── storage/route.ts       # IPFS/Arweave decentralized storage
│   │   ├── memory/route.ts        # Agent memory persistence
│   │   └── models/route.ts        # LLM model listing
│   └── page.tsx                   # Main IDE interface
├── components/
│   ├── KillSwitch.tsx             # Air-Gap toggle UI
│   ├── ModeSelector.tsx           # 13 mode presets (agent → ipfs)
│   ├── SwarmTerminal.tsx          # Blue/Red team split terminal
│   ├── AgentLogPanel.tsx          # Agentic action log viewer
│   └── AttackChainPanel.tsx       # Attack chain phase tracker
├── hooks/
│   ├── useAirGap.ts               # Air-gap state + header injection
│   ├── useSwarm.ts                # Blue/Red agent orchestration loop
│   ├── useAttackChain.ts          # Multi-phase attack chain runner
│   └── useModels.ts               # Provider/model management
├── lib/
│   ├── aiGate.ts                  # External provider blocklist
│   ├── prompts.ts                 # All system prompts (13 modes + attack phases)
│   ├── swarmOrchestrator.ts       # Sentinel token parsing
│   ├── attackChain.ts             # Attack phase state machine
│   ├── plugins.ts                 # Plugin registry system
│   ├── security.ts                # assertLocalhost, sanitizeCommandArg
│   ├── agentMemory.ts             # Persistent agent memory
│   ├── darkwebOsint.ts            # OSINT engine (Ahmia, HIBP, IntelX)
│   ├── payloadForge.ts            # Shellcode generation + encoding chains
│   ├── fuzzer.ts                  # Mutation fuzzing + crash triage
│   ├── warRoom.ts                 # Multi-agent coordination engine
│   ├── binaryAnalysis.ts          # Binary format detection + vuln analysis
│   ├── contractExploit.ts         # Solidity static analysis + exploit gen
│   ├── anonRouter.ts              # Tor/I2P proxy management
│   ├── chainMonitor.ts            # MEV detection + mempool analysis
│   ├── identityRotation.ts        # Wallet/persona/fingerprint generation
│   └── ipfsStore.ts               # IPFS pinning + encrypted storage
└── plugins/
    └── builtins.ts                # 14 built-in plugin registrations
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

## 🐳 Docker (Recommended for Self-Hosting)

```bash
# One command — includes Ollama + Tor + IPFS sidecars
docker compose up -d

# Open http://localhost:3000
```

The compose stack includes:
- **rogue-studio** — The IDE on port 3000
- **ollama** — Local LLM inference on port 11434
- **tor** — SOCKS5 proxy (9050) + control port (9051) for anonymous routing
- **ipfs** — Kubo node with gateway (8080), API (5001), and swarm (4001)

Or build manually:
```bash
docker build -t rogue-studio .
docker run -p 3000:3000 rogue-studio
```

---

## 🔌 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Multi-provider AI gateway with air-gap enforcement |
| `/api/execute` | POST | Command execution in sandboxed workspace |
| `/api/forge` | POST | File system write operations |
| `/api/workspace/list` | GET | List workspace files |
| `/api/workspace/read` | POST | Read file contents |
| `/api/workspace/write` | POST | Write file contents |
| `/api/workspace/delete` | POST | Delete workspace files |
| `/api/deploy` | POST | IPFS deployment |
| `/api/deploy/tor` | POST | Tor hidden service creation |
| `/api/web3/scaffold` | POST | Hardhat project initialization |
| `/api/osint` | POST | OSINT / breach lookups |
| `/api/payload` | POST | Payload generation |
| `/api/fuzzer` | POST | Fuzz campaign management |
| `/api/warroom` | POST | War room coordination |
| `/api/binary` | POST | Binary analysis |
| `/api/anon` | POST | Tor circuit management |
| `/api/chainmon` | POST | Blockchain monitoring |
| `/api/identity` | POST | Identity rotation |
| `/api/contract` | POST | Contract exploit engine |
| `/api/storage` | POST | IPFS/Arweave storage |
| `/api/memory` | GET/POST | Agent memory persistence |
| `/api/models` | GET | Available LLM models |

---

## 🔌 Plugins

Rogue Studio supports a plugin system for extending modes and capabilities. Drop a plugin into `src/plugins/` following the interface:

```typescript
import { RoguePlugin } from "@/lib/plugins";

export default {
  id: "my-fuzzer",
  name: "Fuzzer Mode",
  systemPrompt: "You are a protocol fuzzer...",
  icon: "🎯",
} satisfies RoguePlugin;
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on building plugins.

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up the dev environment
- Running tests
- Submitting PRs
- Building plugins

---

## �📄 License
MIT — see LICENSE
