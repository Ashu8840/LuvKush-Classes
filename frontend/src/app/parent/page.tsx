"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Flame, IndianRupee, Trophy, Award } from "lucide-react";
import { api, ParentChild } from "@/lib/api";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { formatBadgeName } from "@/components/gamification/BadgeCelebration";

export default function ParentDashboard() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getParentChildren().then((data) => {
      setChildren(data);
      if (data.length) setSelectedId(data[0].student._id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api.getChildDashboard(selectedId)
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const profile = dashboard?.profile as { course?: { name: string }; batch?: { name: string }; feesStatus?: string; totalFees?: number; paidFees?: number } | undefined;
  const attendance = dashboard?.attendance as { percent?: number; presentDays?: number } | undefined;
  const gamification = dashboard?.gamification as { xp?: number; level?: number; streak?: number; badges?: string[] } | undefined;
  const student = dashboard?.student as { name?: string } | undefined;
  const examResults = (dashboard?.examResults as { exam?: { title: string }; score?: number }[]) || [];

  if (loading && !children.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Select Child</h3>
        <div className="mt-3">
          <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : dashboard ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-default bg-primary-light p-6"
          >
            <h2 className="text-2xl font-bold">{student?.name}</h2>
            <p className="mt-1 text-muted">
              {profile?.course?.name || "No course"} · Batch: {profile?.batch?.name || "—"}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Attendance", value: `${attendance?.percent ?? 0}%`, icon: <Calendar className="h-6 w-6" /> },
              { title: "Fees Status", value: profile?.feesStatus ?? "—", icon: <IndianRupee className="h-6 w-6" /> },
              { title: "Level", value: gamification?.level ?? 1, icon: <Trophy className="h-6 w-6" /> },
              { title: "Streak", value: `${gamification?.streak ?? 0} days`, icon: <Flame className="h-6 w-6" /> },
            ].map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-default bg-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">{stat.title}</p>
                    <p className="mt-2 text-2xl font-bold capitalize">{stat.value}</p>
                  </div>
                  <div className="rounded-xl bg-primary-light p-3 text-primary">{stat.icon}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-default bg-card p-6">
              <h3 className="font-semibold">Fee Summary</h3>
              {profile?.totalFees ? (
                <p className="mt-3 text-lg">
                  {formatCurrency(profile.paidFees || 0)} / {formatCurrency(profile.totalFees)}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">No fee records</p>
              )}
            </div>
            <div className="rounded-2xl border border-default bg-card p-6">
              <h3 className="font-semibold">Achievements</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {gamification?.badges?.length ? gamification.badges.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 badge-primary rounded-full px-3 py-1 text-xs font-medium">
                    <Award className="h-3 w-3" /> {formatBadgeName(b)}
                  </span>
                )) : <p className="text-sm text-muted">No badges yet</p>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-default bg-card p-6">
            <h3 className="font-semibold">Recent Exam Results</h3>
            <div className="mt-4 space-y-3">
              {examResults.length ? examResults.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-default p-4">
                  <span>{r.exam?.title}</span>
                  <span className="font-semibold text-primary">{r.score} marks</span>
                </div>
              )) : <p className="text-sm text-muted">No exam results yet</p>}
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted">Unable to load dashboard data.</p>
      )}
    </div>
  );
}