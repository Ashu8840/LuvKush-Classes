"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { api, LeaderboardEntry } from "@/lib/api";
import { LeaderboardTable } from "@/components/gamification/LeaderboardTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { formatBadgeName } from "@/components/gamification/BadgeCelebration";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<{ badges: string[]; streak: number; level: number; xp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getLeaderboard({ period, scope: "batch" }),
      api.getAchievements(),
    ])
      .then(([lb, ach]) => {
        setLeaderboard(lb);
        setAchievements(ach);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const myRank = leaderboard.find((e) => e.studentId === user?.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Batch Leaderboard</h3>
          <p className="text-sm text-muted">Compete with your batchmates</p>
        </div>
        <div className="flex gap-2">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
                period === p ? "bg-primary text-primary-foreground" : "border border-default"
              }`}
            >
              This {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          {myRank && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-primary bg-primary-light p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Your Rank</p>
                  <p className="text-3xl font-bold text-primary">#{myRank.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Period XP</p>
                  <p className="text-2xl font-bold">{myRank.periodXp}</p>
                </div>
                <div className="flex items-center gap-2 text-accent">
                  <Flame className="h-6 w-6" />
                  <span className="text-xl font-bold">{achievements?.streak ?? myRank.streak} day streak</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {leaderboard.slice(0, 3).map((entry, i) => (
              <motion.div
                key={entry.studentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-5 ${
                  i === 0 ? "border-primary bg-primary-light" : "border-default bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Trophy className={`h-8 w-8 ${i === 0 ? "text-primary" : i === 1 ? "text-muted" : "text-accent"}`} />
                  <div>
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-sm text-muted">#{entry.rank} · {entry.periodXp} XP</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <LeaderboardTable data={leaderboard} highlightId={user?.id} />

          {achievements?.badges?.length ? (
            <div className="rounded-2xl border border-default bg-card p-6">
              <h3 className="font-semibold">Your Badges</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {achievements.badges.map((b) => (
                  <span key={b} className="badge-primary rounded-full px-3 py-1 text-xs font-medium">
                    {formatBadgeName(b)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}