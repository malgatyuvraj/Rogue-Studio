/**
 * Decentralized Persistence Layer
 * 
 * IPFS pinning, Arweave uploads, and encrypted decentralized storage.
 * Content-addressed, censorship-resistant file persistence.
 */

export interface IPFSConfig {
  gateway: string;
  apiUrl: string;
  pinningService?: { url: string; key: string };
}

export interface StoredFile {
  cid: string;
  name: string;
  size: number;
  encrypted: boolean;
  timestamp: number;
  gateway: string;
  arweaveTxId?: string;
}

export interface ArweaveConfig {
  gateway: string;
  bundlerUrl: string;
}

const DEFAULT_IPFS: IPFSConfig = {
  gateway: "https://ipfs.io/ipfs",
  apiUrl: "http://127.0.0.1:5001/api/v0",
};

const DEFAULT_ARWEAVE: ArweaveConfig = {
  gateway: "https://arweave.net",
  bundlerUrl: "https://node1.bundlr.network",
};

/** Check if local IPFS daemon is running */
export async function isIPFSAvailable(config = DEFAULT_IPFS): Promise<boolean> {
  try {
    const res = await fetch(`${config.apiUrl}/id`, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Pin content to IPFS */
export async function ipfsAdd(
  content: string | Buffer,
  filename: string,
  config = DEFAULT_IPFS
): Promise<StoredFile | null> {
  try {
    const formData = new FormData();
    const blobData = typeof content === "string" ? content : new Uint8Array(content);
    const blob = new Blob([blobData], { type: "application/octet-stream" });
    formData.append("file", blob, filename);

    const res = await fetch(`${config.apiUrl}/add?pin=true`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      cid: data.Hash,
      name: data.Name || filename,
      size: parseInt(data.Size, 10),
      encrypted: false,
      timestamp: Date.now(),
      gateway: `${config.gateway}/${data.Hash}`,
    };
  } catch {
    return null;
  }
}

/** Pin to remote pinning service (Pinata, Web3.Storage, etc.) */
export async function remotePinIPFS(
  cid: string,
  name: string,
  pinningService: { url: string; key: string }
): Promise<boolean> {
  try {
    const res = await fetch(`${pinningService.url}/pins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinningService.key}`,
      },
      body: JSON.stringify({
        cid,
        name,
        origins: [],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Retrieve content from IPFS by CID */
export async function ipfsGet(cid: string, config = DEFAULT_IPFS): Promise<string | null> {
  try {
    // Try local node first
    const localRes = await fetch(`${config.apiUrl}/cat?arg=${cid}`, { method: "POST" });
    if (localRes.ok) return await localRes.text();

    // Fallback to public gateway
    const gatewayRes = await fetch(`${config.gateway}/${cid}`);
    if (gatewayRes.ok) return await gatewayRes.text();

    return null;
  } catch {
    return null;
  }
}

/** List pinned content */
export async function ipfsPinList(config = DEFAULT_IPFS): Promise<string[]> {
  try {
    const res = await fetch(`${config.apiUrl}/pin/ls?type=recursive`, { method: "POST" });
    if (!res.ok) return [];
    const data = await res.json();
    return Object.keys(data.Keys || {});
  } catch {
    return [];
  }
}

/** Unpin content from IPFS */
export async function ipfsUnpin(cid: string, config = DEFAULT_IPFS): Promise<boolean> {
  try {
    const res = await fetch(`${config.apiUrl}/pin/rm?arg=${cid}`, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Upload to Arweave via bundler */
export async function arweaveUpload(
  content: string | Buffer,
  contentType = "application/octet-stream",
  config = DEFAULT_ARWEAVE
): Promise<{ txId: string; url: string } | null> {
  try {
    const data = typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);

    const res = await fetch(`${config.bundlerUrl}/tx`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: data,
    });

    if (!res.ok) return null;

    const result = await res.json();
    return {
      txId: result.id,
      url: `${config.gateway}/${result.id}`,
    };
  } catch {
    return null;
  }
}

/** Simple XOR encryption for content before pinning */
export function encryptContent(content: string, key: string): string {
  const encrypted = Array.from(content)
    .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join("");
  return Buffer.from(encrypted, "binary").toString("base64");
}

/** Decrypt XOR-encrypted content */
export function decryptContent(encrypted: string, key: string): string {
  const decoded = Buffer.from(encrypted, "base64").toString("binary");
  return Array.from(decoded)
    .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join("");
}

export { DEFAULT_IPFS, DEFAULT_ARWEAVE };
