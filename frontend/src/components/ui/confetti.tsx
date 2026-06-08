"use client";

import confetti from "canvas-confetti";

export function fireConfetti(options?: confetti.Options) {
  const defaults: confetti.Options = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    ...options,
  };

  confetti(defaults);
}

export function fireCelebration() {
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}