import { motion } from "framer-motion";
import { useState } from "react";
import { AlertTriangle, X, Check } from "lucide-react";
import type { BlockedAction } from "@/lib/mock-agent";

export function BlockedPanel({
  blocked,
  onResolve,
}: {
  blocked: BlockedAction;
  onResolve: (approved: boolean, reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className="shake glass-strong rounded-2xl p-6 border-danger/50 relative overflow-hidden"
      style={{ boxShadow: "0 0 60px -10px oklch(0.66 0.24 27 / 0.45), inset 0 1px 0 oklch(1 0 0 / 0.05)" }}
    >
      <div className="absolute -top-20 -right-20 size-64 rounded-full bg-danger/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-danger/20 border border-danger/40 grid place-items-center pulse-danger">
            <AlertTriangle className="text-danger" size={20} />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-danger">High-Risk Action Blocked</h3>
            <p className="text-xs text-muted-foreground">Guardrail intercepted destructive operation — operator approval required</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="sm:col-span-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tool</div>
            <code className="block font-mono text-sm bg-surface/80 border border-danger/30 rounded-lg px-3 py-2 text-danger">{blocked.tool}</code>
          </div>
          <div className="sm:col-span-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Action</div>
            <div className="text-sm bg-surface/60 border border-border/50 rounded-lg px-3 py-2">{blocked.description}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Risk reason</div>
          <div className="text-sm bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 text-danger/90">{blocked.reason}</div>
        </div>

        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Approval / denial reason (audit log)…"
          className="w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onResolve(true, reason)}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-background flex items-center justify-center gap-2 transition hover:brightness-110 hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "var(--gradient-success)", boxShadow: "0 8px 24px -8px oklch(0.72 0.17 165 / 0.6)" }}
          >
            <Check size={16} /> Approve & Continue
          </button>
          <button
            onClick={() => onResolve(false, reason)}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-background flex items-center justify-center gap-2 transition hover:brightness-110 hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "var(--gradient-danger)", boxShadow: "0 8px 24px -8px oklch(0.66 0.24 27 / 0.6)" }}
          >
            <X size={16} /> Deny Action
          </button>
        </div>
      </div>
    </motion.div>
  );
}
