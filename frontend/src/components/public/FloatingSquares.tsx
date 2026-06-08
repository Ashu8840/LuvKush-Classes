"use client";

import { motion } from "framer-motion";

const floatingSquares = [
  { size: 40, left: "10%", duration: 12, delay: 0 },
  { size: 80, left: "25%", duration: 15, delay: 2 },
  { size: 30, left: "55%", duration: 10, delay: 4 },
  { size: 60, left: "75%", duration: 18, delay: 1 },
  { size: 50, left: "90%", duration: 14, delay: 3 },
  { size: 70, left: "40%", duration: 16, delay: 5 },
];

export function FloatingSquares() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {floatingSquares.map((sq, i) => (
        <motion.div
          key={i}
          className="absolute bottom-[-100px] border-2 border-[#facc15]/30 bg-[#facc15]/10 backdrop-blur-sm"
          style={{
            width: sq.size,
            height: sq.size,
            left: sq.left,
            borderRadius: "15%",
          }}
          animate={{
            y: [0, -1000],
            rotate: [0, 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: sq.duration,
            repeat: Infinity,
            delay: sq.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}