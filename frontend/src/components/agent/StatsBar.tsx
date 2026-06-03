import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { Wrench, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

function Counter({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.9, ease: "easeOut" });
    return c.stop;
  }, [value, mv]);
  return <motion.span>{rounded}</motion.span>;
}

const CARDS = [
  { key: "toolCalls", label: "Tool Calls", icon: Wrench, color: "text-primary", ring: "from-primary/30" },
  { key: "blocked", label: "Blocked", icon: ShieldAlert, color: "text-danger", ring: "from-danger/30" },
  { key: "medium", label: "Medium Risk", icon: AlertTriangle, color: "text-warning", ring: "from-warning/30" },
  { key: "succeeded", label: "Succeeded", icon: CheckCircle2, color: "text-success", ring: "from-success/30" },
] as const;

export function StatsBar({ stats }: { stats: Record<string, number> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {CARDS.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
          className="glass rounded-xl p-4 relative overflow-hidden"
        >
          <div className={`absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br ${c.ring} to-transparent blur-2xl opacity-70`} />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
            <c.icon size={15} className={c.color} />
          </div>
          <div className={`mt-2 font-display text-3xl font-semibold tabular-nums ${c.color}`}>
            <Counter value={stats[c.key] ?? 0} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
