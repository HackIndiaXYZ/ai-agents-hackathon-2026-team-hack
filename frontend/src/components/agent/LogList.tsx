import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Brain, Cog, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import type { LogEntry } from "@/lib/mock-agent";
import { RiskPill } from "./RiskPill";

const KIND_META = {
  planner: { border: "border-l-planner", bg: "bg-planner/10", icon: Brain, label: "PLANNER", color: "text-planner" },
  executor: { border: "border-l-executor", bg: "bg-executor/10", icon: Cog, label: "EXECUTOR", color: "text-executor" },
  evaluator: { border: "border-l-evaluator", bg: "bg-evaluator/10", icon: CheckCircle2, label: "EVALUATOR", color: "text-evaluator" },
} as const;

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function LogList({ logs, running }: { logs: LogEntry[]; running: boolean }) {
  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          Live Agent Log
          {running && <span className="size-2 rounded-full bg-success pulse-dot" />}
        </h2>
        <span className="text-xs text-muted-foreground font-mono">{logs.length} events</span>
      </div>

      {logs.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          {running ? "Awaiting first event…" : "Run an agent to see live reasoning, tool calls, and guardrails."}
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {logs.map((entry) => <LogCard key={entry.id} entry={entry} />)}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function LogCard({ entry }: { entry: LogEntry }) {
  const [open, setOpen] = useState(true);
  const meta = KIND_META[entry.kind];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={`rounded-xl border border-border/60 ${meta.bg} border-l-4 ${meta.border} overflow-hidden`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition text-left"
      >
        <div className={`size-8 rounded-lg bg-surface-2/70 border border-border grid place-items-center ${meta.color}`}>
          <meta.icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold tracking-[0.16em] ${meta.color}`}>{meta.label}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={10} />{fmtTime(entry.timestamp)}
            </span>
          </div>
          <div className="text-sm text-foreground/95 truncate mt-0.5">
            {entry.kind === "planner" && `${entry.title} · ${entry.subtasks.length} subtasks`}
            {entry.kind === "executor" && (
              <>
                <span className="font-mono">{entry.tool}</span>
                <span className="text-muted-foreground"> · {entry.latencyMs}ms · </span>
                <span className={entry.status === "success" ? "text-success" : entry.status === "blocked" ? "text-danger" : "text-warning"}>
                  {entry.status}
                </span>
              </>
            )}
            {entry.kind === "evaluator" && entry.summary}
          </div>
        </div>
        {entry.kind === "executor" && <RiskPill risk={entry.risk} />}
        <motion.div animate={{ rotate: open ? 90 : 0 }}>
          <ChevronRight size={16} className="text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/40">
              {entry.kind === "planner" && (
                <ol className="space-y-1.5 mt-2">
                  {entry.subtasks.map((st) => (
                    <li key={st.id} className="flex items-center gap-2.5 text-sm bg-surface/50 border border-border/40 rounded-lg px-3 py-2">
                      <span className="font-mono text-xs text-muted-foreground w-5">{st.id}.</span>
                      <span className="flex-1 text-foreground/90">{st.description}</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-2 border border-border/60 text-foreground/80">{st.tool}</span>
                      <RiskPill risk={st.risk} />
                    </li>
                  ))}
                </ol>
              )}
              {entry.kind === "executor" && (
                <div className="mt-2 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-foreground">{entry.tool}</span>
                    <span>•</span>
                    <span>{entry.latencyMs}ms</span>
                    <span>•</span>
                    <span className={entry.status === "success" ? "text-success" : entry.status === "blocked" ? "text-danger" : "text-warning"}>
                      {entry.status}
                    </span>
                  </div>
                  {entry.riskReason && (
                    <div className="text-xs text-warning bg-warning/10 border border-warning/30 rounded-lg px-3 py-2">
                      ⚠ {entry.riskReason}
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Inputs</div>
                    <JsonBlock data={entry.inputs} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Output</div>
                    <div className="text-sm bg-surface/60 border border-border/50 rounded-lg px-3 py-2 text-foreground/90">{entry.output}</div>
                  </div>
                  {entry.sources && entry.sources.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        Live Results · serper.dev
                      </div>
                      <ol className="space-y-2">
                        {entry.sources.map((s, i) => (
                          <li
                            key={i}
                            className="bg-surface/60 border border-border/50 rounded-lg px-3 py-2.5 hover:border-primary/40 transition"
                          >
                            <a
                              href={s.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary hover:underline line-clamp-1"
                            >
                              {s.title}
                            </a>
                            <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                              {s.link}
                            </div>
                            <div className="text-xs text-foreground/80 mt-1 leading-relaxed">
                              {s.snippet}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {entry.kind === "evaluator" && (
                <div className="mt-2 rounded-lg border border-border/50 bg-surface/60 px-3 py-3 text-sm text-foreground/85">
                  {entry.summary}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  const lines = JSON.stringify(data, null, 2).split("\n");
  return (
    <pre className="font-mono text-xs bg-surface/70 border border-border/50 rounded-lg p-3 overflow-x-auto leading-relaxed">
      {lines.map((line, i) => (
        <div key={i}>
          {line.split(/("[^"]+":|"[^"]*"|\btrue\b|\bfalse\b|\bnull\b|\b\d+\b)/g).map((tok, j) => {
            if (/^"[^"]+":$/.test(tok)) return <span key={j} className="text-planner">{tok}</span>;
            if (/^"[^"]*"$/.test(tok)) return <span key={j} className="text-success">{tok}</span>;
            if (/^(true|false|null)$/.test(tok)) return <span key={j} className="text-warning">{tok}</span>;
            if (/^\d+$/.test(tok)) return <span key={j} className="text-executor">{tok}</span>;
            return <span key={j} className="text-foreground/80">{tok}</span>;
          })}
        </div>
      ))}
    </pre>
  );
}
