import { NextResponse } from "next/server";
import {
  isIPFSAvailable,
  ipfsAdd,
  ipfsGet,
  ipfsPinList,
  ipfsUnpin,
  remotePinIPFS,
  arweaveUpload,
  encryptContent,
  decryptContent,
} from "@/lib/ipfsStore";
import { assertLocalhost } from "@/lib/security";

export async function GET(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const available = await isIPFSAvailable();
  const pins = available ? await ipfsPinList() : [];

  return NextResponse.json({
    ipfs: { available, pinnedCount: pins.length, pins: pins.slice(0, 50) },
  });
}

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "pin": {
      let content = body.content as string;
      if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

      // Optional encryption
      if (body.encryptKey) {
        content = encryptContent(content, body.encryptKey);
      }

      const result = await ipfsAdd(content, body.filename || "rogue_data", body.config);
      if (!result) return NextResponse.json({ error: "IPFS add failed — is daemon running?" }, { status: 500 });

      // Remote pin for redundancy
      if (body.pinningService) {
        await remotePinIPFS(result.cid, result.name, body.pinningService);
      }

      return NextResponse.json({ success: true, file: { ...result, encrypted: !!body.encryptKey } });
    }

    case "get": {
      const { cid, decryptKey } = body;
      if (!cid) return NextResponse.json({ error: "cid required" }, { status: 400 });

      let content = await ipfsGet(cid, body.config);
      if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

      if (decryptKey) {
        content = decryptContent(content, decryptKey);
      }

      return NextResponse.json({ success: true, content, cid });
    }

    case "unpin": {
      const { cid } = body;
      if (!cid) return NextResponse.json({ error: "cid required" }, { status: 400 });
      const ok = await ipfsUnpin(cid);
      return NextResponse.json({ success: ok });
    }

    case "arweave": {
      const { content, contentType } = body;
      if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
      const result = await arweaveUpload(content, contentType);
      if (!result) return NextResponse.json({ error: "Arweave upload failed" }, { status: 500 });
      return NextResponse.json({ success: true, ...result });
    }

    default:
      return NextResponse.json({ error: "Unknown action. Use: pin, get, unpin, arweave" }, { status: 400 });
  }
}
