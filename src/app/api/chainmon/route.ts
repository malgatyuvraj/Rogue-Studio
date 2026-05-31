import { NextResponse } from "next/server";
import { scanForMEV, getPendingTxs, getFlashLoanProviders, generateSandwichBundle } from "@/lib/chainMonitor";
import { assertLocalhost } from "@/lib/security";

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action, rpcUrl } = body;

  switch (action) {
    case "scan_mev": {
      if (!rpcUrl) return NextResponse.json({ error: "rpcUrl required" }, { status: 400 });
      const opportunities = await scanForMEV(rpcUrl);
      return NextResponse.json({ success: true, opportunities, count: opportunities.length });
    }

    case "pending_txs": {
      if (!rpcUrl) return NextResponse.json({ error: "rpcUrl required" }, { status: 400 });
      const txs = await getPendingTxs(rpcUrl, body.count || 20);
      return NextResponse.json({ success: true, transactions: txs });
    }

    case "flash_providers": {
      const providers = getFlashLoanProviders();
      return NextResponse.json({ success: true, providers });
    }

    case "sandwich_bundle": {
      const { targetTx, myAddress } = body;
      if (!targetTx || !myAddress) return NextResponse.json({ error: "targetTx and myAddress required" }, { status: 400 });
      const bundle = generateSandwichBundle(targetTx, myAddress);
      return NextResponse.json({ success: true, bundle });
    }

    default:
      return NextResponse.json({ error: "Unknown action. Use: scan_mev, pending_txs, flash_providers, sandwich_bundle" }, { status: 400 });
  }
}
