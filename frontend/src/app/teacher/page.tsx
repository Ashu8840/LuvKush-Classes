"use client";

import { useEffect, useState } from "react";
import { Users, Calendar, FileText, Video } from "lucide-react";
import { StatCard } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function TeacherDashboard() {
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    api.teacherDashboard().then(setData).catch(() => {});
  }, []);

  const batches = (data.batches as { name: string; timing: string; course?: { name: string } }[]) || [];
  const students = (data.students as { user?: { name: string }; performanceScore: number; attendancePercent: number }[]) || [];
  const exams = (data.upcomingExams as { title: string; scheduledAt: string }[]) || [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Assigned Batches" value={batches.length} icon={<Users className="h-6 w-6" />} />
        <StatCard title="Total Students" value={students.length} icon={<Users className="h-6 w-6" />} />
        <StatCard title="Today's Attendance" value={(data.todayAttendance as number) ?? 0} icon={<Calendar className="h-6 w-6" />} />
        <StatCard title="Upcoming Exams" value={exams.length} icon={<FileText className="h-6 w-6" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="font-semibold">My Batches</h3>
          <div className="mt-4 space-y-3">
            {batches.map((b, i) => (
              <div key={i} className="rounded-xl border border-default p-4">
                <p className="font-medium">{b.name}</p>
                <p className="text-sm text-muted">{b.course?.name} · {b.timing}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="font-semibold">Student Progress</h3>
          <div className="mt-4 space-y-3">
            {students.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-default p-4">
                <span className="font-medium">{s.user?.name}</span>
                <div className="text-right text-sm">
                  <p>Score: {s.performanceScore}</p>
                  <p className="text-muted">Attendance: {s.attendancePercent}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary-light p-6">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Start Live Class</h3>
            <p className="text-sm text-muted">Camera, microphone, chat, whiteboard & screen sharing ready</p>
          </div>
          <button className="ml-auto rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Go Live
          </button>
        </div>
      </div>
    </div>
  );
}