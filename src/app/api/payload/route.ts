import { NextResponse } from "next/server";
import { forgePayload, encodeChain, decodeChain, PayloadConfig, EncodingChain } from "@/lib/payloadForge";
import { assertLocalhost } from "@/lib/security";

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "forge": {
      const config: PayloadConfig = {
        type: body.type || "reverse_shell",
        platform: body.platform || "linux_x64",
        format: body.format || "python",
        lhost: body.lhost,
        lport: body.lport,
        encoding: body.encoding,
        evasion: body.evasion || [],
        customCode: body.customCode,
      };

      const payload = forgePayload(config);
      return NextResponse.json({ success: true, payload });
    }

    case "encode": {
      const { data, chain } = body;
      if (!data || !chain) return NextResponse.json({ error: "data and chain required" }, { status: 400 });
      const encoded = encodeChain(data, chain as EncodingChain);
      return NextResponse.json({ success: true, encoded, size: encoded.length });
    }

    case "decode": {
      const { data, chain } = body;
      if (!data || !chain) return NextResponse.json({ error: "data and chain required" }, { status: 400 });
      try {
        const decoded = decodeChain(data, chain as EncodingChain);
        return NextResponse.json({ success: true, decoded });
      } catch (err: unknown) {
        return NextResponse.json({ error: `Decode failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
      }
    }

    default:
      return NextResponse.json({ error: "Unknown action. Use: forge, encode, decode" }, { status: 400 });
  }
}
