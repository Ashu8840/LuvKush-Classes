import { useEffect, useState } from "react";
import {
  Text, TextInput, View, Alert, ScrollView, Pressable, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, ShorthandDictation, ShorthandMistake } from "../../lib/api";
import { formatBadgeName } from "../../lib/utils";
import { Screen, Card, Button, StatCard, Badge, Loading } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { useDictationPlayer } from "../../hooks/useDictationPlayer";

type EvaluationResult = {
  accuracy: number;
  wpm: number;
  mistakes: ShorthandMistake[];
  insights: string;
  improvementFromPrevious: number;
};

export default function StudentShorthandScreen() {
  const { colors } = useTheme();
  const [dictations, setDictations] = useState<ShorthandDictation[]>([]);
  const [selected, setSelected] = useState<ShorthandDictation | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [progressData, setProgressData] = useState<{ date: string; accuracy: number }[]>([]);
  const { playing, elapsed, togglePlay, reset: resetPlayer } = useDictationPlayer(selected?.audioUrl);

  useEffect(() => {
    Promise.all([api.getDictations(), api.getShorthandProgress()])
      .then(([dicts, progress]) => {
        setDictations(dicts);
        if (dicts.length) setSelected(dicts[0]);
        const recent = (progress.recentAttempts as { createdAt: string; accuracy: number }[]) || [];
        setProgressData(recent.map((a) => ({ date: a.createdAt, accuracy: a.accuracy })).reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetPractice = async () => {
    setAnswer("");
    setResult(null);
    await resetPlayer();
  };

  const selectDictation = (d: ShorthandDictation) => {
    setSelected(d);
    resetPractice();
  };

  const handleSubmit = async () => {
    if (!selected || !answer.trim()) {
      Alert.alert("Required", "Please type your answer before submitting");
      return;
    }
    setSubmitting(true);
    const duration = elapsed || selected.durationSeconds;

    try {
      const data = await api.submitDictationAttempt(selected._id, answer, duration);
      setResult(data.evaluation);
      if (data.gamification?.newBadges?.length) setNewBadges(data.gamification.newBadges);
      setXpEarned(data.gamification?.xpEarned ?? 0);
      const progress = await api.getShorthandProgress();
      const recent = (progress.recentAttempts as { createdAt: string; accuracy: number }[]) || [];
      setProgressData(recent.map((a) => ({ date: a.createdAt, accuracy: a.accuracy })).reverse());
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Screen title="Shorthand Practice"><Loading full /></Screen>;

  return (
    <Screen title="Shorthand Practice">
      <View style={[styles.hero, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
        <Ionicons name="mic-circle" size={32} color={colors.accent} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Dictation Practice</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{dictations.length} dictation(s) from your teacher</Text>
        </View>
      </View>

      {dictations.length === 0 ? (
        <Card style={{ alignItems: "center", paddingVertical: 32 }}>
          <Ionicons name="mic-off-outline" size={40} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center" }}>
            No dictations available yet. Your teacher will upload practice material here.
          </Text>
        </Card>
      ) : (
        <>
          <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Select Dictation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 10 }}>
            {dictations.map((d) => {
              const active = selected?._id === d._id;
              return (
                <Pressable
                  key={d._id}
                  onPress={() => selectDictation(d)}
                  style={[
                    styles.dictCard,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.primaryLight : colors.card,
                    },
                  ]}
                >
                  <Ionicons name="headset" size={20} color={active ? colors.accent : colors.muted} />
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13, marginTop: 6, maxWidth: 120 }} numberOfLines={2}>
                    {d.title}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{d.targetWpm} WPM</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {newBadges.length > 0 && (
            <Card style={{ backgroundColor: "#fef9c3", borderColor: "#facc15", marginBottom: 12 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>New Badges Earned!</Text>
              {newBadges.map((b) => <Badge key={b} label={formatBadgeName(b)} />)}
            </Card>
          )}

          {selected && (
            <Card style={{ marginBottom: 12, overflow: "hidden", padding: 0 }}>
              <View style={[styles.playerHeader, { backgroundColor: colors.accent }]}>
                <Ionicons name="radio" size={22} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8, flex: 1 }}>{selected.title}</Text>
              </View>
              <View style={{ padding: 16, alignItems: "center" }}>
                <View style={[styles.timerRing, { borderColor: colors.accent }]}>
                  <Text style={{ color: colors.text, fontWeight: "800", fontSize: 28, fontFamily: "monospace" }}>{elapsed}s</Text>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>of {selected.durationSeconds}s</Text>
                </View>
                <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>Target: {selected.targetWpm} WPM</Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <Button
                    label={playing ? "Pause" : "Play"}
                    onPress={togglePlay}
                    small
                  />
                  <Button label="Reset" variant="outline" onPress={resetPractice} small />
                </View>
              </View>
            </Card>
          )}

          <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Your Answer</Text>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type what you heard…"
            placeholderTextColor={colors.muted}
            editable={!result}
            multiline
            style={[
              styles.answerBox,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
                opacity: result ? 0.7 : 1,
              },
            ]}
          />

          {!result ? (
            <Button
              label={submitting ? "Evaluating..." : "Submit for AI Evaluation"}
              disabled={submitting || !selected}
              onPress={handleSubmit}
            />
          ) : (
            <Card>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 17, marginBottom: 12 }}>Evaluation Results</Text>
              {xpEarned > 0 && <Text style={{ color: colors.accent, marginBottom: 8 }}>+{xpEarned} XP earned!</Text>}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <StatCard title="Accuracy" value={`${result.accuracy}%`} />
                <StatCard title="WPM" value={result.wpm} />
                <StatCard title="Δ" value={`${result.improvementFromPrevious > 0 ? "+" : ""}${result.improvementFromPrevious}%`} />
              </View>

              {result.mistakes.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>Top Mistakes</Text>
                  {result.mistakes.slice(0, 5).map((m, i) => (
                    <Text key={i} style={{ color: "#dc2626", fontSize: 13 }}>
                      Expected &quot;{m.expected}&quot; → &quot;{m.typed || "(missing)"}&quot;
                    </Text>
                  ))}
                </View>
              )}

              {result.insights && (
                <View style={{ marginTop: 12, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>AI Coach</Text>
                  <Text style={{ color: colors.text, marginTop: 4, lineHeight: 20 }}>{result.insights}</Text>
                </View>
              )}

              <View style={{ marginTop: 12 }}>
                <Button label="Try Again" variant="outline" onPress={resetPractice} />
              </View>
            </Card>
          )}

          {progressData.length > 0 && (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Recent Progress</Text>
              {progressData.slice(-5).map((d, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: colors.border }}>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>{new Date(d.date).toLocaleDateString("en-IN")}</Text>
                  <Text style={{ color: colors.accent, fontWeight: "700" }}>{d.accuracy}%</Text>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  dictCard: { width: 130, padding: 12, borderRadius: 14, borderWidth: 1.5, alignItems: "center" },
  playerHeader: { flexDirection: "row", alignItems: "center", padding: 12 },
  timerRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  answerBox: { borderWidth: 1, borderRadius: 16, padding: 16, minHeight: 140, textAlignVertical: "top", marginBottom: 12 },
});