"use client";

import { motion } from "framer-motion";

type Props = {
  /** 7-day average energy 1-5. Upright when >= 4, droops when < 3 */
  avgEnergy: number;
};

export function EnergySunflower({ avgEnergy }: Props) {
  const isUpright = avgEnergy >= 4;
  const isDrooping = avgEnergy < 3;
  const tilt = isDrooping ? 25 : isUpright ? -5 : 10; // Negative = towards sun, positive = droop

  return (
    <motion.svg
      viewBox="0 0 120 140"
      className="h-28 w-28 cursor-pointer"
      initial={{ rotate: 0 }}
      animate={{ rotate: tilt }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
    >
      {/* Stem */}
      <line
        x1="60"
        y1="90"
        x2="60"
        y2="135"
        stroke="#87A96B"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Leaves */}
      <ellipse cx="48" cy="105" rx="10" ry="5" fill="#87A96B" opacity={0.9} />
      <ellipse cx="72" cy="118" rx="10" ry="5" fill="#87A96B" opacity={0.9} />

      {/* Sunflower center (dark) */}
      <circle cx="60" cy="55" r="14" fill="#4a3728" />

      {/* Petals - rays around center */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const length = isDrooping ? 15 : 22;
        const endX = 60 + Math.cos(angle) * length;
        const endY = 55 + Math.sin(angle) * length;
        return (
          <line
            key={i}
            x1="60"
            y1="55"
            x2={endX}
            y2={endY}
            stroke="#E8C547"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}

      {/* Inner circle - seed pattern */}
      <circle cx="60" cy="55" r="8" fill="#5D4E37" />
    </motion.svg>
  );
}
