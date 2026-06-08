"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { api, ExamAttempt } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getMyExamAttempts(id)
      .then((attempts) => {
        const evaluated = attempts.find((a) => a.status === "evaluated");
        if (evaluated) setAttempt(evaluated);
        else if (attempts.length) setAttempt(attempts[0]);
        else router.push(`/student/exams/${id}`);
      })
      .catch(() => router.push("/student/exams"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!attempt) return null;

  const exam = typeof attempt.exam === "object" ? attempt.exam : null;
  const totalMarks = exam?.totalMarks || 100;
  const percent = Math.round(((attempt.score || 0) / totalMarks) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/student/exams"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to exams
      </Link>

      <div className="rounded-2xl border border-default bg-card p-8 text-center">
        <Trophy className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">{exam?.title || "Exam Results"}</h2>
        <p className="mt-6 text-5xl font-bold text-primary">{attempt.score}/{totalMarks}</p>
        <p className="mt-2 text-lg text-muted">{percent}% score</p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-primary-light p-4">
            <p className="text-xs text-muted">WPM</p>
            <p className="text-xl font-bold">{attempt.wpm ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-success-light p-4">
            <p className="text-xs text-muted">Accuracy</p>
            <p className="text-xl font-bold">{attempt.accuracy ?? "—"}%</p>
          </div>
          <div className="rounded-xl bg-primary-light p-4">
            <p className="text-xs text-muted">Time</p>
            <p className="text-xl font-bold">
              {attempt.timeTakenSeconds
                ? `${Math.floor(attempt.timeTakenSeconds / 60)}m ${attempt.timeTakenSeconds % 60}s`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {attempt.analysis && (
        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="font-semibold">AI Analysis</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{attempt.analysis}</p>
        </div>
      )}

      {attempt.answers?.length ? (
        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="font-semibold">Answer Breakdown</h3>
          <div className="mt-4 space-y-3">
            {attempt.answers.map((a, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  a.isCorrect ? "border-success/30 bg-success-light/30" : "border-danger/30 bg-danger-light/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {a.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-danger" />
                  )}
                  <span>Question {a.questionIndex + 1}</span>
                </div>
                <span className="font-semibold">{a.marks ?? 0} marks</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}