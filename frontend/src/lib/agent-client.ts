// Real backend client for AgentBridge at http://localhost:8000

export const API_BASE = "http://localhost:8000";
export const WS_BASE = "ws://localhost:8000";

export interface RunResponse {
  session_id: string;
}

export async function startRun(task: string, language: string): Promise<RunResponse> {
  const res = await fetch(`${API_BASE}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, language }),
  });
  if (!res.ok) throw new Error(`Run failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function postApproval(sessionId: string, approved: boolean, reason?: string) {
  const res = await fetch(`${API_BASE}/api/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, approved, reason: reason ?? "" }),
  });
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
  return res.json().catch(() => ({}));
}

// Backend wire format (real shape).
export type AgentKind = "planner" | "executor" | "evaluator";
export type RiskLevel = "low" | "medium" | "high";

export interface ToolCallData {
  agent?: AgentKind;
  tool?: string;
  inputs?: Record<string, unknown>;
  output?: string;
  risk_level?: RiskLevel;
  risk_score?: number;
  risk_reason?: string;
  status?: "success" | "blocked" | "error" | "warning";
  duration_ms?: number;
  subtasks?: { id?: number; description: string; required_tool?: string; tool?: string; risk_level?: RiskLevel }[];
  subtask_count?: number;
  summary?: string;
}

export interface PendingApproval {
  subtask?: { required_tool?: string; description?: string; inputs?: Record<string, unknown> };
  risk?: { reason?: string; score?: number };
}

export type WireEvent =
  | { type: "tool_call"; data: ToolCallData }
  | { type: "status"; status?: string; message?: string }
  | { type: "done"; final_output?: string; summary?: { total_subtasks?: number; completed?: number; failed?: number } }
  | { type: "blocked"; pending_approval?: PendingApproval }
  | { type: "error"; message?: string }
  | { type: string; [k: string]: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asRiskLevel(value: unknown): RiskLevel | undefined {
  return value === "low" || value === "medium" || value === "high" ? value : undefined;
}

function asAgentKind(value: unknown): AgentKind | undefined {
  return value === "planner" || value === "executor" || value === "evaluator" ? value : undefined;
}

function asToolStatus(value: unknown): ToolCallData["status"] | undefined {
  return value === "success" || value === "blocked" || value === "error" || value === "warning"
    ? value
    : undefined;
}

function normalizeToolData(raw: unknown): ToolCallData {
  const source = isRecord(raw) ? raw : {};
  const subtasks = Array.isArray(source.subtasks)
    ? source.subtasks.map((subtask) => {
        const item = isRecord(subtask) ? subtask : {};
        return {
          id: asNumber(item.id),
          description: asString(item.description) ?? "",
          required_tool: asString(item.required_tool),
          tool: asString(item.tool),
          risk_level: asRiskLevel(item.risk_level),
        };
      })
    : undefined;

  return {
    agent: asAgentKind(source.agent),
    tool: asString(source.tool),
    inputs: isRecord(source.inputs) ? source.inputs : undefined,
    output: asString(source.output),
    risk_level: asRiskLevel(source.risk_level),
    risk_score: asNumber(source.risk_score),
    risk_reason: asString(source.risk_reason),
    status: asToolStatus(source.status),
    duration_ms: asNumber(source.duration_ms),
    subtasks,
    subtask_count: asNumber(source.subtask_count),
    summary: asString(source.summary),
  };
}

function normalizeBlocked(raw: unknown): PendingApproval {
  const source = isRecord(raw) ? raw : {};
  const subtask = isRecord(source.subtask) ? source.subtask : {};
  const risk = isRecord(source.risk) ? source.risk : {};

  return {
    subtask: {
      required_tool: asString(subtask.required_tool),
      description: asString(subtask.description),
      inputs: isRecord(subtask.inputs) ? subtask.inputs : undefined,
    },
    risk: {
      reason: asString(risk.reason),
      score: asNumber(risk.score),
    },
  };
}

function normalizeDone(raw: unknown): Extract<WireEvent, { type: "done" }> {
  const source = isRecord(raw) ? raw : {};
  const summary = isRecord(source.summary) ? source.summary : {};

  return {
    type: "done",
    final_output: asString(source.final_output),
    summary: {
      total_subtasks: asNumber(summary.total_subtasks),
      completed: asNumber(summary.completed),
      failed: asNumber(summary.failed),
    },
  };
}

function normalizeEvent(raw: unknown): WireEvent {
  if (!isRecord(raw)) {
    return { type: "error", message: "Malformed event from server" };
  }

  const type = asString(raw.type);
  if (!type) {
    return { type: "error", message: "Event missing type" };
  }

  switch (type) {
    case "tool_call":
      return { type: "tool_call", data: normalizeToolData(isRecord(raw.data) ? raw.data : raw) };
    case "status": {
      const source = isRecord(raw.data) ? raw.data : raw;
      return {
        type: "status",
        status: asString(source.status) ?? asString(raw.status),
        message: asString(source.message) ?? asString(raw.message),
      };
    }
    case "done":
      return normalizeDone(raw);
    case "blocked":
      return { type: "blocked", pending_approval: normalizeBlocked(raw.pending_approval) };
    case "error":
      return { type: "error", message: asString(raw.message) ?? "Agent run failed" };
    default:
      return { ...raw, type };
  }
}

export function openSessionSocket(
  sessionId: string,
  handlers: {
    onEvent: (ev: WireEvent) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (e: Event) => void;
  },
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/${sessionId}`);
  ws.onopen = () => handlers.onOpen?.();
  ws.onclose = () => handlers.onClose?.();
  ws.onerror = (e) => handlers.onError?.(e);
  ws.onmessage = (msg) => {
    try {
      const payload = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
      handlers.onEvent(normalizeEvent(payload));
    } catch {
      handlers.onEvent({ type: "error", message: "Malformed event from server" });
    }
  };
  return ws;
}
