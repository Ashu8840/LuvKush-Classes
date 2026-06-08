"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { api, Exam, ExamAttempt } from "@/lib/api";
import { paginateSlice } from "@/lib/paginate";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [examPage, setExamPage] = useState(1);
  const [attemptPage, setAttemptPage] = useState(1);

  useEffect(() => {
    Promise.all([api.getExams(), api.getMyExamAttempts()])
      .then(([e, a]) => {
        setExams(Array.isArray(e) ? e : e.exams);
        setAttempts(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getAttemptForExam = (examId: string) =>
    attempts.find((a) => {
      const examRef = typeof a.exam === "object" ? a.exam._id : a.exam;
      return examRef === examId && a.status === "evaluated";
    });

  const getTimingStatus = (exam: Exam) => {
    if (exam.isTimed === false) return "live";
    const now = Date.now();
    const start = new Date(exam.scheduledAt).getTime();
    const end = start + (exam.duration || 60) * 60 * 1000;
    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "live";
  };

  const examPaged = paginateSlice(exams, examPage);
  const evaluatedAttempts = attempts.filter((a) => a.status === "evaluated");
  const attemptPaged = paginateSlice(evaluatedAttempts, attemptPage);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Available Exams</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {exams.length ? examPaged.items.map((e) => {
            const attempt = getAttemptForExam(e._id);
            return (
              <div key={e._id} className="rounded-2xl border border-default bg-card p-6">
                <h4 className="font-semibold">{e.title}</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge-primary rounded-full px-3 py-1 text-xs capitalize">{e.type}</span>
                  <span className="badge-info rounded-full px-3 py-1 text-xs capitalize">
                    {e.questionType}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {e.duration} min
                  </span>
                  <span>{e.totalMarks} marks</span>
                </div>
                <p className="mt-2 text-sm text-muted">{formatDateTime(e.scheduledAt)}</p>

                {attempt ? (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-success">
                      <CheckCircle className="h-4 w-4" /> Score: {attempt.score}/{e.totalMarks}
                    </span>
                    <Link
                      href={`/student/exams/${e._id}/results`}
                      className="rounded-xl border border-default px-4 py-2 text-sm font-medium hover:bg-surface"
                    >
                      View Results
                    </Link>
                  </div>
                ) : getTimingStatus(e) === "upcoming" ? (
                  <p className="mt-4 rounded-xl bg-surface px-4 py-2 text-sm text-muted">
                    Opens at {formatDateTime(e.scheduledAt)}
                  </p>
                ) : getTimingStatus(e) === "ended" ? (
                  <p className="mt-4 rounded-xl bg-danger-light px-4 py-2 text-sm text-danger">Exam window closed</p>
                ) : (
                  <Link
                    href={`/student/exams/${e._id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <FileText className="h-4 w-4" /> Start Exam
                  </Link>
                )}
              </div>
            );
          }) : <p className="text-muted">No exams available</p>}
        </div>
        {exams.length > 0 && <Pagination page={examPaged.page} pages={examPaged.pages} onPageChange={setExamPage} className="mt-4" />}
      </div>

      {evaluatedAttempts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">Past Attempts</h3>
          <div className="mt-4 space-y-3">
            {attemptPaged.items.map((a) => {
              const exam = typeof a.exam === "object" ? a.exam : null;
              return (
                <div key={a._id} className="flex items-center justify-between rounded-xl border border-default bg-card p-4">
                  <div>
                    <p className="font-medium">{exam?.title || "Exam"}</p>
                    <p className="text-sm text-muted">
                      {a.submittedAt ? formatDateTime(a.submittedAt) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">{a.score} marks</span>
                    {exam && (
                      <Link
                        href={`/student/exams/${exam._id}/results`}
                        className="text-sm text-accent hover:underline"
                      >
                        Details
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={attemptPaged.page} pages={attemptPaged.pages} onPageChange={setAttemptPage} className="mt-4" />
        </div>
      )}
    </div>
  );
}