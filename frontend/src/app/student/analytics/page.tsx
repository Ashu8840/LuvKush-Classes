"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { SpeedChart } from "@/components/analytics/SpeedChart";
import { AccuracyChart } from "@/components/analytics/AccuracyChart";
import { PracticeHeatmap } from "@/components/analytics/PracticeHeatmap";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardTable } from "@/components/gamification/LeaderboardTable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StudentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [heatmap, setHeatmap] = useState<{ practice: Record<string, number>; attendance: Record<string, string> } | null>(null);
  const [insights, setInsights] = useState("");
  const [batchComparison, setBatchComparison] = useState<unknown[]>([]);

  useEffect(() => {
    Promise.all([
      api.getStudentAnalytics(30),
      api.getHeatmap(90),
      api.getAiInsights(),
      api.getLeaderboard({ period: "month", scope: "batch" }),
    ])
      .then(([a, h, i, lb]) => {
        setAnalytics(a);
        setHeatmap(h);
        setInsights(i.insights);
        setBatchComparison(lb);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const graphs = analytics?.graphs as {
    wpmTrend?: { date: string; wpm: number; accuracy: number }[];
    accuracyTrend?: { date: string; accuracy: number; wpm: number }[];
  } | undefined;
  const summary = analytics?.summary as {
    totalSessions?: number;
    avgWpm?: number;
    avgAccuracy?: number;
    totalXpEarned?: number;
  } | undefined;
  const profile = analytics?.profile as { level?: number; xp?: number; streak?: number } | undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const comparisonData = (batchComparison as { name: string; periodXp: number; avgWpm: number }[]).slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Sessions (30d)", value: summary?.totalSessions ?? 0 },
          { label: "Avg WPM", value: summary?.avgWpm ?? 0 },
          { label: "Avg Accuracy", value: `${summary?.avgAccuracy ?? 0}%` },
          { label: "XP Earned", value: summary?.totalXpEarned ?? profile?.xp ?? 0 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-default bg-card p-5"
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-primary">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" /> Speed Trend
          </h3>
          <div className="mt-4">
            <SpeedChart data={graphs?.wpmTrend || []} />
          </div>
        </div>
        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="font-semibold">Accuracy Trend</h3>
          <div className="mt-4">
            <AccuracyChart data={graphs?.accuracyTrend || []} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-card p-6">
        <h3 className="font-semibold">Practice Heatmap</h3>
        <p className="mt-1 text-sm text-muted">Last 90 days of practice activity</p>
        <div className="mt-4 overflow-x-auto">
          {heatmap && (
            <PracticeHeatmap
              practice={heatmap.practice}
              attendance={heatmap.attendance}
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-card p-6">
        <h3 className="font-semibold">Batch Comparison</h3>
        <p className="mt-1 text-sm text-muted">How you compare with batchmates this month</p>
        <div className="mt-4 h-64">
          {comparisonData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="periodXp" name="XP" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avgWpm" name="WPM" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted">No batch comparison data</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-card p-6">
        <h3 className="flex items-center gap-2 font-semibold">
          <Bot className="h-5 w-5 text-primary" /> AI Insights
        </h3>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {insights || "Keep practicing daily to see personalized insights."}
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-card p-6">
        <h3 className="font-semibold">Batch Leaderboard</h3>
        <div className="mt-4">
          <LeaderboardTable data={batchComparison as Parameters<typeof LeaderboardTable>[0]["data"]} />
        </div>
      </div>
    </div>
  );
}