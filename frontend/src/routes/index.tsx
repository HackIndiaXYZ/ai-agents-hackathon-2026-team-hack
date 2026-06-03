import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PanelRightOpen } from "lucide-react";
import { Sidebar } from "@/components/agent/Sidebar";
import { HeroInput } from "@/components/agent/HeroInput";
import { StatsBar } from "@/components/agent/StatsBar";
import { LogList } from "@/components/agent/LogList";
import { BlockedPanel } from "@/components/agent/BlockedPanel";
import { FinalOutput } from "@/components/agent/FinalOutput";
import { SessionPanel } from "@/components/agent/SessionPanel";
import { EmptyState } from "@/components/agent/EmptyState";
import {
  type LogEntry, type BlockedAction, type SessionData,
} from "@/lib/mock-agent";
import { startRun, openSessionSocket, postApproval, type WireEvent } from "@/lib/agent-client";

export const Route = createFileRoute("/")({ component: Dashboard });

const newId = () => Math.random().toString(36).slice(2, 10);

function Dashboard() {
  const [apiKey, setApiKey] = useState("");
  const [language, setLanguage] = useState("English");
  const [task, setTask] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [blocked, setBlocked] = useState<BlockedAction | null>(null);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [completed, setCompleted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [subtasksTotal, setSubtasksTotal] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [phases, setPhases] = useState<{ name: string; at: number }[]>([]);
  const sessionId = useRef<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  const pushPhase = useCallback((name: string, at = Date.now()) => {
    setPhases((current) => {
      const previous = current[current.length - 1];
      if (previous && previous.name === name) return current;
      return [...current, { name, at }];
    });
  }, []);

  useEffect(() => () => wsRef.current?.close(), []);

  const stats = useMemo(() => {
    let toolCalls = 0, blockedN = 0, medium = 0, succeeded = 0;
    for (const l of logs) {
      if (l.kind === "executor") {
        toolCalls++;
        if (l.risk === "medium") medium++;
        if (l.status === "success") succeeded++;
      }
    }
    if (blocked) blockedN++;
    blockedN += blockedCount;
    return { toolCalls, blocked: blockedN, medium, succeeded };
  }, [logs, blocked, blockedCount]);

  const subtasksDone = useMemo(
    () => logs.filter((l) => l.kind === "executor" && l.status === "success").length,
    [logs],
  );

  const session: SessionData = {
    id: sessionId.current || "—",
    task, language, logs, blocked, completed, output,
    stats, subtasksTotal, subtasksDone, phases,
  };

  const handleEvent = useCallback((ev: WireEvent) => {
    const ts = Date.now();
    switch (ev.type) {
      case "status": {
        const e = ev as Extract<WireEvent, { type: "status" }>;
        const phase = e.status ?? e.message ?? "status";
        const phaseLabel = {
          planning: "Planning",
          executing: "Executing",
          evaluating: "Evaluating",
          done: "Done",
        }[phase] ?? phase;
        pushPhase(`Status · ${phaseLabel}`, ts);
        break;
      }
      case "tool_call": {
        const e = ev as Extract<WireEvent, { type: "tool_call" }>;
        const d = e.data ?? {};
        const agent = d.agent ?? "executor";

        if (agent === "planner") {
          const subs = (d.subtasks ?? []).map((s, i) => ({
            id: s.id ?? i + 1,
            description: s.description ?? "(no description)",
            tool: s.required_tool ?? s.tool ?? "—",
            risk: (s.risk_level ?? "low") as "low" | "medium" | "high",
          }));
          const count = d.subtask_count ?? subs.length;
          setLogs((l) => [
            ...l,
            {
              id: newId(),
              kind: "planner",
              timestamp: ts,
              title: `Decomposed task into ${count} subtask${count === 1 ? "" : "s"}`,
              subtasks: subs,
            },
          ]);
          setSubtasksTotal((n) => Math.max(n, count));
          pushPhase(`Planner · ${count} subtask${count === 1 ? "" : "s"}`, ts);
        } else if (agent === "evaluator") {
          const summary =
            d.summary ?? d.output ?? `Evaluated ${d.tool ?? "result"} (${d.status ?? "ok"})`;
          setLogs((l) => [
            ...l,
            { id: newId(), kind: "evaluator", timestamp: ts, summary },
          ]);
          pushPhase(`Evaluator · ${d.status ?? "reviewed"}`, ts);
        } else {
          const tool = d.tool ?? "tool";
          const entry: LogEntry = {
            id: newId(),
            kind: "executor",
            timestamp: ts,
            tool,
            latencyMs: d.duration_ms ?? 0,
            status: d.status ?? "success",
            risk: (d.risk_level ?? "low") as "low" | "medium" | "high",
            inputs: d.inputs ?? {},
            output: d.output ?? "",
            riskReason: d.risk_reason,
          };
          setLogs((l) => [...l, entry]);
          pushPhase(`Executor · ${tool} · ${entry.status}`, ts);
        }
        break;
      }
      case "blocked": {
        const e = ev as Extract<WireEvent, { type: "blocked" }>;
        const pa = e.pending_approval ?? {};
        const sub = pa.subtask ?? {};
        const risk = pa.risk ?? {};
        const tool = sub.required_tool ?? "unknown";
        const description = sub.description ?? "Action requires human approval";
        const reason = risk.reason ?? "High-risk action detected";
        setBlocked({
          tool,
          description,
          reason: typeof risk.score === "number" ? `${reason} (score ${risk.score.toFixed(2)})` : reason,
          inputs: sub.inputs ?? {},
        });
        pushPhase(`Blocked · ${tool}`, ts);
        setRunning(false);
        break;
      }
      case "done": {
        const e = ev as Extract<WireEvent, { type: "done" }>;
        const completedCount = e.summary?.completed ?? 0;
        const totalCount = e.summary?.total_subtasks ?? 0;
        const failedCount = e.summary?.failed ?? 0;
        setLogs((l) => [
          ...l,
          {
            id: newId(),
            kind: "evaluator",
            timestamp: ts,
            summary: totalCount
              ? `Completed ${completedCount}/${totalCount} subtasks${failedCount ? ` · ${failedCount} failed` : ""}.`
              : "Run completed successfully.",
          },
        ]);
        setOutput(e.final_output ?? "");
        if (e.summary?.total_subtasks) setSubtasksTotal(e.summary.total_subtasks);
        setCompleted(true);
        setRunning(false);
        pushPhase(
          e.summary
            ? `Done · ${e.summary.completed ?? 0}/${e.summary.total_subtasks ?? 0} subtasks`
            : "Session complete",
          ts,
        );
        wsRef.current?.close();
        break;
      }
      case "error": {
        const message = (ev as { message?: string }).message ?? "Unknown error";
        setLogs((l) => [
          ...l,
          {
            id: newId(), kind: "executor", timestamp: ts,
            tool: "agent.error", latencyMs: 0, status: "error",
            risk: "low", inputs: {}, output: message,
          },
        ]);
        pushPhase(`Error · ${message}`, ts);
        setRunning(false);
        break;
      }
    }
  }, [pushPhase]);

  const handleRun = useCallback(async () => {
    wsRef.current?.close();
    setLogs([]); setBlocked(null); setOutput(""); setCompleted(false);
    setBlockedCount(0); setSubtasksTotal(0);
    setPhases([{ name: "Session started", at: Date.now() }]);
    setRunning(true);
    setPanelOpen(true);
    try {
      const { session_id } = await startRun(task, language);
      sessionId.current = session_id;
      pushPhase(`Session · ${session_id}`, Date.now());
      wsRef.current = openSessionSocket(session_id, {
        onEvent: handleEvent,
        onOpen: () => pushPhase("WebSocket connected", Date.now()),
        onClose: () => setRunning((r) => (r ? false : r)),
        onError: () => handleEvent({ type: "error", message: "WebSocket connection error" }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      handleEvent({ type: "error", message: `Failed to start run: ${message}` });
    }
  }, [task, language, handleEvent, pushPhase]);

  const handleResolve = useCallback(async (approved: boolean) => {
    setRunning(true);
    setBlockedCount((c) => c + 1);
    setBlocked(null);
    pushPhase(approved ? "Operator approved action" : "Operator denied action", Date.now());
    try {
      await postApproval(sessionId.current, approved);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      handleEvent({ type: "error", message: `Approval failed: ${message}` });
    }
  }, [handleEvent, pushPhase]);

  const hasActivity = logs.length > 0 || running || !!blocked || completed;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar apiKey={apiKey} setApiKey={setApiKey} language={language} setLanguage={setLanguage} />

      <main className="flex-1 min-w-0 px-6 py-6 space-y-5 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Orchestration Console</h1>
            <p className="text-sm text-muted-foreground">Multi-agent reasoning with guardrails and human-in-the-loop.</p>
          </div>
          {!panelOpen && (
            <button
              onClick={() => setPanelOpen(true)}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-surface-2 border border-border hover:border-primary/50 transition"
            >
              <PanelRightOpen size={14} /> Session
            </button>
          )}
        </div>

        <HeroInput
          task={task} setTask={setTask} language={language}
          onRun={handleRun} running={running} disabled={false}
        />

        <StatsBar stats={stats} />

        <AnimatePresence>
          {blocked && <BlockedPanel blocked={blocked} onResolve={handleResolve} />}
        </AnimatePresence>

        {hasActivity ? (
          <LogList logs={logs} running={running} />
        ) : (
          <EmptyState onPick={(t) => setTask(t)} />
        )}

        <AnimatePresence>
          {completed && output && (
            <FinalOutput
              output={output}
              subtasksDone={subtasksDone}
              subtasksTotal={subtasksTotal}
              blockedCount={blockedCount}
            />
          )}
        </AnimatePresence>

        <div className="h-8" />
      </main>

      <SessionPanel session={session} open={panelOpen && hasActivity} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
