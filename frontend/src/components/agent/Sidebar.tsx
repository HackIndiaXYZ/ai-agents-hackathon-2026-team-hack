import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Brain, Cog, ShieldCheck, CheckCircle2, KeyRound } from "lucide-react";
import { RobotIcon } from "./RobotIcon";

const LANGS = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];

const STEPS = [
  { icon: Brain, label: "Planner breaks task", color: "text-planner" },
  { icon: Cog, label: "Executor calls tools", color: "text-executor" },
  { icon: ShieldCheck, label: "Guardrail blocks risks", color: "text-warning" },
  { icon: CheckCircle2, label: "Evaluator summarizes", color: "text-success" },
];

interface PastSession {
  id: string;
  preview: string;
  status: "completed" | "blocked" | "running";
}

const PAST: PastSession[] = [
  { id: "s_8h2k", preview: "Audit S3 buckets for public access", status: "completed" },
  { id: "s_q1n3", preview: "Forecast Q3 sales + post to Slack", status: "completed" },
  { id: "s_mk29", preview: "Delete stale Jenkins jobs older than 90d", status: "blocked" },
  { id: "s_x7pq", preview: "Triage Sentry errors from last hour", status: "completed" },
  { id: "s_v4rt", preview: "Onboard new vendor in Workday", status: "completed" },
];

export function Sidebar({
  apiKey,
  setApiKey,
  language,
  setLanguage,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 border-r border-border/60 bg-sidebar/80 backdrop-blur-xl flex flex-col">
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
        <div className="glow-pulse"><RobotIcon size={30} /></div>
        <div>
          <div className="font-display text-lg font-semibold tracking-tight text-gradient-violet leading-none">AgentBridge</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Orchestration · v1.4</div>
        </div>
      </div>

      <div className="px-5 space-y-3">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <KeyRound size={12} /> Groq API Key
          </label>
          <div className="relative mt-1.5">
            <input
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_••••••••••••"
              className="w-full bg-input/60 border border-border rounded-lg px-3 py-2 pr-9 text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          >
            {LANGS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="mx-5 my-5 h-px bg-border/60" />

      <div className="px-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">How it works</div>
        <ol className="space-y-2">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              className="flex items-center gap-2.5 text-sm"
            >
              <div className="size-7 rounded-md bg-surface-2/80 border border-border/60 grid place-items-center">
                <s.icon size={14} className={s.color} />
              </div>
              <span className="text-foreground/85">{s.label}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="mx-5 my-5 h-px bg-border/60" />

      <div className="px-5 flex-1 min-h-0 flex flex-col">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Past Sessions</div>
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-1.5">
          {PAST.map((p) => (
            <button
              key={p.id}
              className="w-full text-left rounded-lg border border-border/50 bg-surface/40 hover:bg-surface/80 hover:border-primary/40 transition p-2.5 group"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-foreground/90 line-clamp-2 leading-snug">{p.preview}</p>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">{p.id}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border/60">
        <div className="flex items-center gap-2 rounded-lg bg-surface-2/70 border border-border/60 px-3 py-2">
          <div className="size-2 rounded-full bg-success pulse-dot" />
          <div className="text-[11px] leading-tight">
            <div className="font-mono text-foreground/90">llama-3.3-70b</div>
            <div className="text-muted-foreground">Groq · Free tier</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function StatusBadge({ status }: { status: PastSession["status"] }) {
  const map = {
    completed: "bg-success/15 text-success border-success/30",
    blocked: "bg-danger/15 text-danger border-danger/30",
    running: "bg-warning/15 text-warning border-warning/30",
  };
  return (
    <span className={`shrink-0 text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${map[status]}`}>
      {status}
    </span>
  );
}
