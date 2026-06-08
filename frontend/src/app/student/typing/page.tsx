"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, Maximize2, X, BarChart3, Bot, TrendingUp, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { api, TypingPassage, TypingSession, TypingAnalysis } from "@/lib/api";
import {
  DURATION_OPTIONS,
  formatCountdown,
  computeErrorKeys,
  computeWpm,
  computeAccuracy,
} from "@/lib/typing-practice";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCelebration } from "@/components/gamification/BadgeCelebration";
import { fireCelebration } from "@/components/ui/confetti";

const FALLBACK_TEXTS = {
  english: "The quick brown fox jumps over the lazy dog. Practice makes perfect in typing skills.",
  hindi: "टाइपिंग अभ्यास से ही सफलता मिलती है। नियमित अभ्यास करें और अपनी गति बढ़ाएं।",
};

const SHORTCUTS = [
  { keys: "Any key", action: "Start timer" },
  { keys: "Esc", action: "Exit fullscreen / reset" },
  { keys: "F", action: "Toggle focus mode" },
];

function InsightsMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h4 key={i} className="mt-4 text-base font-semibold text-primary">
              {line.replace("## ", "")}
            </h4>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h5 key={i} className="mt-2 font-medium">
              {line.replace("### ", "")}
            </h5>
          );
        }
        if (line.match(/^[-*]\s/)) {
          return (
            <p key={i} className="ml-4 text-muted">
              • {line.replace(/^[-*]\s/, "")}
            </p>
          );
        }
        if (line.match(/^\d+\.\s/)) {
          return (
            <p key={i} className="ml-4 text-muted">
              {line}
            </p>
          );
        }
        if (line.trim() === "") return <br key={i} />;
        const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        return <p key={i} className="text-muted" dangerouslySetInnerHTML={{ __html: bold }} />;
      })}
    </div>
  );
}

export default function TypingPracticePage() {
  const [tab, setTab] = useState<"practice" | "analysis">("practice");
  const [isExpanded, setIsExpanded] = useState(false);
  const [language, setLanguage] = useState<"english" | "hindi">("english");
  const [passages, setPassages] = useState<TypingPassage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [saving, setSaving] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [analysis, setAnalysis] = useState<TypingAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const passageScrollRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const timeLeftRef = useRef(timeLeft);
  const durationRef = useRef(duration);

  const selectedPassage = passages.find((p) => p._id === selectedPassageId);
  const text = selectedPassage?.content || FALLBACK_TEXTS[language];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    api
      .getTypingPassages({
        language,
        ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
      })
      .then((data) => {
        setPassages(data);
        if (data.length > 0 && !data.find((p) => p._id === selectedPassageId)) {
          setSelectedPassageId(data[0]._id);
        }
      })
      .catch(() => toast.error("Failed to load typing content"))
      .finally(() => setLoading(false));
  }, [language, difficultyFilter]);

  useEffect(() => {
    if (isExpanded) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  const exitExpanded = useCallback(() => {
    setIsExpanded(false);
    document.body.style.overflow = "";
  }, []);

  const enterExpanded = useCallback(() => {
    setFocusMode(true);
    setIsExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const timeUsed = duration - timeLeft;

  useEffect(() => {
    if (!started && !finished) setTimeLeft(duration);
  }, [duration, started, finished]);

  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [started, finished]);

  useEffect(() => {
    if (!started) return;
    const used = Math.max(duration - timeLeft, 1);
    setWpm(computeWpm(input, used));
    setAccuracy(computeAccuracy(input, text));
  }, [input, timeLeft, duration, started, text]);

  useEffect(() => {
    if (!started || input.length === 0) return;
    cursorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [input.length, started]);

  const beginTyping = useCallback(() => {
    if (started || finished) return;
    setStarted(true);
    inputRef.current?.focus();
  }, [started, finished]);

  const resetPractice = useCallback(() => {
    setInput("");
    setStarted(false);
    setFinished(false);
    setTimeLeft(duration);
    setWpm(0);
    setAccuracy(100);
    setSubmitMessage("");
    submittingRef.current = false;
  }, [duration]);

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (submittingRef.current || finished || !started) return;
      submittingRef.current = true;
      setFinished(true);
      setSaving(true);

      const used = Math.max(durationRef.current - timeLeftRef.current, 1);
      const finalWpm = computeWpm(input, used);
      const finalAccuracy = computeAccuracy(input, text);

      try {
        const errorKeys = computeErrorKeys(text, input);
        const result = await api.saveTypingPractice(
          finalWpm,
          finalAccuracy,
          language,
          used,
          selectedPassageId || undefined,
          errorKeys
        );
        const msg = autoSubmit
          ? `Time's up! Auto-submitted — ${finalWpm} WPM, ${finalAccuracy}% accuracy`
          : `Saved! ${finalWpm} WPM, ${finalAccuracy}% accuracy — +${(result.xpEarned as number) || 0} XP`;
        setSubmitMessage(msg);
        toast.success(msg);
        const badges = (result.newBadges as string[]) || [];
        if (badges.length) {
          setNewBadges(badges);
          fireCelebration();
          sessionStorage.setItem("celebrateBadges", JSON.stringify(badges));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
        setFinished(false);
        submittingRef.current = false;
      } finally {
        setSaving(false);
      }
    },
    [finished, started, input, text, language, selectedPassageId]
  );

  useEffect(() => {
    if (started && !finished && timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft, started, finished, handleSubmit]);

  const loadAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const [analysisData, sessionData] = await Promise.all([
        api.getTypingAnalysis(),
        api.getTypingSessions(5),
      ]);
      setAnalysis(analysisData);
      setSessions(sessionData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "analysis") loadAnalysis();
  }, [tab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tab !== "practice") return;
      if (!started && !finished && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        beginTyping();
      }
      if (e.key === "Escape") {
        if (isExpanded) exitExpanded();
        else if (!finished) resetPractice();
      }
      if (e.key === "f" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "TEXTAREA") {
        setFocusMode((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const renderText = () =>
    text.split("").map((char, i) => {
      let className = "text-muted";
      if (i < input.length) {
        className = input[i] === char ? "text-success" : "text-danger bg-danger-light";
      } else if (i === input.length) {
        className = "bg-primary/20 text-foreground underline";
      }
      return (
        <span key={i} ref={i === input.length ? cursorRef : undefined} className={className}>
          {char}
        </span>
      );
    });

  if (loading && tab === "practice") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const headerControls = !isExpanded && (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Keyboard className="h-5 w-5 text-primary" /> Typing Practice
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {(["practice", "analysis"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "border border-default"
            }`}
          >
            {t === "analysis" ? <BarChart3 className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
            {t}
          </button>
        ))}
      </div>
    </div>
  );

  const analysisView = (
    <div className="space-y-6">
      {headerControls}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">AI-powered insights from your top 5 saved sessions</p>
        <button
          type="button"
          onClick={loadAnalysis}
          disabled={analysisLoading}
          className="rounded-lg border border-default px-4 py-2 text-sm font-medium hover:bg-primary-light disabled:opacity-60"
        >
          {analysisLoading ? "Analyzing..." : "Refresh Analysis"}
        </button>
      </div>

      {analysisLoading && !analysis ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : analysis ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Avg WPM", value: analysis.context.avgWpm, icon: Zap, color: "text-primary" },
              { label: "Avg Accuracy", value: `${analysis.context.avgAccuracy}%`, icon: Target, color: "text-success" },
              {
                label: "Top Errors",
                value: analysis.context.errorKeys[0]?.key || "—",
                icon: Keyboard,
                color: "text-danger",
              },
              { label: "Sessions", value: sessions.length, icon: TrendingUp, color: "text-accent" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-primary-light p-4 text-center">
                <stat.icon className={`mx-auto mb-1 h-5 w-5 ${stat.color}`} />
                <p className="text-xs text-muted">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-default bg-card p-5">
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top 5 Saved Progress
            </h4>
            <div className="space-y-2">
              {sessions.map((s, i) => (
                <div
                  key={s._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-default bg-surface px-4 py-3 text-sm"
                >
                  <span className="font-medium">#{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-muted">
                    {s.passage?.title || "Practice session"}
                  </span>
                  <span className="font-semibold text-primary">{s.wpm} WPM</span>
                  <span className="text-success">{s.accuracy}%</span>
                  <span className="text-xs text-muted">
                    {new Date(s.practicedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {analysis.context.errorKeys.length > 0 && (
            <div className="rounded-2xl border border-default bg-card p-5">
              <h4 className="mb-3 font-semibold">Most Difficult Keys</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.context.errorKeys.slice(0, 12).map((e) => (
                  <span
                    key={e.key}
                    className="rounded-lg bg-danger-light px-3 py-1.5 font-mono text-sm text-danger"
                  >
                    {e.key === " " ? "space" : e.key} ×{e.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-primary/30 bg-primary-light/20 p-5">
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <Bot className="h-5 w-5 text-primary" />
              AI Coach Insights
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-normal text-muted">
                {analysis.source === "groq" ? "Powered by Groq" : "Local analysis"}
              </span>
            </h4>
            <InsightsMarkdown text={analysis.insights} />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-default p-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">Save at least one practice session to unlock analysis.</p>
          <button
            type="button"
            onClick={() => setTab("practice")}
            className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Start Practicing
          </button>
        </div>
      )}
    </div>
  );

  if (tab === "analysis") {
    return <div className="mx-auto max-w-4xl space-y-6">{analysisView}</div>;
  }

  const practiceContent = (
    <>
      {newBadges.length > 0 && (
        <BadgeCelebration badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      {headerControls}

      {!isExpanded && (
        <div className="flex flex-wrap items-center gap-2">
          {(["english", "hindi"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                setLanguage(lang);
                resetPractice();
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                language === lang ? "bg-primary text-primary-foreground" : "border border-default"
              }`}
            >
              {lang}
            </button>
          ))}
          <button
            type="button"
            onClick={enterExpanded}
            className="ml-auto rounded-lg border border-default p-2 transition hover:bg-primary-light"
            title="Expand to fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {!isExpanded && (
        <>
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs font-semibold uppercase text-muted">Duration</span>
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                type="button"
                disabled={started && !finished}
                onClick={() => {
                  setDuration(opt.seconds);
                  if (!started && !finished) setTimeLeft(opt.seconds);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  duration === opt.seconds
                    ? "bg-primary text-primary-foreground"
                    : "border border-default"
                } disabled:opacity-50`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedPassageId}
              disabled={started && !finished}
              onChange={(e) => {
                setSelectedPassageId(e.target.value);
                resetPractice();
              }}
              className="min-w-[200px] flex-1 rounded-xl border border-default bg-card px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            >
              {passages.length === 0 ? (
                <option value="">Default sample text</option>
              ) : (
                passages.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.wordCount} words · {p.difficulty})
                  </option>
                ))
              )}
            </select>
            <select
              value={difficultyFilter}
              disabled={started && !finished}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="rounded-xl border border-default bg-card px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </>
      )}

      {isExpanded && (
        <div className="flex flex-wrap items-center justify-between gap-3 pr-14">
          <p className="text-sm font-medium">{selectedPassage?.title || `${language} practice`}</p>
          <p className="text-xs text-muted">Fullscreen — click ✕ or press Esc</p>
        </div>
      )}

      <AnimatePresence>
        {!focusMode && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-default bg-surface p-4"
          >
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Keyboard Shortcuts</p>
            <div className="flex flex-wrap gap-4">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="text-sm">
                  <kbd className="rounded bg-primary-light px-2 py-0.5 font-mono text-xs">{s.keys}</kbd>
                  <span className="ml-2 text-muted">{s.action}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "WPM", value: wpm, color: "text-primary" },
          { label: "Accuracy", value: `${accuracy}%`, color: "text-success" },
          {
            label: started ? "Time Left" : "Duration",
            value: started ? formatCountdown(timeLeft) : formatCountdown(duration),
            color: timeLeft <= 10 && started && !finished ? "text-danger" : "text-accent",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="min-w-0 rounded-xl bg-primary-light p-3 text-center sm:p-4"
          >
            <p className="truncate text-xs text-muted sm:text-sm">{stat.label}</p>
            <p className={`truncate text-xl font-bold sm:text-2xl ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <div
          ref={passageScrollRef}
          className={`overflow-y-auto scroll-smooth rounded-2xl border border-default bg-surface p-4 sm:p-6 ${
            isExpanded
              ? "max-h-[50vh] text-lg leading-loose"
              : `max-h-[320px] sm:max-h-[480px] ${focusMode ? "text-lg leading-loose" : "text-base leading-relaxed"}`
          }`}
        >
          <p className="break-words">{renderText()}</p>
        </div>
        {!started && !finished && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/85 backdrop-blur-[1px]">
            <p className="rounded-xl border border-primary/40 bg-primary-light px-6 py-3 text-center text-sm font-semibold text-primary">
              Press any key to start typing — timer begins on first keystroke
            </p>
          </div>
        )}
      </div>

      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => {
          if (!started && !finished) beginTyping();
          if (!finished) setInput(e.target.value);
        }}
        onKeyDown={() => {
          if (!started && !finished) beginTyping();
        }}
        disabled={finished}
        placeholder={started ? "Keep typing..." : "Press any key to start..."}
        className={`input-field w-full rounded-2xl border p-4 outline-none focus:border-primary disabled:opacity-60 ${
          isExpanded ? "min-h-[200px] text-lg" : focusMode ? "h-48 text-lg" : "h-32"
        }`}
      />

      {submitMessage && (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          {submitMessage}
          {timeUsed > 0 && !saving && (
            <span className="text-muted"> · Time used: {formatCountdown(timeUsed)}</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={resetPractice}
          disabled={saving}
          className="rounded-xl border border-default px-6 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {finished ? "Practice Again" : "Reset"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={saving || !started || finished}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Submitting..." : "Submit Early"}
        </button>
      </div>
    </>
  );

  if (isExpanded && mounted) {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex h-[100dvh] w-screen flex-col gap-4 overflow-y-auto bg-surface p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={exitExpanded}
          className="fixed right-4 top-4 z-[100000] flex h-12 w-12 items-center justify-center rounded-full border-2 border-default bg-card shadow-xl transition hover:border-danger hover:bg-danger-light hover:text-danger"
        >
          <X className="h-6 w-6" />
        </button>
        {practiceContent}
      </div>,
      document.body
    );
  }

  return (
    <div className={`mx-auto space-y-6 ${focusMode ? "max-w-4xl" : "max-w-3xl"}`}>{practiceContent}</div>
  );
}