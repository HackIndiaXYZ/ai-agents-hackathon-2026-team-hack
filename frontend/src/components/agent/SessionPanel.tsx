import { motion, AnimatePresence } from "framer-motion";
import { Copy, Download, X } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SessionData } from "@/lib/mock-agent";

export function SessionPanel({
  session,
  open,
  onClose,
}: {
  session: SessionData | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && session && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="w-[300px] shrink-0 h-screen sticky top-0 border-l border-border/60 bg-sidebar/80 backdrop-blur-xl flex flex-col"
        >
          <div className="px-5 py-4 flex items-center justify-between border-b border-border/60">
            <div>
              <h3 className="font-display font-semibold">Session Details</h3>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{session.id}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-muted-foreground hover:text-foreground transition">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Timeline</div>
              <ol className="relative border-l border-border/60 pl-4 space-y-3">
                {session.phases.map((p, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary glow-violet-sm" />
                    <div className="text-sm text-foreground/90">{p.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{new Date(p.at).toLocaleTimeString()}</div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Risk Summary</div>
              <RiskDonut stats={session.stats} />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigator.clipboard.writeText(session.output || "")}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-surface-2 hover:bg-surface-2/70 border border-border px-3 py-2 text-sm transition"
              >
                <Copy size={14} /> Copy Output
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `${session.id}.json`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 px-3 py-2 text-sm font-medium transition"
                style={{ boxShadow: "var(--shadow-glow-sm)" }}
              >
                <Download size={14} /> Save as JSON
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function RiskDonut({ stats }: { stats: { blocked: number; medium: number; succeeded: number } }) {
  const data = [
    { name: "Success", value: stats.succeeded || 0.01, color: "oklch(0.72 0.17 165)" },
    { name: "Medium", value: stats.medium || 0.01, color: "oklch(0.78 0.16 75)" },
    { name: "Blocked", value: stats.blocked || 0.01, color: "oklch(0.66 0.24 27)" },
  ];
  return (
    <div className="h-44 rounded-xl bg-surface/50 border border-border/50 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={3} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "oklch(0.17 0.025 280)",
              border: "1px solid oklch(0.27 0.03 280)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
