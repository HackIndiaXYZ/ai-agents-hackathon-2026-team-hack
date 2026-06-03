import type { RiskLevel } from "@/lib/mock-agent";

export function RiskPill({ risk }: { risk: RiskLevel }) {
  const map = {
    low: "bg-success/15 text-success border-success/30",
    medium: "bg-warning/15 text-warning border-warning/30",
    high: "bg-danger/20 text-danger border-danger/40 pulse-danger",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full border ${map[risk]}`}>
      {risk}
    </span>
  );
}
