import { motion } from "framer-motion";
import { BigRobot } from "./RobotIcon";
import { EXAMPLE_TASKS } from "@/lib/mock-agent";

export function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="glass rounded-2xl p-10 text-center"
    >
      <div className="mx-auto w-48 h-48"><BigRobot className="w-full h-full" /></div>
      <h2 className="font-display text-3xl font-semibold mt-2 text-gradient-violet">Ready to orchestrate</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Hand AgentBridge a goal in plain English. Planner, Executor, Guardrail, and Evaluator will handle the rest.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {EXAMPLE_TASKS.map((t, i) => (
          <motion.button
            key={t}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            onClick={() => onPick(t)}
            className="text-xs sm:text-sm px-4 py-2 rounded-full bg-surface-2/70 border border-border/70 hover:border-primary/60 hover:bg-surface-2 transition text-foreground/85 max-w-sm"
          >
            {t}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
