"use client";

import { useEffect, useState } from "react";
import { api, ExamAttempt, ParentChild } from "@/lib/api";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

export default function ParentProgressPage() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getParentChildren().then((data) => {
      setChildren(data);
      if (data.length) setSelectedId(data[0].student._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api.getChildScores(selectedId)
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {attempts.length ? attempts.map((a) => {
            const exam = typeof a.exam === "object" ? a.exam : null;
            return (
              <div key={a._id} className="rounded-2xl border border-default bg-card p-6">
                <h4 className="font-semibold">{exam?.title || "Exam"}</h4>
                <p className="mt-1 text-sm capitalize text-muted">{exam?.type}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-primary-light p-3">
                    <p className="text-xs text-muted">Score</p>
                    <p className="text-lg font-bold text-primary">{a.score}/{exam?.totalMarks}</p>
                  </div>
                  <div className="rounded-xl bg-success-light p-3">
                    <p className="text-xs text-muted">WPM</p>
                    <p className="text-lg font-bold text-success">{a.wpm ?? "—"}</p>
                  </div>
                  <div className="rounded-xl bg-primary-light p-3">
                    <p className="text-xs text-muted">Accuracy</p>
                    <p className="text-lg font-bold">{a.accuracy ?? "—"}%</p>
                  </div>
                </div>
                {a.submittedAt && (
                  <p className="mt-3 text-xs text-muted">{formatDateTime(a.submittedAt)}</p>
                )}
              </div>
            );
          }) : <p className="text-muted">No exam scores yet</p>}
        </div>
      )}
    </div>
  );
}