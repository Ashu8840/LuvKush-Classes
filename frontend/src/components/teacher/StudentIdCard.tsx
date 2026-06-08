"use client";

import { GraduationCap, Users } from "lucide-react";
import { StudentProfile, User } from "@/lib/api";

type StudentWithUser = StudentProfile & { user?: User & { _id?: string } };

function Avatar({ name, url }: { name: string; url?: string }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-card bg-primary-light shadow-lg ring-2 ring-accent/30">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-accent">
          {initials}
        </span>
      )}
    </div>
  );
}

export function StudentIdCard({
  student,
  onClick,
}: {
  student: StudentWithUser;
  onClick: () => void;
}) {
  const name = student.user?.name || "Student";
  const batch = student.batch?.name || "—";
  const course = student.course?.name || "—";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl border border-default bg-card text-left shadow-sm transition hover:border-accent/40 hover:shadow-lg"
    >
      <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-transparent px-6 pb-4 pt-8">
        <Avatar name={name} url={student.user?.avatar} />
        <h4 className="mt-4 text-center text-lg font-bold text-foreground group-hover:text-accent">
          {name}
        </h4>
        <p className="mt-0.5 text-center text-xs text-muted">{student.user?.email}</p>
      </div>
      <div className="space-y-2 border-t border-default px-5 py-4">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 shrink-0 text-accent" />
          <span className="text-muted">Batch</span>
          <span className="ml-auto font-medium text-foreground">{batch}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <GraduationCap className="h-4 w-4 shrink-0 text-accent" />
          <span className="text-muted">Course</span>
          <span className="ml-auto font-medium text-foreground">{course}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-surface p-3 text-center">
          <div>
            <p className="text-xs text-muted">Performance</p>
            <p className="text-lg font-bold text-foreground">{student.performanceScore ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Attendance</p>
            <p className="text-lg font-bold text-foreground">{student.attendancePercent ?? 0}%</p>
          </div>
        </div>
        <p className="pt-1 text-center text-xs font-medium text-accent opacity-0 transition group-hover:opacity-100">
          View report card →
        </p>
      </div>
    </button>
  );
}