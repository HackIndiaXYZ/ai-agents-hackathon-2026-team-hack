import { motion } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, ListChecks, ShieldAlert } from "lucide-react";

function renderMd(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h3 key={i} className="font-display text-xl font-semibold mt-2 mb-2">{line.slice(3)}</h3>;
    if (line.startsWith("- ")) {
      return <li key={i} className="ml-5 list-disc text-foreground/90" dangerouslySetInnerHTML={{ __html: bold(line.slice(2)) }} />;
    }
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i} className="text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: bold(line) }} />;
  });
}
function bold(s: string) {
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
}

export function FinalOutput({
  output,
  subtasksDone,
  subtasksTotal,
  blockedCount,
}: {
  output: string;
  subtasksDone: number;
  subtasksTotal: number;
  blockedCount: number;
}) {
  useEffect(() => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#7c3aed", "#10b981", "#a78bfa", "#34d399"],
    });
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-6 relative overflow-hidden"
      style={{ boxShadow: "0 0 60px -10px oklch(0.72 0.17 165 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.05)" }}
    >
      <div className="absolute -top-20 -left-20 size-72 rounded-full bg-success/15 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-success/20 border border-success/40 grid place-items-center">
            <CheckCircle2 className="text-success" size={22} />
          </div>
          <h3 className="font-display text-2xl font-semibold">Task Complete</h3>
        </div>

        <div className="space-y-1.5 mb-5">{renderMd(output)}</div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={ListChecks} color="text-success" label="Subtasks Completed" value={`${subtasksDone}/${subtasksTotal}`} />
          <MetricCard icon={ShieldAlert} color="text-danger" label="Actions Blocked" value={String(blockedCount)} />
        </div>
      </div>
    </motion.section>
  );
}

function MetricCard({ icon: Icon, color, label, value }: { icon: typeof CheckCircle2; color: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface/60 border border-border/60 p-4 flex items-center gap-3">
      <Icon className={color} size={22} />
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`font-display text-2xl font-semibold ${color}`}>{value}</div>
      </div>
    </div>
  );
}
