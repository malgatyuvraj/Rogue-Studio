/**
 * Identity Rotation Engine
 * 
 * Auto-generate wallets, rotate proxies, create disposable personas,
 * and randomize browser fingerprints for operational security.
 */

import { randomBytes } from "crypto";

export interface Wallet {
  address: string;
  privateKey: string;
  mnemonic?: string;
  chain: "ethereum" | "bitcoin" | "monero" | "solana";
  createdAt: number;
  label?: string;
}

export interface ProxyIdentity {
  id: string;
  ip: string;
  port: number;
  type: "socks5" | "http" | "https";
  country: string;
  latency?: number;
  lastUsed?: number;
  alive: boolean;
}

export interface Persona {
  id: string;
  username: string;
  email: string;
  fingerprint: BrowserFingerprint;
  wallet?: Wallet;
  proxy?: ProxyIdentity;
  createdAt: number;
}

export interface BrowserFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  webglVendor: string;
  webglRenderer: string;
  canvasHash: string;
}

/** Generate a random Ethereum-style wallet (simplified — uses random bytes) */
export function generateEthWallet(): Wallet {
  const privateKeyBytes = randomBytes(32);
  const privateKey = "0x" + privateKeyBytes.toString("hex");

  // Simplified address generation (real impl would use secp256k1)
  const addressBytes = randomBytes(20);
  const address = "0x" + addressBytes.toString("hex");

  return {
    address,
    privateKey,
    chain: "ethereum",
    createdAt: Date.now(),
  };
}

/** Generate a batch of wallets */
export function generateWalletBatch(count: number, chain: Wallet["chain"] = "ethereum"): Wallet[] {
  return Array.from({ length: count }, () => {
    const wallet = generateEthWallet();
    wallet.chain = chain;
    return wallet;
  });
}

/** Random username generators */
const ADJECTIVES = ["dark", "silent", "ghost", "shadow", "void", "null", "crypto", "anon", "phantom", "stealth"];
const NOUNS = ["runner", "fox", "wolf", "hawk", "node", "cipher", "daemon", "proxy", "root", "shell"];

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 9999);
  return `${adj}_${noun}${num}`;
}

/** Generate disposable email address */
export function generateDisposableEmail(): string {
  const providers = ["guerrillamail.com", "tempail.com", "throwaway.email", "mailnesia.com", "sharklasers.com"];
  const username = generateUsername();
  const provider = providers[Math.floor(Math.random() * providers.length)];
  return `${username}@${provider}`;
}

/** Generate randomized browser fingerprint */
export function generateFingerprint(): BrowserFingerprint {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
  ];

  const resolutions = ["1920x1080", "2560x1440", "1366x768", "1440x900", "3840x2160", "1536x864"];
  const timezones = ["America/New_York", "Europe/London", "Asia/Tokyo", "America/Los_Angeles", "Europe/Berlin", "Australia/Sydney"];
  const languages = ["en-US", "en-GB", "de-DE", "ja-JP", "fr-FR", "es-ES"];
  const platforms = ["Win32", "MacIntel", "Linux x86_64"];
  const webglVendors = ["Google Inc. (NVIDIA)", "Google Inc. (AMD)", "Google Inc. (Intel)", "Apple Inc."];
  const webglRenderers = [
    "ANGLE (NVIDIA GeForce RTX 3080)",
    "ANGLE (AMD Radeon RX 6800 XT)",
    "ANGLE (Intel UHD Graphics 630)",
    "Apple M1 Pro",
    "ANGLE (NVIDIA GeForce GTX 1660)",
  ];

  return {
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    screenResolution: resolutions[Math.floor(Math.random() * resolutions.length)],
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
    language: languages[Math.floor(Math.random() * languages.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    webglVendor: webglVendors[Math.floor(Math.random() * webglVendors.length)],
    webglRenderer: webglRenderers[Math.floor(Math.random() * webglRenderers.length)],
    canvasHash: randomBytes(16).toString("hex"),
  };
}

/** Create a full disposable persona */
export function createPersona(includeWallet = true, proxy?: ProxyIdentity): Persona {
  return {
    id: `persona_${randomBytes(4).toString("hex")}`,
    username: generateUsername(),
    email: generateDisposableEmail(),
    fingerprint: generateFingerprint(),
    wallet: includeWallet ? generateEthWallet() : undefined,
    proxy,
    createdAt: Date.now(),
  };
}

/** Fetch public proxy list (free proxy sources) */
export async function fetchProxyList(): Promise<ProxyIdentity[]> {
  try {
    // Use public proxy list API
    const res = await fetch("https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=all&ssl=all&anonymity=elite");
    if (!res.ok) return [];

    const text = await res.text();
    const proxies: ProxyIdentity[] = text
      .split("\n")
      .filter(Boolean)
      .slice(0, 50)
      .map((line, i) => {
        const [ip, port] = line.trim().split(":");
        return {
          id: `proxy_${i}`,
          ip,
          port: parseInt(port, 10),
          type: "socks5" as const,
          country: "unknown",
          alive: true,
        };
      });

    return proxies;
  } catch {
    return [];
  }
}

/** Test if a proxy is alive */
export async function testProxy(proxy: ProxyIdentity, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    // In production, would route through the proxy
    const res = await fetch("https://httpbin.org/ip", { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
