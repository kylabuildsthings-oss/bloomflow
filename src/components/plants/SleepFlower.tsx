"use client";

import { motion } from "framer-motion";

type Props = {
  /** 7-day average sleep quality 1-5. Blooms when >= 4, wilts when < 3 */
  avgSleep: number;
};

export function SleepFlower({ avgSleep }: Props) {
  const isBlooming = avgSleep >= 4;
  const isWilting = avgSleep < 3;
  const scale = isBlooming ? 1.2 : isWilting ? 0.7 : 1;
  const petalRotation = isWilting ? 45 : 0; // Droop petals when wilting

  return (
    <motion.svg
      viewBox="0 0 120 140"
      className="h-28 w-28 cursor-pointer"
      initial={{ scale: 0.8 }}
      animate={{ scale }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Stem */}
      <motion.line
        x1="60"
        y1="80"
        x2="60"
        y2="135"
        stroke="#87A96B"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Leaves */}
      <motion.ellipse
        cx="50"
        cy="100"
        rx="8"
        ry="4"
        fill="#87A96B"
        opacity={0.8}
      />
      <motion.ellipse
        cx="70"
        cy="115"
        rx="8"
        ry="4"
        fill="#87A96B"
        opacity={0.8}
      />

      {/* Petals - rotate down when wilting */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.ellipse
          key={i}
          cx="60"
          cy="55"
          rx="12"
          ry={isWilting ? 8 : 18}
          fill={isWilting ? "#a8b89a" : "#B8C9A8"}
          transform={`rotate(${deg + petalRotation} 60 55)`}
          initial={false}
          animate={{ ry: isWilting ? 8 : 18 }}
          transition={{ type: "spring", stiffness: 150 }}
        />
      ))}

      {/* Center */}
      <motion.circle
        cx="60"
        cy="55"
        r={isBlooming ? 12 : 8}
        fill={isBlooming ? "#CC7357" : "#87A96B"}
        initial={false}
        animate={{ r: isBlooming ? 12 : 8 }}
        transition={{ type: "spring", stiffness: 150 }}
      />
    </motion.svg>
  );
}
