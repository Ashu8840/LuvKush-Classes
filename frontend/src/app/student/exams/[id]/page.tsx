"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";
import { api, Exam, ExamAttempt } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function TakeExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answer?: string; typedText?: string; durationSeconds?: number }>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const questionStartRef = useRef(Date.now());

  const handleSubmit = useCallback(async () => {
    if (!exam || submitting || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const payload = exam.questions.map((_, i) => ({
      questionIndex: i,
      answer: answers[i]?.answer,
      typedText: answers[i]?.typedText || answers[i]?.answer,
      durationSeconds: answers[i]?.durationSeconds || 60,
    }));

    try {
      await api.submitExam(exam._id, payload);
      toast.success("Exam submitted successfully!");
      router.push(`/student/exams/${exam._id}/results`);
    } catch (err) {
      submittedRef.current = false;
      toast.error(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  }, [exam, answers, submitting, router]);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getExam(id), api.startExam(id)])
      .then(([e, a]) => {
        setExam(e);
        setAttempt(a);
        const windowEnd = e.examWindowEnd ? new Date(e.examWindowEnd).getTime() : null;
        const started = new Date(a.startedAt).getTime();
        const attemptEnd = started + (e.duration || 60) * 60 * 1000;
        const effectiveEnd = windowEnd ? Math.min(attemptEnd, windowEnd) : attemptEnd;
        const remaining = Math.max(0, Math.floor((effectiveEnd - Date.now()) / 1000));
        setTimeLeft(remaining || (e.duration || 60) * 60);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load exam");
        router.push("/student/exams");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!exam) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, handleSubmit]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentQ]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const updateAnswer = (value: string, field: "answer" | "typedText" = "answer") => {
    const duration = Math.round((Date.now() - questionStartRef.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [currentQ]: { ...prev[currentQ], [field]: value, durationSeconds: duration },
    }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!exam) return null;

  const question = exam.questions[currentQ];
  const isMcq = exam.questionType === "mcq" || (question?.options && question.options.length > 0);
  const isTyping = exam.questionType === "typing" || exam.questionType === "shorthand";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border border-default bg-card p-4 shadow-sm">
        <div>
          <h3 className="font-semibold">{exam.title}</h3>
          <p className="text-sm text-muted">
            Question {currentQ + 1} of {exam.questions.length}
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold ${
          timeLeft < 300 ? "bg-danger-light text-danger" : "bg-primary-light text-primary"
        }`}>
          <Clock className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-card p-6">
        <p className="text-lg font-medium">{question?.question}</p>
        {question?.dictationAudio && (
          <audio controls src={question.dictationAudio} className="mt-4 w-full" />
        )}

        {isMcq && question?.options ? (
          <div className="mt-6 space-y-3">
            {question.options.map((opt, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  answers[currentQ]?.answer === opt
                    ? "border-primary bg-primary-light"
                    : "border-default hover:bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${currentQ}`}
                  checked={answers[currentQ]?.answer === opt}
                  onChange={() => updateAnswer(opt)}
                  className="accent-primary"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ) : isTyping ? (
          <textarea
            value={answers[currentQ]?.typedText || answers[currentQ]?.answer || ""}
            onChange={(e) => updateAnswer(e.target.value, "typedText")}
            placeholder="Type your answer here..."
            className="input-field mt-6 h-40 w-full rounded-xl border p-4 outline-none focus:border-primary"
          />
        ) : (
          <textarea
            value={answers[currentQ]?.answer || ""}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder="Write your answer..."
            className="input-field mt-6 h-32 w-full rounded-xl border p-4 outline-none focus:border-primary"
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
          disabled={currentQ === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-default px-4 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        <div className="flex gap-1">
          {exam.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`h-8 w-8 rounded-lg text-xs font-medium ${
                i === currentQ
                  ? "bg-primary text-primary-foreground"
                  : answers[i]
                    ? "bg-success-light text-success"
                    : "bg-surface text-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentQ < exam.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ((q) => q + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        )}
      </div>

      {attempt && (
        <p className="text-center text-xs text-muted">
          Started at {new Date(attempt.startedAt).toLocaleTimeString()} · Auto-submit when timer ends
        </p>
      )}
    </div>
  );
}