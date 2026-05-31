import { NextResponse } from "next/server";
import { auditContract, generateExploit, generateFoundryTest } from "@/lib/contractExploit";
import { assertLocalhost } from "@/lib/security";

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "audit": {
      const { source, contractName } = body;
      if (!source) return NextResponse.json({ error: "source required" }, { status: 400 });
      const result = auditContract(source, contractName || "Target");
      return NextResponse.json({ success: true, result });
    }

    case "exploit": {
      const { source, contractName, targetAddress, vulnIndex } = body;
      if (!source) return NextResponse.json({ error: "source required" }, { status: 400 });

      const audit = auditContract(source, contractName);
      const vuln = audit.vulns[vulnIndex ?? 0];
      if (!vuln) return NextResponse.json({ error: "No exploitable vulnerability found" }, { status: 404 });

      const exploit = generateExploit(vuln, targetAddress || "0x0000000000000000000000000000000000000000", source);
      const test = generateFoundryTest(exploit, contractName || "Target");

      return NextResponse.json({
        success: true,
        vuln,
        exploit,
        test,
        audit,
      });
    }

    case "scan_address": {
      // Fetch contract source from block explorer (etherscan-compatible)
      const { address, chainId, apiKey } = body;
      if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

      const explorerUrls: Record<number, string> = {
        1: "https://api.etherscan.io/api",
        56: "https://api.bscscan.com/api",
        137: "https://api.polygonscan.com/api",
        42161: "https://api.arbiscan.io/api",
        10: "https://api-optimistic.etherscan.io/api",
      };

      const baseUrl = explorerUrls[chainId || 1];
      if (!baseUrl) return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });

      try {
        const url = `${baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey || ""}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "1" && data.result[0]?.SourceCode) {
          const source = data.result[0].SourceCode;
          const name = data.result[0].ContractName;
          const audit = auditContract(source, name);
          return NextResponse.json({ success: true, source, audit });
        }

        return NextResponse.json({ error: "Contract source not verified or not found" }, { status: 404 });
      } catch (err: unknown) {
        return NextResponse.json({ error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
      }
    }

    default:
      return NextResponse.json({ error: "Unknown action. Use: audit, exploit, scan_address" }, { status: 400 });
  }
}
