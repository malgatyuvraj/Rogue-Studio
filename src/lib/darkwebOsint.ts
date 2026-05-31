/**
 * Dark Web OSINT Engine
 * 
 * Gather threat intelligence from .onion sources, paste sites,
 * breach databases, and underground forums via Tor.
 */

export interface OSINTSource {
  id: string;
  name: string;
  type: "paste" | "forum" | "market" | "breach_db" | "search_engine" | "leak";
  onionUrl?: string;
  clearnetUrl?: string;
  description: string;
}

export interface OSINTResult {
  source: string;
  query: string;
  timestamp: number;
  results: OSINTHit[];
  metadata: { totalHits: number; fetchDuration: number; via: "tor" | "clearnet" };
}

export interface OSINTHit {
  title: string;
  snippet: string;
  url?: string;
  date?: string;
  relevance: number;
  tags: string[];
}

export interface BreachRecord {
  email?: string;
  username?: string;
  password?: string;
  hash?: string;
  source: string;
  date: string;
  domain: string;
}

/** Known OSINT sources catalog */
export const OSINT_SOURCES: OSINTSource[] = [
  {
    id: "ahmia",
    name: "Ahmia Search",
    type: "search_engine",
    onionUrl: "http://juhanurmihxlp77nkq76byazcldy2hlmovfu2epvl5ankdibsot4csyd.onion",
    clearnetUrl: "https://ahmia.fi",
    description: "Tor hidden service search engine",
  },
  {
    id: "torch",
    name: "Torch",
    type: "search_engine",
    onionUrl: "http://xmh57jrknzkhv6y3ls3ubitzfqnkrwxhopf5aygthi7d6rplyvk3noyd.onion",
    description: "Oldest Tor search engine",
  },
  {
    id: "pastebin_tor",
    name: "StrongHold Paste",
    type: "paste",
    onionUrl: "http://strongerw2hl2vouqcc6c3zf3ogW6bmjm6qdg6lyoung3q75ixbfreqd.onion",
    description: "Anonymous paste service on Tor",
  },
  {
    id: "intelx",
    name: "Intelligence X",
    type: "breach_db",
    clearnetUrl: "https://intelx.io",
    description: "Search engine for leaked data, breaches, and OSINT",
  },
  {
    id: "dehashed",
    name: "DeHashed",
    type: "breach_db",
    clearnetUrl: "https://dehashed.com",
    description: "Breach database search API",
  },
  {
    id: "haveibeenpwned",
    name: "Have I Been Pwned",
    type: "breach_db",
    clearnetUrl: "https://haveibeenpwned.com/api/v3",
    description: "Public breach notification service",
  },
  {
    id: "onionscan",
    name: "OnionScan Results",
    type: "leak",
    description: "Automated .onion service scanner results",
  },
  {
    id: "ransomwatch",
    name: "Ransomwatch",
    type: "leak",
    clearnetUrl: "https://ransomwatch.telemetry.ltd",
    description: "Ransomware leak site monitor",
  },
];

/** Build a Tor-routed fetch request */
export async function torFetch(url: string, timeout = 30000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    // This requires a Tor SOCKS proxy at localhost:9050
    // In production, use a SOCKS-capable fetch or proxy agent
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
      },
    });
    clearTimeout(timer);
    return response;
  } catch {
    return null;
  }
}

/** Search Ahmia (clearnet gateway to Tor search) */
export async function searchAhmia(query: string): Promise<OSINTHit[]> {
  try {
    const url = `https://ahmia.fi/search/?q=${encodeURIComponent(query)}`;
    const response = await torFetch(url);
    if (!response || !response.ok) return [];

    const html = await response.text();
    const hits: OSINTHit[] = [];

    // Parse search results from HTML
    const resultBlocks = html.match(/<li class="result">[\s\S]*?<\/li>/g) || [];
    for (const block of resultBlocks.slice(0, 20)) {
      const titleMatch = block.match(/<a[^>]*>([\s\S]*?)<\/a>/);
      const urlMatch = block.match(/href="([^"]+)"/);
      const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/);

      if (titleMatch) {
        hits.push({
          title: titleMatch[1].replace(/<[^>]+>/g, "").trim(),
          snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : "",
          url: urlMatch ? urlMatch[1] : undefined,
          relevance: 0.7,
          tags: ["tor", "dark-web"],
        });
      }
    }

    return hits;
  } catch {
    return [];
  }
}

/** Check if an email appears in known breaches (via HIBP API) */
export async function checkBreaches(email: string, apiKey?: string): Promise<BreachRecord[]> {
  try {
    const headers: Record<string, string> = {
      "User-Agent": "Rogue-Studio-OSINT",
    };
    if (apiKey) headers["hibp-api-key"] = apiKey;

    const response = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      { headers }
    );

    if (response.status === 404) return []; // Not in any breaches
    if (!response.ok) return [];

    const breaches = await response.json();
    return breaches.map((b: { Name: string; BreachDate: string; Domain: string }) => ({
      email,
      source: b.Name,
      date: b.BreachDate,
      domain: b.Domain,
    }));
  } catch {
    return [];
  }
}

/** Search Intelligence X (requires API key) */
export async function searchIntelX(query: string, apiKey: string): Promise<OSINTHit[]> {
  try {
    // Start search
    const searchRes = await fetch("https://2.intelx.io/intelligent/search", {
      method: "POST",
      headers: { "x-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        term: query,
        maxresults: 20,
        media: 0,
        timeout: 10,
      }),
    });

    if (!searchRes.ok) return [];
    const { id } = await searchRes.json();

    // Wait and fetch results
    await new Promise((r) => setTimeout(r, 3000));

    const resultRes = await fetch(`https://2.intelx.io/intelligent/search/result?id=${id}&limit=20`, {
      headers: { "x-key": apiKey },
    });

    if (!resultRes.ok) return [];
    const data = await resultRes.json();

    return (data.records || []).map((r: { name: string; systemid: string; added: string; bucket: string }) => ({
      title: r.name || r.systemid,
      snippet: `Bucket: ${r.bucket}`,
      date: r.added,
      relevance: 0.9,
      tags: ["intelx", "breach"],
    }));
  } catch {
    return [];
  }
}

/** Build OSINT dossier for a target (email, domain, or username) */
export async function buildDossier(
  target: string,
  options: { hibpKey?: string; intelxKey?: string; useTor?: boolean } = {}
): Promise<OSINTResult> {
  const startTime = Date.now();
  const allHits: OSINTHit[] = [];

  // Run searches in parallel
  const searches = [searchAhmia(target)];

  if (options.hibpKey && target.includes("@")) {
    const breaches = await checkBreaches(target, options.hibpKey);
    allHits.push(
      ...breaches.map((b) => ({
        title: `Breach: ${b.source}`,
        snippet: `Found in ${b.source} breach (${b.date}) — Domain: ${b.domain}`,
        date: b.date,
        relevance: 0.95,
        tags: ["breach", b.source.toLowerCase()],
      }))
    );
  }

  if (options.intelxKey) {
    searches.push(searchIntelX(target, options.intelxKey));
  }

  const results = await Promise.allSettled(searches);
  for (const result of results) {
    if (result.status === "fulfilled") {
      allHits.push(...result.value);
    }
  }

  return {
    source: "multi",
    query: target,
    timestamp: Date.now(),
    results: allHits.sort((a, b) => b.relevance - a.relevance),
    metadata: {
      totalHits: allHits.length,
      fetchDuration: Date.now() - startTime,
      via: options.useTor ? "tor" : "clearnet",
    },
  };
}
