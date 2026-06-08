import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, Exam, ExamAttempt } from "../../lib/api";
import { formatDateTime } from "../../lib/utils";
import { paginateSlice } from "../../lib/paginate";
import { useAppRefresh } from "../../contexts/RefreshContext";
import { Screen, Card, Badge, Button, Loading, Pagination } from "../../components/ui";
import { StudentStackParamList } from "../../navigation/StudentNavigator";
import { useTheme } from "../../contexts/ThemeContext";

type Nav = NativeStackNavigationProp<StudentStackParamList>;

export default function StudentExamsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { refreshKey } = useAppRefresh();

  useEffect(() => {
    Promise.all([api.getExams(), api.getMyExamAttempts()])
      .then(([e, a]) => {
        setExams(Array.isArray(e) ? e : e.exams);
        setAttempts(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const paged = paginateSlice(exams, page);

  const getAttemptForExam = (examId: string) =>
    attempts.find((a) => {
      const examRef = typeof a.exam === "object" ? a.exam._id : a.exam;
      return examRef === examId && a.status === "evaluated";
    });

  if (loading) return <Screen title="Exam Portal"><Loading full /></Screen>;

  return (
    <Screen title="Exam Portal">
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>Available Exams</Text>
      {exams.length ? paged.items.map((e) => {
        const attempt = getAttemptForExam(e._id);
        return (
          <Card key={e._id}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>{e.title}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Badge label={e.type} />
              <Badge label={e.questionType} variant="primary" />
            </View>
            <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>
              {e.duration} min · {e.totalMarks} marks · {formatDateTime(e.scheduledAt)}
            </Text>

            {attempt ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <Text style={{ color: "#16a34a", fontSize: 13 }}>Score: {attempt.score}/{e.totalMarks}</Text>
                </View>
                <Button
                  label="View Results"
                  small
                  variant="outline"
                  onPress={() => navigation.navigate("StudentExamResults", { examId: e._id })}
                />
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <Button
                  label="Start Exam"
                  small
                  onPress={() => navigation.navigate("StudentExamTake", { examId: e._id })}
                />
              </View>
            )}
          </Card>
        );
      }) : (
        <Text style={{ color: colors.muted }}>No exams available</Text>
      )}
      {exams.length > 0 && <Pagination page={paged.page} pages={paged.pages} onPageChange={setPage} />}

      {attempts.filter((a) => a.status === "evaluated").length > 0 && (
        <>
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginTop: 8 }}>Past Attempts</Text>
          {attempts.filter((a) => a.status === "evaluated").map((a) => {
            const exam = typeof a.exam === "object" ? a.exam : null;
            return (
              <Card key={a._id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: "600" }}>{exam?.title || "Exam"}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {a.submittedAt ? formatDateTime(a.submittedAt) : "—"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: colors.accent, fontWeight: "700" }}>{a.score} marks</Text>
                    {exam && (
                      <Button
                        label="Details"
                        small
                        variant="outline"
                        onPress={() => navigation.navigate("StudentExamResults", { examId: exam._id })}
                      />
                    )}
                  </View>
                </View>
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}