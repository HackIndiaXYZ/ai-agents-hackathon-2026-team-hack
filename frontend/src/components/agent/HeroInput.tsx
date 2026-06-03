import { motion } from "framer-motion";
import { Play, Loader2, Sparkles } from "lucide-react";

export function HeroInput({
  task,
  setTask,
  language,
  onRun,
  running,
  disabled,
}: {
  task: string;
  setTask: (v: string) => void;
  language: string;
  onRun: () => void;
  running: boolean;
  disabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 glow-violet-sm relative overflow-hidden"
    >
      <div className="absolute -top-24 left-1/3 size-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">New Task</span>
        </div>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={3}
          placeholder="e.g. Read latest email, summarize it, create Jira ticket..."
          className="w-full bg-input/40 border border-border rounded-xl px-4 py-3 text-base resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-surface-2/80 border border-border/60 text-foreground/80">
              🌐 {language}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-1.5 rounded-full ${running ? "bg-success pulse-dot" : "bg-muted-foreground/50"}`} />
              {running ? "Agent executing…" : "Idle"}
            </div>
          </div>
          <button
            disabled={disabled || running || !task.trim()}
            onClick={onRun}
            className="group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:scale-[1.02] enabled:active:scale-[0.98]"
            style={{ background: "var(--gradient-violet)", boxShadow: "0 10px 30px -10px oklch(0.62 0.24 295 / 0.6)" }}
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
            {running ? "Running…" : "Run Agent"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
