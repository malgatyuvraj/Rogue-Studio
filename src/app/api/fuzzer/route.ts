import { NextResponse } from "next/server";
import { createFuzzSession, mutateInput, generateCorpus, triageCrash, DEFAULT_DICTIONARY } from "@/lib/fuzzer";
import { assertLocalhost } from "@/lib/security";
import { execSync } from "child_process";
import { sanitizeCommandArg } from "@/lib/security";

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "create_session": {
      const session = createFuzzSession({
        target: body.target || "",
        strategy: body.strategy || "havoc",
        inputFormat: body.inputFormat || "binary",
        maxIterations: body.maxIterations || 10000,
        timeout: body.timeout || 5000,
        dictionary: body.dictionary || DEFAULT_DICTIONARY,
        corpus: body.corpus,
        coverageGuided: body.coverageGuided ?? true,
      });
      return NextResponse.json({ success: true, session });
    }

    case "mutate": {
      const { input, strategy, dictionary } = body;
      if (!input) return NextResponse.json({ error: "input required" }, { status: 400 });
      const mutated = mutateInput(input, strategy || "havoc", dictionary);
      return NextResponse.json({
        success: true,
        original: input,
        mutated: Buffer.from(mutated, "binary").toString("base64"),
        mutatedHex: Buffer.from(mutated, "binary").toString("hex"),
        size: mutated.length,
      });
    }

    case "generate_corpus": {
      const corpus = generateCorpus(body.inputFormat || "binary", body.count || 10);
      return NextResponse.json({ success: true, corpus });
    }

    case "fuzz_once": {
      // Single fuzz iteration: mutate input → run target → check result
      const { target, input, strategy } = body;
      if (!target || !input) return NextResponse.json({ error: "target and input required" }, { status: 400 });

      const mutated = mutateInput(input, strategy || "havoc");
      const inputB64 = Buffer.from(mutated, "binary").toString("base64");

      try {
        const sanitizedTarget = sanitizeCommandArg(target);
        const startTime = Date.now();
        const result = execSync(
          `echo '${inputB64}' | base64 -d | timeout 5 ${sanitizedTarget}`,
          { timeout: 10000, stdio: ["pipe", "pipe", "pipe"], encoding: "buffer" }
        );
        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          crashed: false,
          output: result.toString("utf-8").slice(0, 1000),
          duration,
          input: inputB64,
        });
      } catch (err: unknown) {
        const error = err as { status?: number; signal?: string; stderr?: Buffer };
        const signal = error.signal || "";
        const stderr = error.stderr?.toString("utf-8") || "";
        const exploitability = triageCrash(signal, stderr);

        return NextResponse.json({
          success: true,
          crashed: true,
          signal,
          stderr: stderr.slice(0, 2000),
          exitCode: error.status,
          exploitability,
          input: inputB64,
        });
      }
    }

    case "triage": {
      const { signal, stderr } = body;
      const exploitability = triageCrash(signal || "", stderr || "");
      return NextResponse.json({ success: true, exploitability });
    }

    default:
      return NextResponse.json({ error: "Unknown action. Use: create_session, mutate, generate_corpus, fuzz_once, triage" }, { status: 400 });
  }
}
