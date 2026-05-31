import { NextResponse } from "next/server";
import {
  detectFormat,
  analyzeImports,
  findHardcodedSecrets,
  runRadare2,
  runObjdump,
  checkProtections,
  findROPGadgets,
  generatePatch,
} from "@/lib/binaryAnalysis";
import { assertLocalhost } from "@/lib/security";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { createHash } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "rogue_workspace", ".binaries");

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "analyze": {
      const { binaryBase64, filename } = body;
      if (!binaryBase64) return NextResponse.json({ error: "binaryBase64 required" }, { status: 400 });

      const buffer = Buffer.from(binaryBase64, "base64");
      const headerHex = buffer.slice(0, 64).toString("hex");
      const { format, arch, bits } = detectFormat(headerHex);

      // Extract strings
      const strings: string[] = [];
      let current = "";
      for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte >= 32 && byte < 127) {
          current += String.fromCharCode(byte);
        } else {
          if (current.length >= 4) strings.push(current);
          current = "";
        }
      }
      if (current.length >= 4) strings.push(current);

      // Find potential imports (simplified — look for known function names in strings)
      const knownFuncs = ["strcpy", "strcat", "sprintf", "gets", "scanf", "printf", "system", "popen", "exec", "malloc", "free", "fopen", "recv", "send"];
      const imports = strings.filter((s) => knownFuncs.some((f) => s === f || s === `_${f}`));

      // Analyze
      const importVulns = analyzeImports(imports);
      const secretVulns = findHardcodedSecrets(strings.slice(0, 500));

      // Hash
      const md5 = createHash("md5").update(buffer).digest("hex");
      const sha256 = createHash("sha256").update(buffer).digest("hex");

      return NextResponse.json({
        success: true,
        info: {
          format,
          arch,
          bits,
          size: buffer.length,
          hash: { md5, sha256 },
          stringsCount: strings.length,
          importsCount: imports.length,
        },
        vulns: [...importVulns, ...secretVulns],
        strings: strings.slice(0, 100),
        imports,
        filename: filename || "unknown",
      });
    }

    case "disassemble": {
      const { binaryBase64, filename } = body;
      if (!binaryBase64) return NextResponse.json({ error: "binaryBase64 required" }, { status: 400 });

      // Write to temp file for analysis
      const buffer = Buffer.from(binaryBase64, "base64");
      const filepath = join(UPLOAD_DIR, filename || `bin_${Date.now()}`);

      try {
        execSync(`mkdir -p "${UPLOAD_DIR}"`);
        writeFileSync(filepath, buffer);
        execSync(`chmod +x "${filepath}"`);

        // Try radare2 first
        const r2Result = runRadare2(filepath);
        if (r2Result) {
          return NextResponse.json({ success: true, tool: "radare2", ...r2Result });
        }

        // Fallback to objdump
        const objdumpResult = runObjdump(filepath);
        if (objdumpResult) {
          return NextResponse.json({ success: true, tool: "objdump", disassembly: objdumpResult });
        }

        return NextResponse.json({ error: "No disassembly tools available (install r2 or binutils)" }, { status: 500 });
      } finally {
        if (existsSync(filepath)) unlinkSync(filepath);
      }
    }

    case "protections": {
      const { binaryBase64, filename } = body;
      if (!binaryBase64) return NextResponse.json({ error: "binaryBase64 required" }, { status: 400 });

      const buffer = Buffer.from(binaryBase64, "base64");
      const filepath = join(UPLOAD_DIR, filename || `bin_${Date.now()}`);

      try {
        execSync(`mkdir -p "${UPLOAD_DIR}"`);
        writeFileSync(filepath, buffer);

        const protections = checkProtections(filepath);
        return NextResponse.json({ success: true, protections });
      } finally {
        if (existsSync(filepath)) unlinkSync(filepath);
      }
    }

    case "rop_gadgets": {
      const { binaryBase64, filename, maxGadgets } = body;
      if (!binaryBase64) return NextResponse.json({ error: "binaryBase64 required" }, { status: 400 });

      const buffer = Buffer.from(binaryBase64, "base64");
      const filepath = join(UPLOAD_DIR, filename || `bin_${Date.now()}`);

      try {
        execSync(`mkdir -p "${UPLOAD_DIR}"`);
        writeFileSync(filepath, buffer);

        const gadgets = findROPGadgets(filepath, maxGadgets || 20);
        return NextResponse.json({ success: true, gadgets, count: gadgets.length });
      } finally {
        if (existsSync(filepath)) unlinkSync(filepath);
      }
    }

    case "patch": {
      const { vuln } = body;
      if (!vuln) return NextResponse.json({ error: "vuln required" }, { status: 400 });
      const patch = generatePatch(vuln);
      return NextResponse.json({ success: true, patch });
    }

    default:
      return NextResponse.json({ error: "Unknown action. Use: analyze, disassemble, protections, rop_gadgets, patch" }, { status: 400 });
  }
}
