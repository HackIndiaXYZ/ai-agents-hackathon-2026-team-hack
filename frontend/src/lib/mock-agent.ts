import type { SerperResult } from "./web-search.functions";

export type RiskLevel = "low" | "medium" | "high";

export type LogEntry =
  | {
      id: string;
      kind: "planner";
      timestamp: number;
      title: string;
      subtasks: { id: number; description: string; tool: string; risk: RiskLevel }[];
    }
  | {
      id: string;
      kind: "executor";
      timestamp: number;
      tool: string;
      latencyMs: number;
      status: "success" | "blocked" | "warning" | "error";
      risk: RiskLevel;
      inputs: Record<string, unknown>;
      output: string;
      riskReason?: string;
      sources?: SerperResult[];
    }
  | {
      id: string;
      kind: "evaluator";
      timestamp: number;
      summary: string;
    };

export interface BlockedAction {
  tool: string;
  description: string;
  reason: string;
  inputs: Record<string, unknown>;
}

export interface SessionData {
  id: string;
  task: string;
  language: string;
  logs: LogEntry[];
  blocked: BlockedAction | null;
  completed: boolean;
  output: string;
  stats: { toolCalls: number; blocked: number; medium: number; succeeded: number };
  subtasksTotal: number;
  subtasksDone: number;
  phases: { name: string; at: number }[];
}

export const EXAMPLE_TASKS = [
  "Research the latest advances in multi-agent LLM orchestration",
  "Find the top 5 open-source vector databases and compare them",
  "What are the recent announcements from OpenAI DevDay 2025?",
];

const newId = () => Math.random().toString(36).slice(2, 10);

export type StepEvent =
  | { type: "log"; entry: LogEntry }
  | { type: "search"; query: string }
  | { type: "blocked"; blocked: BlockedAction }
  | { type: "unblock" }
  | { type: "complete"; output: string };

export function buildSessionScript(task: string): StepEvent[] {
  const query = task.trim();
  return [
    {
      type: "log",
      entry: {
        id: newId(),
        kind: "planner",
        timestamp: Date.now(),
        title: "Decomposed task into 3 subtasks",
        subtasks: [
          { id: 1, description: `Search the web for: "${query.slice(0, 60)}${query.length > 60 ? "…" : ""}"`, tool: "web.search", risk: "low" },
          { id: 2, description: "Synthesize findings into a structured brief", tool: "llm.synthesize", risk: "low" },
          { id: 3, description: "Cite top sources with snippets and URLs", tool: "report.draft", risk: "low" },
        ],
      },
    },
    { type: "search", query },
  ];
}

export function buildPostSearchEvents(
  query: string,
  results: SerperResult[],
  answer: string | null,
): StepEvent[] {
  const bullets = results
    .map((r, i) => `- **[${r.title}](${r.link})** — ${r.snippet}`)
    .join("\n");

  const answerBlock = answer ? `\n**Direct answer:** ${answer}\n\n` : "\n";

  return [
    {
      type: "log",
      entry: {
        id: newId(),
        kind: "executor",
        timestamp: Date.now(),
        tool: "llm.synthesize",
        latencyMs: 920,
        status: "success",
        risk: "low",
        inputs: { model: "llama-3.3-70b", sources: results.length, query },
        output: `Synthesized ${results.length} sources into a structured brief.`,
      },
    },
    {
      type: "log",
      entry: {
        id: newId(),
        kind: "evaluator",
        timestamp: Date.now(),
        summary: `All 3 subtasks completed. Retrieved ${results.length} live results from Google via Serper.`,
      },
    },
    {
      type: "complete",
      output:
        `## Research Brief\n\n**Query:** ${query}\n${answerBlock}### Top Sources\n${bullets || "- _No results returned._"}\n`,
    },
  ];
}

export function buildSearchErrorEvents(query: string, message: string): StepEvent[] {
  return [
    {
      type: "log",
      entry: {
        id: newId(),
        kind: "executor",
        timestamp: Date.now(),
        tool: "web.search",
        latencyMs: 0,
        status: "error",
        risk: "low",
        inputs: { q: query, num: 5 },
        output: `Search failed: ${message}`,
      },
    },
    {
      type: "log",
      entry: {
        id: newId(),
        kind: "evaluator",
        timestamp: Date.now(),
        summary: "Halted: web search tool returned an error. Verify SERPER_API_KEY is set.",
      },
    },
    {
      type: "complete",
      output: `## Task Halted\n\nWeb search failed: **${message}**\n\nCheck that \`SERPER_API_KEY\` is configured in project secrets.`,
    },
  ];
}

export function continueAfterApproval(approved: boolean): StepEvent[] {
  return [{ type: "unblock" }];
}
