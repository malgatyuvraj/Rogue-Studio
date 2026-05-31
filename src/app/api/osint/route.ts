import { NextResponse } from "next/server";
import { buildDossier, searchAhmia, checkBreaches, OSINT_SOURCES } from "@/lib/darkwebOsint";
import { assertLocalhost } from "@/lib/security";

export async function GET(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;
  return NextResponse.json({ sources: OSINT_SOURCES });
}

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action, target } = body;

  if (!target) {
    return NextResponse.json({ error: "target required" }, { status: 400 });
  }

  switch (action) {
    case "dossier": {
      const result = await buildDossier(target, {
        hibpKey: body.hibpKey,
        intelxKey: body.intelxKey,
        useTor: body.useTor ?? false,
      });
      return NextResponse.json({ success: true, result });
    }

    case "search_darkweb": {
      const hits = await searchAhmia(target);
      return NextResponse.json({ success: true, hits });
    }

    case "check_breaches": {
      const records = await checkBreaches(target, body.apiKey);
      return NextResponse.json({ success: true, records });
    }

    default:
      return NextResponse.json({ error: "Unknown action. Use: dossier, search_darkweb, check_breaches" }, { status: 400 });
  }
}
