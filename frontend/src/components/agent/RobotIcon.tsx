import { motion } from "framer-motion";

export function RobotIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.18 295)" />
          <stop offset="100%" stopColor="oklch(0.55 0.24 320)" />
        </linearGradient>
      </defs>
      <rect x="6" y="9" width="20" height="16" rx="5" fill="url(#rg)" />
      <rect x="9" y="13" width="5" height="5" rx="1.5" fill="oklch(0.12 0.02 280)" />
      <rect x="18" y="13" width="5" height="5" rx="1.5" fill="oklch(0.12 0.02 280)" />
      <motion.circle
        cx="11.5" cy="15.5" r="1.2" fill="oklch(0.95 0.05 200)"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <motion.circle
        cx="20.5" cy="15.5" r="1.2" fill="oklch(0.95 0.05 200)"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: 0.3 }}
      />
      <rect x="13" y="20" width="6" height="1.8" rx="0.9" fill="oklch(0.12 0.02 280)" />
      <rect x="14" y="4" width="4" height="4" rx="1" fill="url(#rg)" />
      <circle cx="16" cy="3" r="1.4" fill="oklch(0.9 0.15 165)" />
    </motion.svg>
  );
}

export function BigRobot({ className = "" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={className}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.2 295)" />
          <stop offset="100%" stopColor="oklch(0.5 0.24 320)" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="oklch(0.62 0.24 295 / 0.6)" />
          <stop offset="100%" stopColor="oklch(0.62 0.24 295 / 0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="80" fill="url(#glow)" />
      <rect x="55" y="55" width="90" height="80" rx="22" fill="url(#bg)" />
      <rect x="68" y="75" width="22" height="22" rx="6" fill="oklch(0.12 0.02 280)" />
      <rect x="110" y="75" width="22" height="22" rx="6" fill="oklch(0.12 0.02 280)" />
      <motion.circle cx="79" cy="86" r="5" fill="oklch(0.85 0.18 200)"
        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />
      <motion.circle cx="121" cy="86" r="5" fill="oklch(0.85 0.18 200)"
        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }} />
      <rect x="82" y="110" width="36" height="6" rx="3" fill="oklch(0.12 0.02 280)" />
      <rect x="92" y="35" width="16" height="16" rx="4" fill="url(#bg)" />
      <circle cx="100" cy="30" r="5" fill="oklch(0.78 0.17 165)" />
      <rect x="40" y="140" width="120" height="14" rx="7" fill="oklch(0.25 0.04 285)" />
    </motion.svg>
  );
}
