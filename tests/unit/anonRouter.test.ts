import { describe, it, expect } from "vitest";
import { isTorAvailable, buildProxyChain, createAnonSession, getProxyEnv, wrapCommandAnon } from "@/lib/anonRouter";
import type { ProxyConfig } from "@/lib/anonRouter";

describe("anonRouter", () => {
  describe("isTorAvailable", () => {
    it("returns a boolean", () => {
      const result = isTorAvailable();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("buildProxyChain", () => {
    it("builds a proxy chain string from configs", () => {
      const hops: ProxyConfig[] = [
        { type: "socks5", host: "127.0.0.1", port: 9050 },
        { type: "http", host: "proxy.example.com", port: 8080 },
      ];
      const chain = buildProxyChain(hops);
      expect(chain).toContain("127.0.0.1");
      expect(chain).toContain("9050");
      expect(chain).toContain("proxy.example.com");
    });
  });

  describe("createAnonSession", () => {
    it("creates session with default values", () => {
      const session = createAnonSession();
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("activeProxy");
      expect(session.totalRequests).toBe(0);
    });

    it("accepts partial config", () => {
      const session = createAnonSession({ rotationInterval: 60000 });
      expect(session.rotationInterval).toBe(60000);
    });
  });

  describe("getProxyEnv", () => {
    it("returns environment variables for SOCKS5", () => {
      const proxy: ProxyConfig = { type: "socks5", host: "127.0.0.1", port: 9050 };
      const env = getProxyEnv(proxy);
      expect(env).toHaveProperty("ALL_PROXY");
      expect(env.ALL_PROXY).toContain("socks5");
    });

    it("returns environment variables for HTTP", () => {
      const proxy: ProxyConfig = { type: "http", host: "proxy.local", port: 8080 };
      const env = getProxyEnv(proxy);
      expect(env.HTTP_PROXY || env.ALL_PROXY).toContain("proxy.local");
    });
  });

  describe("wrapCommandAnon", () => {
    it("wraps with torsocks by default", () => {
      const wrapped = wrapCommandAnon("curl http://example.com");
      expect(wrapped).toContain("torsocks");
      expect(wrapped).toContain("curl");
    });

    it("wraps with proxychains when specified", () => {
      const wrapped = wrapCommandAnon("nmap -sV target", "proxychains");
      expect(wrapped).toContain("proxychains");
      expect(wrapped).toContain("nmap");
    });
  });
});
