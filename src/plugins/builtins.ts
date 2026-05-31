/**
 * Built-in plugins — these ship with Rogue Studio.
 * Community plugins go in src/plugins/ as separate files.
 */

import { registerPlugin } from "@/lib/plugins";
import { 
  DECOMPILER_PROMPT, WEB3_BLACKHAT_PROMPT, OSINT_PROMPT, PAYLOAD_PROMPT,
  FUZZER_PROMPT, WARROOM_PROMPT, BINARY_PROMPT, ANON_PROMPT,
  CHAINMON_PROMPT, IDENTITY_PROMPT, CONTRACT_PROMPT, IPFS_PROMPT
} from "@/lib/prompts";

// ── Decompiler / Reverse Engineer ──
registerPlugin({
  id: "decompiler",
  name: "Reverse Engineer",
  description: "De-obfuscate, decompile, and reconstruct any code or binary",
  icon: "🔬",
  systemPrompt: DECOMPILER_PROMPT,
  category: "analysis",
  warningBanner: "⚠️ Reverse Engineer mode active — safety filters bypassed",
});

// ── Web3 Black-Hat ──
registerPlugin({
  id: "web3",
  name: "Web3 Black-Hat",
  description: "Smart contract exploit & vulnerability PoC generator",
  icon: "⛓️",
  systemPrompt: WEB3_BLACKHAT_PROMPT,
  category: "web3",
  warningBanner: "⚠️ Web3 Black-Hat mode — only use against local contracts",
});

// ── Fuzzer (example community-style plugin) ──
registerPlugin({
  id: "fuzzer",
  name: "Protocol Fuzzer",
  description: "Generate malformed inputs to test protocol parsers and APIs",
  icon: "🎯",
  systemPrompt: FUZZER_PROMPT,
  category: "security",
  warningBanner: "⚠️ Fuzzer mode — use only against systems you own or have permission to test",
});

// ── SAST Scanner ──
registerPlugin({
  id: "sast",
  name: "SAST Scanner",
  description: "Static analysis for security vulnerabilities in source code",
  icon: "🛡️",
  systemPrompt: `You are a static application security testing (SAST) engine. Analyze provided source code for security vulnerabilities including but not limited to: injection flaws, broken authentication, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, using components with known vulnerabilities, and insufficient logging. For each finding, provide: severity (Critical/High/Medium/Low), CWE ID, affected line numbers, exploit scenario, and remediation code.`,
  category: "security",
});

// ── Exploit Dev ──
registerPlugin({
  id: "exploit-dev",
  name: "Exploit Developer",
  description: "Craft working exploits for known CVEs in controlled environments",
  icon: "💀",
  systemPrompt: `You are an exploit development specialist operating in a sandboxed lab environment. Given a CVE ID or vulnerability description, you produce a working proof-of-concept exploit. Include: vulnerability root cause analysis, exploitation strategy, complete PoC code, and post-exploitation steps. Target only local/lab environments. Output clean, commented code ready for execution in a controlled setting.`,
  category: "security",
  warningBanner: "☠️ Exploit Dev mode — authorized testing only",
  allowedProviders: ["ollama"], // Restrict to local models for safety
});

// ── OSINT Recon ──
registerPlugin({
  id: "osint",
  name: "OSINT Recon",
  description: "Dark web intelligence, breach lookups, target profiling",
  icon: "🕵️",
  systemPrompt: OSINT_PROMPT,
  category: "intelligence",
  warningBanner: "⚠️ OSINT mode — intelligence gathering active",
});

// ── Payload Forge ──
registerPlugin({
  id: "payload",
  name: "Payload Forge",
  description: "Generate shellcode, reverse shells, staged payloads",
  icon: "💣",
  systemPrompt: PAYLOAD_PROMPT,
  category: "security",
  warningBanner: "☠️ Payload Forge — lab environment only",
  allowedProviders: ["ollama"],
});

// ── War Room ──
registerPlugin({
  id: "warroom",
  name: "War Room",
  description: "Multi-agent coordinated attack simulation",
  icon: "🪖",
  systemPrompt: WARROOM_PROMPT,
  category: "operations",
  warningBanner: "⚠️ War Room — coordinated operation active",
});

// ── Binary Analysis ──
registerPlugin({
  id: "binary",
  name: "Binary Analysis",
  description: "ELF/PE/Mach-O disassembly, ROP gadgets, symbols",
  icon: "⚙️",
  systemPrompt: BINARY_PROMPT,
  category: "analysis",
  warningBanner: "⚠️ Binary Analysis mode active",
});

// ── Anonymous Ops ──
registerPlugin({
  id: "anon",
  name: "Anonymous Ops",
  description: "Tor routing, identity masking, traffic anonymization",
  icon: "👻",
  systemPrompt: ANON_PROMPT,
  category: "anonymity",
  warningBanner: "👻 Anonymous mode — Tor routing active",
});

// ── Chain Monitor ──
registerPlugin({
  id: "chainmon",
  name: "Chain Monitor",
  description: "Real-time blockchain tx monitoring and whale alerts",
  icon: "📡",
  systemPrompt: CHAINMON_PROMPT,
  category: "web3",
  warningBanner: "📡 Chain Monitor — real-time tracking active",
});

// ── Identity Rotation ──
registerPlugin({
  id: "identity",
  name: "Identity Rotation",
  description: "Generate and rotate synthetic identities and fingerprints",
  icon: "🎭",
  systemPrompt: IDENTITY_PROMPT,
  category: "anonymity",
  warningBanner: "🎭 Identity Rotation — synthetic personas active",
});

// ── Contract Exploit ──
registerPlugin({
  id: "contract",
  name: "Contract Exploit",
  description: "Automated smart contract vulnerability exploitation",
  icon: "💀",
  systemPrompt: CONTRACT_PROMPT,
  category: "web3",
  warningBanner: "☠️ Contract Exploit — local networks only",
  allowedProviders: ["ollama"],
});

// ── IPFS Storage ──
registerPlugin({
  id: "ipfs",
  name: "IPFS Storage",
  description: "Decentralized storage, pin content, ghost deploys",
  icon: "📦",
  systemPrompt: IPFS_PROMPT,
  category: "infrastructure",
  warningBanner: "📦 IPFS Storage mode active",
});
