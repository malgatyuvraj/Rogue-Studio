import { NextResponse } from "next/server";
import {
  createPersona,
  generateWalletBatch,
  generateFingerprint,
  fetchProxyList,
} from "@/lib/identityRotation";
import { assertLocalhost } from "@/lib/security";

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "persona": {
      const persona = createPersona(body.includeWallet ?? true);
      return NextResponse.json({ success: true, persona });
    }

    case "batch_personas": {
      const count = Math.min(body.count || 5, 50);
      const personas = Array.from({ length: count }, () => createPersona(body.includeWallet ?? true));
      return NextResponse.json({ success: true, personas });
    }

    case "wallets": {
      const count = Math.min(body.count || 10, 100);
      const wallets = generateWalletBatch(count, body.chain || "ethereum");
      return NextResponse.json({ success: true, wallets });
    }

    case "fingerprint": {
      const fingerprint = generateFingerprint();
      return NextResponse.json({ success: true, fingerprint });
    }

    case "proxies": {
      const proxies = await fetchProxyList();
      return NextResponse.json({ success: true, proxies, count: proxies.length });
    }

    default:
      return NextResponse.json({ error: "Unknown action. Use: persona, batch_personas, wallets, fingerprint, proxies" }, { status: 400 });
  }
}
