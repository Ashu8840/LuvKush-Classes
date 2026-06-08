import { useState, useEffect, useRef, useCallback } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { api, TypingPassage, TypingSession, TypingAnalysis } from "../../lib/api";
import {
  DURATION_OPTIONS,
  formatCountdown,
  computeErrorKeys,
  computeWpm,
  computeAccuracy,
} from "../../lib/typing-practice";
import { Screen, Card, Button, PillGroup } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";

const DIFFICULTY_OPTIONS = [
  { id: "", label: "All levels" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Hard" },
];

const FALLBACK: Record<string, string> = {
  english: "The quick brown fox jumps over the lazy dog. Practice makes perfect. Speed and accuracy come with daily practice.",
  hindi: "शिक्षा सबसे बड़ा धन है। अभ्यास से ही सिद्धि मिलती है। निरंतर प्रयास से ही सफलता मिलती है।",
};

function TypingStat({
  title,
  value,
  colors,
  compact,
  valueColor,
}: {
  title: string;
  value: string | number;
  colors: { muted: string; text: string; card: string; border: string };
  compact?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={[styles.statBox, compact && styles.statBoxCompact, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.muted }]} numberOfLines={1}>
        {title}
      </Text>
      <Text
        style={[styles.statValue, compact && styles.statValueCompact, { color: valueColor || colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
    </View>
  );
}

export default function StudentTypingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compactStats = width < 380;

  const [tab, setTab] = useState<"practice" | "analysis">("practice");
  const [language, setLanguage] = useState("english");
  const [passages, setPassages] = useState<TypingPassage[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [saving, setSaving] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<TypingAnalysis | null>(null);
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const passageScrollRef = useRef<ScrollView>(null);
  const cursorYRef = useRef(0);
  const submittingRef = useRef(false);
  const timeLeftRef = useRef(timeLeft);
  const durationRef = useRef(duration);
  const inputRef = useRef(input);
  const textRef = useRef("");

  const selectedPassage = passages.find((p) => p._id === selectedPassageId);
  const text = selectedPassage?.content || FALLBACK[language];
  textRef.current = text;
  inputRef.current = input;

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    api
      .getTypingPassages({
        language,
        ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
      })
      .then((data) => {
        setPassages(data);
        setSelectedPassageId((prev) => {
          if (data.find((p) => p._id === prev)) return prev;
          return data.length > 0 ? data[0]._id : "";
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [language, difficultyFilter]);

  useEffect(() => {
    if (!started && !finished) setTimeLeft(duration);
  }, [duration, started, finished]);

  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => setTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000);
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
    passageScrollRef.current?.scrollTo({ y: Math.max(0, cursorYRef.current - 60), animated: true });
  }, [input.length, started]);

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

  const beginTyping = useCallback(() => {
    if (started || finished) return;
    setStarted(true);
  }, [started, finished]);

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (submittingRef.current || finished || !started) return;
      submittingRef.current = true;
      setFinished(true);
      setSaving(true);

      const used = Math.max(durationRef.current - timeLeftRef.current, 1);
      const finalWpm = computeWpm(inputRef.current, used);
      const finalAccuracy = computeAccuracy(inputRef.current, textRef.current);

      try {
        const errorKeys = computeErrorKeys(textRef.current, inputRef.current);
        await api.saveTypingPractice(
          finalWpm,
          finalAccuracy,
          language,
          used,
          selectedPassageId || undefined,
          errorKeys
        );
        setSubmitMessage(
          autoSubmit
            ? `Time's up! ${finalWpm} WPM · ${finalAccuracy}% accuracy`
            : `Saved! ${finalWpm} WPM · ${finalAccuracy}% accuracy`
        );
      } catch {
        setSubmitMessage("Failed to save. Try again.");
        setFinished(false);
        submittingRef.current = false;
      } finally {
        setSaving(false);
      }
    },
    [finished, started, language, selectedPassageId]
  );

  useEffect(() => {
    if (started && !finished && timeLeft === 0) handleSubmit(true);
  }, [timeLeft, started, finished, handleSubmit]);

  const loadAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const [a, s] = await Promise.all([api.getTypingAnalysis(), api.getTypingSessions(5)]);
      setAnalysis(a);
      setSessions(s);
    } catch {
      setAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "analysis") loadAnalysis();
  }, [tab]);

  const renderTargetText = () =>
    text.split("").map((char, i) => {
      let color = colors.muted;
      if (i < input.length) color = input[i] === char ? "#16a34a" : "#dc2626";
      else if (i === input.length) color = colors.primary;

      return (
        <Text
          key={i}
          onLayout={
            i === input.length
              ? (e) => {
                  cursorYRef.current = e.nativeEvent.layout.y;
                }
              : undefined
          }
          style={{ color, fontSize: 16, lineHeight: 26 }}
        >
          {char}
        </Text>
      );
    });

  if (loading && tab === "practice") {
    return (
      <Screen title="Typing Practice">
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (tab === "analysis") {
    return (
      <Screen title="Typing Practice">
        <PillGroup
          options={[
            { id: "practice", label: "Practice" },
            { id: "analysis", label: "Analysis" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as "practice" | "analysis")}
        />

        {analysisLoading && !analysis ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : analysis ? (
          <>
            <View style={styles.statsRow}>
              <TypingStat title="Avg WPM" value={analysis.context.avgWpm} colors={colors} compact={compactStats} />
              <TypingStat title="Avg Acc" value={`${analysis.context.avgAccuracy}%`} colors={colors} compact={compactStats} />
            </View>

            <Card>
              <Text style={{ fontWeight: "700", color: colors.text, marginBottom: 8 }}>Top 5 Sessions</Text>
              {sessions.map((s, i) => (
                <View key={s._id} style={[styles.sessionRow, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>#{i + 1}</Text>
                  <Text style={{ flex: 1, color: colors.text, fontSize: 13 }} numberOfLines={1}>
                    {s.passage?.title || "Practice"}
                  </Text>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>{s.wpm} WPM</Text>
                  <Text style={{ color: "#16a34a" }}>{s.accuracy}%</Text>
                </View>
              ))}
            </Card>

            {analysis.context.errorKeys.length > 0 && (
              <Card>
                <Text style={{ fontWeight: "700", color: colors.text, marginBottom: 8 }}>Difficult Keys</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {analysis.context.errorKeys.slice(0, 10).map((e) => (
                    <View key={e.key} style={styles.errorPill}>
                      <Text style={{ color: "#dc2626", fontFamily: "monospace", fontSize: 12 }}>
                        {e.key === " " ? "space" : e.key} ×{e.count}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            <Card>
              <Text style={{ fontWeight: "700", color: colors.text, marginBottom: 8 }}>AI Insights</Text>
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>{analysis.insights}</Text>
            </Card>

            <Button label="Refresh" variant="outline" onPress={loadAnalysis} />
          </>
        ) : (
          <Card>
            <Text style={{ color: colors.muted, textAlign: "center" }}>
              Save a practice session to unlock analysis.
            </Text>
            <Button label="Start Practicing" onPress={() => setTab("practice")} />
          </Card>
        )}
      </Screen>
    );
  }

  const timeUsed = duration - timeLeft;
  const countdownColor = timeLeft <= 10 && started && !finished ? "#dc2626" : colors.text;

  return (
    <Screen title="Typing Practice">
      <PillGroup
        options={[
          { id: "practice", label: "Practice" },
          { id: "analysis", label: "Analysis" },
        ]}
        value={tab}
        onChange={(v) => setTab(v as "practice" | "analysis")}
      />

      <PillGroup
        options={[
          { id: "english", label: "English" },
          { id: "hindi", label: "Hindi" },
        ]}
        value={language}
        onChange={(v) => {
          setLanguage(v);
          resetPractice();
        }}
      />

      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>DURATION</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DURATION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.seconds}
              disabled={started && !finished}
              onPress={() => {
                setDuration(opt.seconds);
                if (!started && !finished) setTimeLeft(opt.seconds);
              }}
              style={[
                styles.durationPill,
                {
                  backgroundColor: duration === opt.seconds ? colors.primary : colors.card,
                  borderColor: colors.border,
                  opacity: started && !finished ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: duration === opt.seconds ? colors.primaryText : colors.text,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.dropdownRow}>
        <SelectDropdown
          label="Content"
          value={selectedPassageId || "default"}
          disabled={started && !finished}
          options={
            passages.length > 0
              ? passages.map((p) => ({
                  id: p._id,
                  label: `${p.title} (${p.wordCount}w · ${p.difficulty === "advanced" ? "hard" : p.difficulty})`,
                }))
              : [{ id: "default", label: "Default sample text" }]
          }
          onChange={(id) => {
            if (id !== "default") {
              setSelectedPassageId(id);
              resetPractice();
            }
          }}
        />
        <SelectDropdown
          label="Difficulty"
          value={difficultyFilter}
          disabled={started && !finished}
          options={DIFFICULTY_OPTIONS}
          onChange={(id) => {
            setDifficultyFilter(id);
            resetPractice();
          }}
        />
      </View>

      <View style={styles.statsRow}>
        <TypingStat title="WPM" value={wpm} colors={colors} compact={compactStats} />
        <TypingStat title="Accuracy" value={`${accuracy}%`} colors={colors} compact={compactStats} />
        <TypingStat
          title={started ? "Time Left" : "Duration"}
          value={started ? formatCountdown(timeLeft) : formatCountdown(duration)}
          colors={colors}
          compact={compactStats}
          valueColor={countdownColor}
        />
      </View>

      <View style={{ position: "relative" }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <ScrollView
            ref={passageScrollRef}
            style={{ maxHeight: 220 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            <View style={{ padding: 16, flexDirection: "row", flexWrap: "wrap" }}>{renderTargetText()}</View>
          </ScrollView>
        </Card>
        {!started && !finished && (
          <View style={styles.startOverlay}>
            <Text style={[styles.startOverlayText, { color: colors.primary, borderColor: colors.primary }]}>
              Press any key to start — timer begins on first keystroke
            </Text>
          </View>
        )}
      </View>

      <TextInput
        value={input}
        onChangeText={(v) => {
          if (!started && !finished) beginTyping();
          if (!finished) setInput(v);
        }}
        editable={!finished}
        placeholder={started ? "Keep typing..." : "Press any key to start..."}
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        autoCapitalize="none"
        multiline
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 16,
          minHeight: 120,
          color: colors.text,
          backgroundColor: colors.card,
          textAlignVertical: "top",
          fontSize: 16,
          opacity: finished ? 0.6 : 1,
        }}
      />

      {submitMessage ? (
        <Card style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <Text style={{ color: "#16a34a", fontWeight: "600", textAlign: "center" }}>{submitMessage}</Text>
          {timeUsed > 0 && (
            <Text style={{ color: colors.muted, textAlign: "center", fontSize: 12, marginTop: 4 }}>
              Time used: {formatCountdown(timeUsed)}
            </Text>
          )}
        </Card>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button label={finished ? "Practice Again" : "Reset"} variant="outline" onPress={resetPractice} disabled={saving} />
        <Button
          label={saving ? "Submitting..." : "Submit Early"}
          onPress={() => handleSubmit(false)}
          disabled={!started || finished || saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  statBox: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 96,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statBoxCompact: {
    minWidth: 88,
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
    width: "100%",
  },
  statValueCompact: {
    fontSize: 20,
  },
  durationPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 16,
  },
  startOverlayText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  errorPill: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});