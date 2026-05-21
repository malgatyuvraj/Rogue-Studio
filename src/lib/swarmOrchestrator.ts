type SwarmRole = "blue" | "red" | "idle";

export interface SwarmState {
  role: SwarmRole;
  blueOutput: string;
  redOutput: string;
  iteration: number;
  verdict: "pending" | "vulnerable" | "secure";
}

const SWARM_SENTINELS = {
  BLUE_DONE: "<done>",
  RED_VULNERABLE: "<vulnerable>",
  RED_SECURE: "<secure>",
};

export function parseBlueStream(chunk: string): { isDone: boolean; content: string } {
  const isDone = chunk.includes(SWARM_SENTINELS.BLUE_DONE);
  return {
    isDone,
    content: chunk.replace(SWARM_SENTINELS.BLUE_DONE, "").trim(),
  };
}

export function parseRedStream(chunk: string): {
  verdict: "vulnerable" | "secure" | null;
  content: string;
} {
  if (chunk.includes(SWARM_SENTINELS.RED_VULNERABLE)) {
    return { verdict: "vulnerable", content: chunk };
  }
  if (chunk.includes(SWARM_SENTINELS.RED_SECURE)) {
    return { verdict: "secure", content: chunk };
  }
  return { verdict: null, content: chunk };
}
