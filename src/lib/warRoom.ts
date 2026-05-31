/**
 * Multi-Agent War Room
 * 
 * Parallel specialized agents working together:
 * - Recon Agent: discovers attack surface
 * - Exploit Agent: develops and executes exploits
 * - Exfil Agent: extracts and stages data
 * - Cleanup Agent: covers tracks and persists access
 * - Defense Agent: monitors for detection and evades
 * 
 * Agents communicate via shared intelligence board.
 */

export type AgentRole = "recon" | "exploit" | "exfil" | "cleanup" | "defense" | "coordinator";

export interface WarRoomAgent {
  id: string;
  role: AgentRole;
  status: "idle" | "active" | "waiting" | "complete" | "failed";
  currentTask?: string;
  findings: string[];
  output: string;
  startedAt?: number;
  completedAt?: number;
}

export interface IntelItem {
  id: string;
  fromAgent: AgentRole;
  type: "finding" | "credential" | "access" | "artifact" | "alert" | "command";
  priority: "critical" | "high" | "medium" | "low";
  content: string;
  timestamp: number;
  consumed: boolean;
  consumedBy?: AgentRole;
}

export interface WarRoomState {
  id: string;
  target: string;
  agents: WarRoomAgent[];
  intelBoard: IntelItem[];
  phase: "planning" | "active" | "exfiltrating" | "cleanup" | "complete" | "aborted";
  startedAt: number;
  completedAt?: number;
  objectives: string[];
  objectivesCompleted: string[];
}

/** Agent role configurations with system prompts */
export const AGENT_CONFIGS: Record<AgentRole, { label: string; icon: string; systemPrompt: string }> = {
  recon: {
    label: "Recon Agent",
    icon: "🔍",
    systemPrompt: `You are the RECON AGENT in an autonomous red team operation.

Your objectives:
1. Map the full attack surface of the target
2. Identify services, versions, open ports, technologies
3. Find subdomains, hidden paths, API endpoints
4. Discover credentials in public sources
5. Report all findings to the intelligence board

Output format:
- Use <finding>...</finding> for each discovery
- Use <credential>...</credential> for any creds found  
- Use <access>...</access> for access vectors identified
- Use <done/> when reconnaissance is complete

Tools available: nmap, gobuster, subfinder, httpx, nuclei, curl, dig, whois
Execute commands with: <run_command>command here</run_command>`,
  },
  exploit: {
    label: "Exploit Agent",
    icon: "💀",
    systemPrompt: `You are the EXPLOIT AGENT in an autonomous red team operation.

Your objectives:
1. Review recon findings from the intelligence board
2. Select the highest-value attack vectors
3. Develop or adapt exploits for identified vulnerabilities
4. Execute exploits to gain initial access
5. Escalate privileges where possible
6. Report successful access to the intelligence board

Output format:
- Use <finding>...</finding> for exploitation results
- Use <access>...</access> for shells/access gained
- Use <credential>...</credential> for credentials obtained
- Use <alert>Trigger description</alert> if you detect defense mechanisms
- Use <done/> when exploitation objectives are met

Approach: Start with low-noise attacks, escalate if undetected.`,
  },
  exfil: {
    label: "Exfil Agent",
    icon: "📤",
    systemPrompt: `You are the EXFILTRATION AGENT in an autonomous red team operation.

Your objectives:
1. Use access obtained by the Exploit Agent
2. Identify high-value data (secrets, databases, configs)
3. Stage data for extraction
4. Exfiltrate via covert channels (DNS, HTTPS, steganography)
5. Verify data integrity

Output format:
- Use <artifact>description of exfiltrated data</artifact>
- Use <finding>...</finding> for notable discoveries
- Use <done/> when exfiltration is complete

Priorities: credentials > source code > databases > configs > PII`,
  },
  cleanup: {
    label: "Cleanup Agent",
    icon: "🧹",
    systemPrompt: `You are the CLEANUP AGENT in an autonomous red team operation.

Your objectives:
1. Remove evidence of the operation
2. Clear logs (auth, access, system)
3. Remove uploaded tools and artifacts
4. Establish persistent backdoor access
5. Restore modified configurations

Output format:
- Use <command>...</command> for cleanup actions taken
- Use <access>...</access> for persistence mechanisms planted
- Use <done/> when cleanup is complete

Rules: Be thorough. Check /var/log, .bash_history, auth.log, syslog, application logs.`,
  },
  defense: {
    label: "Defense Agent",
    icon: "🛡️",
    systemPrompt: `You are the DEFENSE EVASION AGENT monitoring the operation.

Your objectives:
1. Monitor for detection indicators
2. Alert other agents if defenses activate
3. Suggest evasion techniques
4. Modify attack patterns to avoid signatures
5. Monitor network traffic for anomaly alerts

Output format:
- Use <alert>detection risk description</alert> for warnings
- Use <command>evasion technique</command> for suggestions
- Use <finding>defensive posture detail</finding>

Continuously assess: IDS/IPS signatures, WAF rules, rate limiting, honeypots.`,
  },
  coordinator: {
    label: "Coordinator",
    icon: "🎯",
    systemPrompt: `You are the COORDINATOR AGENT managing the red team operation.

Your objectives:
1. Assign tasks to specialized agents based on intelligence
2. Decide when to advance to next phase
3. Resolve conflicts between agent actions
4. Ensure operational security
5. Generate final operation report

You receive all intel from all agents. Direct the operation.`,
  },
};

/** Create a new war room session */
export function createWarRoom(target: string, objectives: string[]): WarRoomState {
  const agents: WarRoomAgent[] = (["recon", "exploit", "exfil", "cleanup", "defense"] as AgentRole[]).map((role) => ({
    id: `agent_${role}_${Date.now()}`,
    role,
    status: "idle",
    findings: [],
    output: "",
  }));

  return {
    id: `warroom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    target,
    agents,
    intelBoard: [],
    phase: "planning",
    startedAt: Date.now(),
    objectives,
    objectivesCompleted: [],
  };
}

/** Post intelligence to the shared board */
export function postIntel(
  state: WarRoomState,
  fromAgent: AgentRole,
  type: IntelItem["type"],
  content: string,
  priority: IntelItem["priority"] = "medium"
): WarRoomState {
  const item: IntelItem = {
    id: `intel_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
    fromAgent,
    type,
    priority,
    content,
    timestamp: Date.now(),
    consumed: false,
  };

  return {
    ...state,
    intelBoard: [...state.intelBoard, item],
  };
}

/** Get pending intel for a specific agent role */
export function getIntelForAgent(state: WarRoomState, role: AgentRole): IntelItem[] {
  // Each agent gets intel relevant to their role
  const relevance: Record<AgentRole, IntelItem["type"][]> = {
    recon: ["alert", "command"],
    exploit: ["finding", "credential", "access", "alert"],
    exfil: ["access", "credential", "finding"],
    cleanup: ["access", "artifact", "command"],
    defense: ["alert", "finding"],
    coordinator: ["finding", "credential", "access", "artifact", "alert", "command"],
  };

  const types = relevance[role];
  return state.intelBoard.filter((item) => !item.consumed && types.includes(item.type));
}

/** Build context for an agent from the intel board */
export function buildAgentContext(state: WarRoomState, role: AgentRole): string {
  const intel = getIntelForAgent(state, role);
  if (intel.length === 0) return "";

  let context = "=== INTELLIGENCE BOARD ===\n";
  for (const item of intel) {
    context += `[${item.priority.toUpperCase()}] (from ${AGENT_CONFIGS[item.fromAgent].label}): ${item.content}\n`;
  }
  return context;
}

/** Parse agent output for intel items */
export function parseAgentOutput(output: string, role: AgentRole): IntelItem[] {
  const items: IntelItem[] = [];
  const timestamp = Date.now();

  const patterns: { regex: RegExp; type: IntelItem["type"]; priority: IntelItem["priority"] }[] = [
    { regex: /<finding>([\s\S]*?)<\/finding>/g, type: "finding", priority: "medium" },
    { regex: /<credential>([\s\S]*?)<\/credential>/g, type: "credential", priority: "critical" },
    { regex: /<access>([\s\S]*?)<\/access>/g, type: "access", priority: "high" },
    { regex: /<artifact>([\s\S]*?)<\/artifact>/g, type: "artifact", priority: "medium" },
    { regex: /<alert>([\s\S]*?)<\/alert>/g, type: "alert", priority: "critical" },
    { regex: /<command>([\s\S]*?)<\/command>/g, type: "command", priority: "low" },
  ];

  for (const { regex, type, priority } of patterns) {
    let match;
    while ((match = regex.exec(output)) !== null) {
      items.push({
        id: `intel_${timestamp}_${Math.random().toString(36).slice(2, 4)}`,
        fromAgent: role,
        type,
        priority,
        content: match[1].trim(),
        timestamp,
        consumed: false,
      });
    }
  }

  return items;
}

/** Determine the next phase based on state */
export function getNextWarPhase(state: WarRoomState): WarRoomState["phase"] {
  const hasAccess = state.intelBoard.some((i) => i.type === "access" && i.fromAgent === "exploit");
  const hasArtifacts = state.intelBoard.some((i) => i.type === "artifact");

  switch (state.phase) {
    case "planning":
      return "active"; // Always advance from planning
    case "active":
      return hasAccess ? "exfiltrating" : "active";
    case "exfiltrating":
      return hasArtifacts ? "cleanup" : "exfiltrating";
    case "cleanup":
      return "complete";
    default:
      return state.phase;
  }
}
