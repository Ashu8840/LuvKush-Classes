"use client";

import { useEffect, useState } from "react";
import {
  Award, BookOpen, Calendar, ClipboardList, Loader2, Mic, Type,
} from "lucide-react";
import { api, StudentReport } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentReportModal({
  studentId,
  studentName,
  open,
  onClose,
}: {
  studentId: string | null;
  studentName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);
    api
      .getStudentReport(studentId)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [open, studentId]);

  const profile = report?.profile;

  return (
    <Modal open={open} onClose={onClose} title={`Report Card — ${studentName}`} className="max-w-3xl">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !report ? (
        <p className="py-8 text-center text-muted">Unable to load student report.</p>
      ) : (
        <div className="max-h-[75vh] space-y-6 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Performance", value: profile?.performanceScore ?? 0, icon: Award },
              { label: "Attendance", value: `${report.attendance.summary.percent}%`, icon: Calendar },
              { label: "Exams Taken", value: report.exams.length, icon: ClipboardList },
              { label: "Shorthand Avg", value: `${report.shorthand.avgAccuracy}%`, icon: Mic },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-default bg-surface p-4 text-center">
                <Icon className="mx-auto h-5 w-5 text-accent" />
                <p className="mt-2 text-xs text-muted">{label}</p>
                <p className="text-lg font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <section>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <ClipboardList className="h-4 w-4 text-accent" />
              Examination Results
            </h4>
            {report.exams.length === 0 ? (
              <p className="rounded-xl border border-dashed border-default p-6 text-center text-sm text-muted">
                No evaluated exams yet
              </p>
            ) : (
              <div className="space-y-2">
                {report.exams.map((e) => (
                  <div key={e.attemptId} className="rounded-xl border border-default bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{e.exam?.title || "Exam"}</p>
                        <p className="text-xs capitalize text-muted">
                          {e.exam?.type} · {e.exam?.questionType}
                          {e.submittedAt && ` · ${formatDateTime(e.submittedAt)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-accent">
                          {e.score}
                          {e.totalMarks ? `/${e.totalMarks}` : ""}
                        </p>
                        {e.percentage != null && (
                          <p className="text-xs text-muted">{e.percentage}%</p>
                        )}
                      </div>
                    </div>
                    {(e.wpm || e.accuracy) && (
                      <p className="mt-2 text-xs text-muted">
                        {e.wpm ? `WPM: ${e.wpm}` : ""}
                        {e.wpm && e.accuracy ? " · " : ""}
                        {e.accuracy ? `Accuracy: ${e.accuracy}%` : ""}
                      </p>
                    )}
                    {e.analysis && (
                      <p className="mt-2 rounded-lg bg-primary-light p-2 text-xs text-foreground">{e.analysis}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Mic className="h-4 w-4 text-accent" />
              Shorthand Practice
            </h4>
            <div className="mb-3 flex gap-4 text-sm">
              <span><strong>{report.shorthand.totalAttempts}</strong> attempts</span>
              <span>Avg WPM: <strong>{report.shorthand.avgWpm}</strong></span>
              <span>Avg Accuracy: <strong>{report.shorthand.avgAccuracy}%</strong></span>
            </div>
            {report.shorthand.recent.length > 0 && (
              <div className="space-y-1">
                {report.shorthand.recent.map((a) => (
                  <div key={a._id} className="flex justify-between rounded-lg bg-surface px-3 py-2 text-sm">
                    <span>{a.dictation?.title || "Dictation"}</span>
                    <span className="text-muted">{a.accuracy}% · {a.wpm} WPM</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <Type className="h-4 w-4 text-accent" />
              Typing Practice
            </h4>
            <div className="mb-3 flex gap-4 text-sm">
              <span><strong>{report.typing.totalSessions}</strong> sessions</span>
              <span>Avg WPM: <strong>{report.typing.avgWpm}</strong></span>
              <span>Avg Accuracy: <strong>{report.typing.avgAccuracy}%</strong></span>
            </div>
          </section>

          <section>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-accent" />
              Attendance Record
            </h4>
            <div className="mb-3 grid grid-cols-4 gap-2 text-center text-xs">
              {(["present", "absent", "late", "leave"] as const).map((s) => (
                <div key={s} className="rounded-lg bg-surface p-2 capitalize">
                  <p className="text-muted">{s}</p>
                  <p className="font-bold text-foreground">{report.attendance.summary[s]}</p>
                </div>
              ))}
            </div>
            {report.attendance.recent.slice(0, 8).map((r) => (
              <div key={r._id} className="flex justify-between border-b border-default py-2 text-sm last:border-0">
                <span>{new Date(r.date).toLocaleDateString("en-IN")}</span>
                <span className="capitalize font-medium">{r.status}</span>
              </div>
            ))}
          </section>
        </div>
      )}
      {loading && <Loader2 className="absolute right-12 top-5 h-4 w-4 animate-spin text-muted" />}
    </Modal>
  );
}