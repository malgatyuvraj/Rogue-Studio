import { NextResponse } from "next/server";
import {
  createWarRoom,
  postIntel,
  getIntelForAgent,
  buildAgentContext,
  parseAgentOutput,
  getNextWarPhase,
  AGENT_CONFIGS,
  AgentRole,
} from "@/lib/warRoom";
import { assertLocalhost } from "@/lib/security";

// In-memory war room sessions (would use persistent store in production)
const sessions = new Map<string, ReturnType<typeof createWarRoom>>();

export async function GET(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const session = sessions.get(id);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json({ success: true, session });
  }

  // List all sessions
  const list = Array.from(sessions.values()).map((s) => ({
    id: s.id,
    target: s.target,
    phase: s.phase,
    agentCount: s.agents.length,
    intelCount: s.intelBoard.length,
    startedAt: s.startedAt,
  }));

  return NextResponse.json({ success: true, sessions: list });
}

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "create": {
      const { target, objectives } = body;
      if (!target) return NextResponse.json({ error: "target required" }, { status: 400 });
      const session = createWarRoom(target, objectives || ["full compromise"]);
      sessions.set(session.id, session);
      return NextResponse.json({ success: true, session });
    }

    case "post_intel": {
      const { sessionId, fromAgent, type, content, priority } = body;
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const updated = postIntel(session, fromAgent, type, content, priority);
      sessions.set(sessionId, updated);
      return NextResponse.json({ success: true, intelCount: updated.intelBoard.length });
    }

    case "get_context": {
      const { sessionId, role } = body;
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const context = buildAgentContext(session, role as AgentRole);
      const config = AGENT_CONFIGS[role as AgentRole];
      return NextResponse.json({ success: true, context, systemPrompt: config?.systemPrompt });
    }

    case "process_output": {
      const { sessionId, role, output } = body;
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const intelItems = parseAgentOutput(output, role as AgentRole);
      let updated = session;
      for (const item of intelItems) {
        updated = postIntel(updated, item.fromAgent, item.type, item.content, item.priority);
      }

      // Update agent status
      const agent = updated.agents.find((a) => a.role === role);
      if (agent) {
        agent.output += output;
        agent.findings.push(...intelItems.map((i) => i.content));
      }

      // Check phase advancement
      const nextPhase = getNextWarPhase(updated);
      if (nextPhase !== updated.phase) {
        updated = { ...updated, phase: nextPhase };
      }

      sessions.set(sessionId, updated);
      return NextResponse.json({ success: true, newIntel: intelItems.length, phase: updated.phase });
    }

    case "advance_phase": {
      const { sessionId } = body;
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const nextPhase = getNextWarPhase(session);
      const updated = { ...session, phase: nextPhase };
      sessions.set(sessionId, updated);
      return NextResponse.json({ success: true, phase: updated.phase });
    }

    case "get_intel": {
      const { sessionId, role } = body;
      const session = sessions.get(sessionId);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const intel = role ? getIntelForAgent(session, role as AgentRole) : session.intelBoard;
      return NextResponse.json({ success: true, intel });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
