import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, ExamAttempt } from "../../lib/api";
import { Screen, Card, Button, Loading } from "../../components/ui";
import { StudentStackParamList } from "../../navigation/StudentNavigator";
import { useTheme } from "../../contexts/ThemeContext";

type Route = RouteProp<StudentStackParamList, "StudentExamResults">;
type Nav = NativeStackNavigationProp<StudentStackParamList, "StudentExamResults">;

export default function ExamResultsScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { examId } = route.params;
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyExamAttempts(examId)
      .then((attempts) => {
        const evaluated = attempts.find((a) => a.status === "evaluated");
        if (evaluated) setAttempt(evaluated);
        else if (attempts.length) setAttempt(attempts[0]);
        else navigation.goBack();
      })
      .catch(() => navigation.navigate("StudentDrawer"))
      .finally(() => setLoading(false));
  }, [examId, navigation]);

  if (loading) return <Loading full />;
  if (!attempt) return null;

  const exam = typeof attempt.exam === "object" ? attempt.exam : null;
  const totalMarks = exam?.totalMarks || 100;
  const percent = Math.round(((attempt.score || 0) / totalMarks) * 100);

  return (
    <Screen>
      <Card style={{ alignItems: "center" }}>
        <Ionicons name="trophy" size={48} color={colors.primary} />
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 12 }}>
          {exam?.title || "Exam Results"}
        </Text>
        <Text style={{ color: colors.accent, fontSize: 40, fontWeight: "700", marginTop: 16 }}>
          {attempt.score}/{totalMarks}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 16 }}>{percent}% score</Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 20, width: "100%" }}>
          <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12, alignItems: "center" }}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>WPM</Text>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>{attempt.wpm ?? "—"}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, alignItems: "center" }}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>Accuracy</Text>
            <Text style={{ color: "#16a34a", fontWeight: "700", fontSize: 18 }}>{attempt.accuracy ?? "—"}%</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12, alignItems: "center" }}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>Time</Text>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>
              {attempt.timeTakenSeconds
                ? `${Math.floor(attempt.timeTakenSeconds / 60)}m ${attempt.timeTakenSeconds % 60}s`
                : "—"}
            </Text>
          </View>
        </View>
      </Card>

      {attempt.analysis && (
        <Card>
          <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>AI Analysis</Text>
          <Text style={{ color: colors.muted, lineHeight: 22 }}>{attempt.analysis}</Text>
        </Card>
      )}

      {attempt.answers?.length ? (
        <Card>
          <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 12 }}>Answer Breakdown</Text>
          {attempt.answers.map((a, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                marginBottom: 8,
                borderRadius: 12,
                backgroundColor: a.isCorrect ? "#f0fdf4" : "#fef2f2",
                borderWidth: 1,
                borderColor: a.isCorrect ? "#bbf7d0" : "#fecaca",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons
                  name={a.isCorrect ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={a.isCorrect ? "#16a34a" : "#dc2626"}
                />
                <Text style={{ color: colors.text }}>Question {a.questionIndex + 1}</Text>
              </View>
              <Text style={{ color: colors.text, fontWeight: "600" }}>{a.marks ?? 0} marks</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Button label="Back to Exams" variant="outline" onPress={() => navigation.navigate("StudentDrawer", { screen: "StudentExams" } as never)} />
    </Screen>
  );
}