import { useEffect, useState, useCallback, useRef } from "react";
import { Text, TextInput, View, Pressable, Alert } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, Exam, ExamAttempt } from "../../lib/api";
import { AudioPlaybackButton } from "../../components/AudioPlaybackButton";
import { formatTime } from "../../lib/utils";
import { Screen, Card, Button, Loading } from "../../components/ui";
import { StudentStackParamList } from "../../navigation/StudentNavigator";
import { useTheme } from "../../contexts/ThemeContext";

type Route = RouteProp<StudentStackParamList, "StudentExamTake">;
type Nav = NativeStackNavigationProp<StudentStackParamList, "StudentExamTake">;

export default function ExamTakeScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { examId } = route.params;

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
      navigation.replace("StudentExamResults", { examId: exam._id });
    } catch (err) {
      submittedRef.current = false;
      Alert.alert("Error", err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  }, [exam, answers, submitting, navigation]);

  useEffect(() => {
    Promise.all([api.getExam(examId), api.startExam(examId)])
      .then(([e, a]) => {
        setExam(e);
        setAttempt(a);
        const started = new Date(a.startedAt).getTime();
        const durationMs = (e.duration || 60) * 60 * 1000;
        const remaining = Math.max(0, Math.floor((started + durationMs - Date.now()) / 1000));
        setTimeLeft(remaining || (e.duration || 60) * 60);
      })
      .catch((err) => {
        Alert.alert("Error", err instanceof Error ? err.message : "Failed to load exam");
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  }, [examId, navigation]);

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

  const updateAnswer = (value: string, field: "answer" | "typedText" = "answer") => {
    const duration = Math.round((Date.now() - questionStartRef.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [currentQ]: { ...prev[currentQ], [field]: value, durationSeconds: duration },
    }));
  };

  if (loading) return <Loading full />;
  if (!exam) return null;

  const question = exam.questions[currentQ];
  const isMcq = exam.questionType === "mcq" || (question?.options && question.options.length > 0);
  const isTyping = exam.questionType === "typing" || exam.questionType === "shorthand";

  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: colors.text, fontWeight: "700" }}>{exam.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Question {currentQ + 1} of {exam.questions.length}</Text>
          </View>
          <View style={{
            backgroundColor: timeLeft < 300 ? "#fef2f2" : colors.primaryLight,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}>
            <Text style={{ color: timeLeft < 300 ? "#dc2626" : colors.accent, fontWeight: "700", fontFamily: "monospace" }}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "500" }}>{question?.question}</Text>
        {question?.dictationAudio ? (
          <AudioPlaybackButton url={question.dictationAudio} />
        ) : null}

        {isMcq && question?.options ? (
          <View style={{ marginTop: 16, gap: 8 }}>
            {question.options.map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => updateAnswer(opt)}
                style={{
                  borderWidth: 1,
                  borderColor: answers[currentQ]?.answer === opt ? colors.primary : colors.border,
                  backgroundColor: answers[currentQ]?.answer === opt ? colors.primaryLight : colors.card,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <Text style={{ color: colors.text }}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <TextInput
            value={isTyping ? (answers[currentQ]?.typedText || "") : (answers[currentQ]?.answer || "")}
            onChangeText={(v) => updateAnswer(v, isTyping ? "typedText" : "answer")}
            placeholder="Type your answer here..."
            placeholderTextColor={colors.muted}
            multiline
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              minHeight: 120,
              marginTop: 16,
              color: colors.text,
              backgroundColor: colors.surface,
              textAlignVertical: "top",
            }}
          />
        )}
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {exam.questions.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setCurrentQ(i)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: i === currentQ ? colors.primary : answers[i] ? "#f0fdf4" : colors.surface,
            }}
          >
            <Text style={{ color: i === currentQ ? colors.primaryText : colors.text, fontSize: 12, fontWeight: "600" }}>
              {i + 1}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button label="Previous" variant="outline" disabled={currentQ === 0} onPress={() => setCurrentQ((q) => Math.max(0, q - 1))} />
        {currentQ < exam.questions.length - 1 ? (
          <Button label="Next" onPress={() => setCurrentQ((q) => q + 1)} />
        ) : (
          <Button label={submitting ? "Submitting..." : "Submit Exam"} disabled={submitting} onPress={handleSubmit} />
        )}
      </View>

      {attempt && (
        <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center" }}>
          Started at {new Date(attempt.startedAt).toLocaleTimeString()} · Auto-submit when timer ends
        </Text>
      )}
    </Screen>
  );
}

