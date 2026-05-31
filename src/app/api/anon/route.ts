import { NextResponse } from "next/server";
import {
  isTorAvailable,
  isI2PAvailable,
  renewTorIdentity,
  createAnonSession,
  buildProxyChain,
  getProxyEnv,
  wrapCommandAnon,
  DEFAULT_TOR_CONFIG,
  DEFAULT_I2P_CONFIG,
} from "@/lib/anonRouter";
import { assertLocalhost } from "@/lib/security";

export async function GET(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const torUp = isTorAvailable();
  const i2pUp = isI2PAvailable();

  return NextResponse.json({
    tor: { available: torUp, proxy: DEFAULT_TOR_CONFIG },
    i2p: { available: i2pUp, proxy: DEFAULT_I2P_CONFIG },
  });
}

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "new_identity": {
      const success = await renewTorIdentity(body.controlPort, body.password || "");
      return NextResponse.json({ success, message: success ? "New Tor circuit established" : "Failed to rotate identity" });
    }

    case "create_session": {
      const session = createAnonSession(body.config);
      return NextResponse.json({ success: true, session });
    }

    case "proxy_chain": {
      const config = buildProxyChain(body.hops || [DEFAULT_TOR_CONFIG]);
      return NextResponse.json({ success: true, config });
    }

    case "wrap_command": {
      const wrapped = wrapCommandAnon(body.command, body.method || "torsocks");
      const env = getProxyEnv(body.proxy || DEFAULT_TOR_CONFIG);
      return NextResponse.json({ success: true, command: wrapped, env });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
