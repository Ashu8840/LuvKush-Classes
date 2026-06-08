"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Award, X } from "lucide-react";

const BADGE_LABELS: Record<string, string> = {
  "speed-master-100": "Speed Master 100",
  "speed-demon": "Speed Demon",
  "7-day-streak": "7 Day Streak",
  "top-performer": "Top Performer",
  "accuracy-ace": "Accuracy Ace",
  "practice-champion": "Practice Champion",
};

export function formatBadgeName(id: string) {
  return BADGE_LABELS[id] || id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type BadgeCelebrationProps = {
  badges: string[];
  onClose: () => void;
};

export function BadgeCelebration({ badges, onClose }: BadgeCelebrationProps) {
  if (!badges.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl border border-default bg-card p-8 text-center shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: 2, duration: 0.5 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-light"
          >
            <Award className="h-10 w-10 text-primary" />
          </motion.div>
          <h3 className="mt-4 text-2xl font-bold text-foreground">Badge Unlocked!</h3>
          <p className="mt-2 text-muted">Congratulations on your achievement</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {badges.map((badge) => (
              <span key={badge} className="badge-primary rounded-full px-4 py-2 text-sm font-semibold">
                {formatBadgeName(badge)}
              </span>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-6 rounded-xl bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90"
          >
            Awesome!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}