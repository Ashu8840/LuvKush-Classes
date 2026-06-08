import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api, ExamAttempt, ParentChild } from "../../lib/api";
import { formatDateTime } from "../../lib/utils";
import { Screen, Card, Loading } from "../../components/ui";
import { ChildSelector } from "../../components/parent/ChildSelector";
import { useTheme } from "../../contexts/ThemeContext";

export default function ParentProgressScreen() {
  const { colors } = useTheme();
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
    <Screen title="Exam Progress">
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? <Loading /> : attempts.length ? attempts.map((a) => {
        const exam = typeof a.exam === "object" ? a.exam : null;
        return (
          <Card key={a._id}>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{exam?.title || "Exam"}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, textTransform: "capitalize" }}>{exam?.type}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12, alignItems: "center" }}>
                <Text style={{ color: colors.muted, fontSize: 11 }}>Score</Text>
                <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 18 }}>{a.score}/{exam?.totalMarks}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, alignItems: "center" }}>
                <Text style={{ color: colors.muted, fontSize: 11 }}>WPM</Text>
                <Text style={{ color: "#16a34a", fontWeight: "700", fontSize: 18 }}>{a.wpm ?? "—"}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12, alignItems: "center" }}>
                <Text style={{ color: colors.muted, fontSize: 11 }}>Accuracy</Text>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>{a.accuracy ?? "—"}%</Text>
              </View>
            </View>
            {a.submittedAt && (
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 8 }}>{formatDateTime(a.submittedAt)}</Text>
            )}
          </Card>
        );
      }) : (
        <Text style={{ color: colors.muted, textAlign: "center" }}>No exam scores yet</Text>
      )}
    </Screen>
  );
}