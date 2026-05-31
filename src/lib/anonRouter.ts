/**
 * Anonymous Routing Layer
 * 
 * Routes all operations through Tor/I2P with automatic identity rotation.
 * Supports proxy chaining, circuit renewal, and multi-hop routing.
 */

import { execSync } from "child_process";

export interface TorCircuit {
  id: string;
  exitNode: string;
  country: string;
  createdAt: number;
  requestCount: number;
}

export interface ProxyConfig {
  type: "tor" | "i2p" | "socks5" | "http";
  host: string;
  port: number;
  auth?: { username: string; password: string };
}

export interface AnonSession {
  id: string;
  circuits: TorCircuit[];
  activeProxy: ProxyConfig;
  rotationInterval: number; // ms between identity rotations
  totalRequests: number;
  startedAt: number;
}

const DEFAULT_TOR_CONFIG: ProxyConfig = {
  type: "tor",
  host: "127.0.0.1",
  port: 9050,
};

const DEFAULT_I2P_CONFIG: ProxyConfig = {
  type: "socks5",
  host: "127.0.0.1",
  port: 4447,
};

/** Check if Tor is running locally */
export function isTorAvailable(): boolean {
  try {
    execSync("pgrep -x tor", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Check if I2P router is running */
export function isI2PAvailable(): boolean {
  try {
    execSync("pgrep -f i2prouter", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Request a new Tor identity (new circuit) */
export async function renewTorIdentity(controlPort = 9051, password = ""): Promise<boolean> {
  try {
    const net = await import("net");
    return new Promise((resolve) => {
      const client = net.default.createConnection({ port: controlPort, host: "127.0.0.1" }, () => {
        client.write(`AUTHENTICATE "${password}"\r\n`);
        client.write("SIGNAL NEWNYM\r\n");
        client.write("QUIT\r\n");
      });
      client.on("data", (data) => {
        const response = data.toString();
        if (response.includes("250")) {
          resolve(true);
        }
      });
      client.on("error", () => resolve(false));
      client.on("end", () => resolve(true));
      setTimeout(() => { client.destroy(); resolve(false); }, 5000);
    });
  } catch {
    return false;
  }
}

/** Get current Tor exit node info */
export async function getTorExitInfo(): Promise<{ ip: string; country: string } | null> {
  try {
    // Use Tor's check service to get our exit IP
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch("https://check.torproject.org/api/ip", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (response.ok) {
      const data = await response.json();
      return { ip: data.IP || "unknown", country: data.Country || "unknown" };
    }
    return null;
  } catch {
    return null;
  }
}

/** Build proxy chain configuration for multi-hop routing */
export function buildProxyChain(hops: ProxyConfig[]): string {
  // Generate proxychains-style config
  const lines = [
    "# Rogue Studio Auto-Generated Proxy Chain",
    "strict_chain",
    "proxy_dns",
    "tcp_read_time_out 15000",
    "tcp_connect_time_out 8000",
    "",
    "[ProxyList]",
  ];

  for (const hop of hops) {
    const auth = hop.auth ? `${hop.auth.username} ${hop.auth.password}` : "";
    lines.push(`${hop.type === "tor" ? "socks5" : hop.type} ${hop.host} ${hop.port} ${auth}`.trim());
  }

  return lines.join("\n");
}

/** Create a new anonymous session with auto-rotation */
export function createAnonSession(config?: Partial<AnonSession>): AnonSession {
  return {
    id: `anon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    circuits: [],
    activeProxy: DEFAULT_TOR_CONFIG,
    rotationInterval: config?.rotationInterval ?? 300000, // 5 min default
    totalRequests: 0,
    startedAt: Date.now(),
    ...config,
  };
}

/** Get environment variables for routing subprocess traffic through proxy */
export function getProxyEnv(proxy: ProxyConfig): Record<string, string> {
  const url = proxy.type === "tor" || proxy.type === "socks5"
    ? `socks5h://${proxy.host}:${proxy.port}`
    : `http://${proxy.host}:${proxy.port}`;

  return {
    ALL_PROXY: url,
    HTTP_PROXY: url,
    HTTPS_PROXY: url,
    http_proxy: url,
    https_proxy: url,
  };
}

/** Wrap a command to run through proxychains/torsocks */
export function wrapCommandAnon(command: string, method: "torsocks" | "proxychains" = "torsocks"): string {
  if (method === "torsocks") {
    return `torsocks ${command}`;
  }
  return `proxychains4 -q ${command}`;
}

export { DEFAULT_TOR_CONFIG, DEFAULT_I2P_CONFIG };
