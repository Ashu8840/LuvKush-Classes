"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Play, Pause, Send, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api, ShorthandDictation, ShorthandMistake } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCelebration } from "@/components/gamification/BadgeCelebration";
import { fireCelebration } from "@/components/ui/confetti";
import { AccuracyChart } from "@/components/analytics/AccuracyChart";

type EvaluationResult = {
  accuracy: number;
  wpm: number;
  mistakes: ShorthandMistake[];
  insights: string;
  improvementFromPrevious: number;
};

export default function ShorthandPracticePage() {
  const [dictations, setDictations] = useState<ShorthandDictation[]>([]);
  const [selected, setSelected] = useState<ShorthandDictation | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [progressData, setProgressData] = useState<{ date: string; accuracy: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    Promise.all([api.getDictations(), api.getShorthandProgress()])
      .then(([dicts, progress]) => {
        setDictations(dicts);
        if (dicts.length) setSelected(dicts[0]);
        const recent = (progress.recentAttempts as { createdAt: string; accuracy: number }[]) || [];
        setProgressData(recent.map((a) => ({ date: a.createdAt, accuracy: a.accuracy })).reverse());
      })
      .catch(() => toast.error("Failed to load dictations"))
      .finally(() => setLoading(false));
  }, []);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const togglePlay = () => {
    if (!selected?.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(selected.audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (!startTimeRef.current) startTimer();
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleSubmit = async () => {
    if (!selected || !answer.trim()) {
      toast.error("Please type your answer before submitting");
      return;
    }
    stopTimer();
    setSubmitting(true);
    const duration = elapsed || selected.durationSeconds;

    try {
      const data = await api.submitDictationAttempt(selected._id, answer, duration);
      setResult(data.evaluation);
      if (data.gamification?.newBadges?.length) {
        setNewBadges(data.gamification.newBadges);
        fireCelebration();
      }
      toast.success(`+${data.gamification?.xpEarned ?? 0} XP earned!`);
      const progress = await api.getShorthandProgress();
      const recent = (progress.recentAttempts as { createdAt: string; accuracy: number }[]) || [];
      setProgressData(recent.map((a) => ({ date: a.createdAt, accuracy: a.accuracy })).reverse());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPractice = () => {
    setAnswer("");
    setResult(null);
    setElapsed(0);
    startTimeRef.current = null;
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const highlightMistakes = () => {
    if (!result?.mistakes.length) return answer;
    const words = answer.split(/\s+/);
    return words.map((word, i) => {
      const mistake = result.mistakes.find((m) => m.index === i);
      if (mistake) {
        return (
          <span key={i} className="bg-danger-light text-danger underline decoration-wavy">
            {word}{" "}
          </span>
        );
      }
      return <span key={i}>{word} </span>;
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {newBadges.length > 0 && (
        <BadgeCelebration badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      <div className="flex flex-wrap gap-2">
        {dictations.length ? dictations.map((d) => (
          <button
            key={d._id}
            onClick={() => { setSelected(d); resetPractice(); }}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              selected?._id === d._id ? "bg-primary text-primary-foreground" : "border border-default"
            }`}
          >
            {d.title} ({d.targetWpm} WPM)
          </button>
        )) : <p className="text-muted">No dictations available for your batch</p>}
      </div>

      {selected && (
        <motion.div
          key={selected._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-default bg-primary-light p-8 text-center"
        >
          <Mic className="mx-auto h-12 w-12 text-primary" />
          <p className="mt-4 text-lg font-medium">{selected.title}</p>
          <p className="mt-2 text-sm text-muted">
            Target: {selected.targetWpm} WPM · Duration: {selected.durationSeconds}s
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={togglePlay}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {playing ? "Pause" : "Play Dictation"}
            </button>
            <span className="font-mono text-lg font-bold text-accent">{elapsed}s</span>
          </div>
        </motion.div>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your shorthand answer here..."
        disabled={!!result}
        className="input-field h-40 w-full rounded-2xl border p-4 outline-none focus:border-primary disabled:opacity-70"
      />

      {!result ? (
        <button
          onClick={handleSubmit}
          disabled={submitting || !selected}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Evaluating..." : "Submit for AI Evaluation"}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-2xl border border-default bg-card p-6"
        >
          <h3 className="text-lg font-semibold">Evaluation Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-primary-light p-4 text-center">
              <p className="text-sm text-muted">Accuracy</p>
              <p className="text-2xl font-bold text-primary">{result.accuracy}%</p>
            </div>
            <div className="rounded-xl bg-success-light p-4 text-center">
              <p className="text-sm text-muted">WPM</p>
              <p className="text-2xl font-bold text-success">{result.wpm}</p>
            </div>
            <div className="rounded-xl bg-primary-light p-4 text-center">
              <p className="text-sm text-muted">Improvement</p>
              <p className="text-2xl font-bold">
                {result.improvementFromPrevious > 0 ? "+" : ""}{result.improvementFromPrevious}%
              </p>
            </div>
          </div>

          {result.mistakes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Mistakes highlighted:</p>
              <div className="rounded-xl border border-default bg-surface p-4 text-lg leading-relaxed">
                {highlightMistakes()}
              </div>
              <div className="mt-3 space-y-1">
                {result.mistakes.slice(0, 5).map((m, i) => (
                  <p key={i} className="text-sm text-danger">
                    Expected &quot;{m.expected}&quot; but got &quot;{m.typed || "(missing)"}&quot;
                  </p>
                ))}
              </div>
            </div>
          )}

          {result.insights && (
            <div className="rounded-xl bg-primary-light/50 p-4">
              <p className="text-sm font-medium">AI Coach Feedback</p>
              <p className="mt-2 text-sm leading-relaxed">{result.insights}</p>
            </div>
          )}

          <button onClick={resetPractice} className="rounded-xl border border-default px-6 py-2.5 text-sm font-medium">
            Try Again
          </button>
        </motion.div>
      )}

      {progressData.length > 0 && (
        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" /> Progress Chart
          </h3>
          <div className="mt-4">
            <AccuracyChart data={progressData} />
          </div>
        </div>
      )}
    </div>
  );
}