"use client";

import { motion } from "framer-motion";

type Props = {
  /** Days with workout logged this week (0-7). Grows with days, bears fruit when >= 5 */
  workoutDays: number;
};

export function WorkoutVine({ workoutDays }: Props) {
  const segments = Math.min(workoutDays + 2, 7);
  const hasFruit = workoutDays >= 5;
  const vineHeight = 35 + segments * 14;
  const pathTop = 135 - vineHeight;

  const pathD = `M 60 135 Q 48 ${135 - vineHeight * 0.4} 56 ${pathTop + 15} Q 64 ${pathTop} 60 ${pathTop}`;

  return (
    <motion.svg
      viewBox="0 0 120 140"
      className="h-28 w-28 cursor-pointer"
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
    >
      {/* Vine stem - curved path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="#87A96B"
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0.2 }}
        animate={{ pathLength: Math.min(0.3 + segments * 0.12, 1) }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
      />

      {/* Vine leaves along stem */}
      {Array.from({ length: Math.min(segments, 5) }).map((_, i) => (
        <motion.ellipse
          key={i}
          cx={55 + (i % 2) * 10}
          cy={130 - i * 18}
          rx="6"
          ry="3"
          fill="#87A96B"
          opacity={0.9}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}

      {/* Fruit/berries when workout days >= 5 */}
      {hasFruit && (
        <>
          <motion.circle
            cx="52"
            cy={135 - vineHeight - 5}
            r="6"
            fill="#CC7357"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          />
          <motion.circle
            cx="62"
            cy={135 - vineHeight + 5}
            r="5"
            fill="#CC7357"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          />
          <motion.circle
            cx="58"
            cy={135 - vineHeight - 12}
            r="4"
            fill="#CC7357"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          />
        </>
      )}
    </motion.svg>
  );
}
