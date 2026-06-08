"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, IndianRupee, FileText, Flame, Award, Keyboard, Mic,
  Trophy, TrendingUp, Bot, Zap,
} from "lucide-react";
import { api, LevelInfo } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCelebration, formatBadgeName } from "@/components/gamification/BadgeCelebration";
import { fireCelebration } from "@/components/ui/confetti";

const QUICK_ACTIONS = [
  { href: "/student/typing", label: "Typing Practice", icon: Keyboard },
  { href: "/student/shorthand", label: "Shorthand", icon: Mic },
  { href: "/student/exams", label: "Take Exam", icon: FileText },
  { href: "/student/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/student/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/student/ai-coach", label: "AI Coach", icon: Bot },
];

export default function StudentDashboard() {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    api.studentDashboard()
      .then((d) => {
        setData(d);
        const stored = sessionStorage.getItem("celebrateBadges");
        if (stored) {
          const badges = JSON.parse(stored) as string[];
          if (badges.length) {
            setNewBadges(badges);
            fireCelebration();
          }
          sessionStorage.removeItem("celebrateBadges");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const profile = data.profile as {
    attendancePercent?: number;
    feesStatus?: string;
    paidFees?: number;
    totalFees?: number;
    course?: { name: string };
    batch?: { name: string };
  } | undefined;
  const attendance = data.attendance as { percent?: number } | undefined;
  const exams = (data.upcomingExams as { _id: string; title: string; scheduledAt: string }[]) || [];
  const gamification = data.gamification as {
    xp?: number;
    level?: number;
    streak?: number;
    badges?: string[];
    levelInfo?: LevelInfo;
  } | undefined;

  const levelInfo = gamification?.levelInfo;
  const motivationalMessages = [
    "Every keystroke brings you closer to mastery!",
    "Consistency beats intensity — keep your streak alive!",
    "Your dedication today shapes tomorrow's success.",
  ];
  const message = motivationalMessages[new Date().getDay() % motivationalMessages.length];

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
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
      {newBadges.length > 0 && (
        <BadgeCelebration badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-default bg-gradient-to-r from-primary/10 via-primary-light to-accent/10 p-6 sm:p-8"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Daily Motivation</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-foreground">{message}</p>
            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-sm font-bold text-accent">
                <Flame className="h-4 w-4" />
                {gamification?.streak ?? 0} day streak
              </span>
              <span className="text-sm text-muted">Level {gamification?.level ?? 1} · {gamification?.xp ?? 0} XP</span>
            </div>
          </div>
          <ProgressRing
            value={levelInfo?.current ?? 0}
            max={levelInfo?.needed ?? 500}
            label={`Lv ${gamification?.level ?? 1}`}
            sublabel={`${levelInfo?.current ?? 0}/${levelInfo?.needed ?? 500} XP`}
            size={130}
          />
        </div>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Attendance", value: `${attendance?.percent ?? profile?.attendancePercent ?? 0}%`, icon: Calendar },
          { title: "Fees Status", value: profile?.feesStatus ?? "—", icon: IndianRupee },
          { title: "Upcoming Exams", value: exams.length, icon: FileText },
          { title: "Badges Earned", value: gamification?.badges?.length ?? 0, icon: Award },
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
                <p className="mt-2 text-3xl font-bold capitalize">{stat.value}</p>
              </div>
              <div className="rounded-xl bg-primary-light p-3 text-primary">
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <h3 className="mb-4 font-semibold">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <Link
                href={action.href}
                className="flex items-center gap-4 rounded-2xl border border-default bg-card p-5 transition hover:border-primary hover:shadow-md"
              >
                <div className="rounded-xl bg-primary-light p-3 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="font-semibold">My Course</h3>
          <p className="mt-2 text-2xl font-bold">{profile?.course?.name || "Not enrolled"}</p>
          <p className="text-sm text-muted">Batch: {profile?.batch?.name || "—"}</p>
          {profile?.totalFees ? (
            <p className="mt-4 text-sm">
              Fees: {formatCurrency(profile.paidFees || 0)} / {formatCurrency(profile.totalFees)}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="font-semibold">Achievements</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {gamification?.badges?.length ? gamification.badges.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 badge-primary rounded-full px-3 py-1 text-xs font-medium">
                <Award className="h-3 w-3" /> {formatBadgeName(b)}
              </span>
            )) : <p className="text-sm text-muted">Practice daily to earn badges!</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-card p-6">
        <h3 className="font-semibold">Upcoming Exams</h3>
        <div className="mt-4 space-y-3">
          {exams.length ? exams.map((e) => (
            <div key={e._id} className="flex items-center justify-between rounded-xl border border-default p-4">
              <span className="font-medium">{e.title}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">{new Date(e.scheduledAt).toLocaleString()}</span>
                <Link
                  href={`/student/exams/${e._id}`}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Start
                </Link>
              </div>
            </div>
          )) : <p className="text-sm text-muted">No upcoming exams</p>}
        </div>
      </div>
    </div>
  );
}