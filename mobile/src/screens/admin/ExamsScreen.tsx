import { useEffect, useState } from "react";
import { Text, View, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, ExamQuestion, ExamEvaluationRoster, Pagination as PaginationMeta } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { formatDateTime } from "../../lib/utils";
import { Screen, Card, Badge, Button, Input, AppModal, StatCard, Pagination } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";

type Exam = {
  _id: string;
  title: string;
  type: string;
  questionType: string;
  scheduledAt: string;
  duration: number;
  totalMarks: number;
  questions?: ExamQuestion[];
  isPublished?: boolean;
  isTimed?: boolean;
  batch?: { _id: string; name: string };
  course?: { _id: string; name: string };
};

const EXAM_TYPES = [
  { id: "mock", label: "Mock" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "final", label: "Final" },
];

const QUESTION_TYPES = [
  { id: "mcq", label: "MCQ" },
  { id: "typing", label: "Typing" },
  { id: "shorthand", label: "Shorthand" },
];

const emptyQuestion = (): ExamQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 1,
});

type Batch = { _id: string; name: string };
type Course = { _id: string; name: string };

const emptyForm = () => ({
  title: "",
  type: "weekly",
  questionType: "mcq",
  scheduledAt: "",
  duration: "60",
  isPublished: true,
  isTimed: true,
  course: "",
  batch: "",
  questions: [emptyQuestion()],
});

export default function AdminExamsScreen() {
  const { colors } = useTheme();
  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [evaluateList, setEvaluateList] = useState(false);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [evalExam, setEvalExam] = useState<Exam | null>(null);
  const [roster, setRoster] = useState<ExamEvaluationRoster[]>([]);
  const [evalStats, setEvalStats] = useState({ total: 0, present: 0, absent: 0, inProgress: 0 });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [aiDifficulty, setAiDifficulty] = useState("intermediate");
  const [aiLoading, setAiLoading] = useState(false);

  const loadExams = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    api.getExams(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setExams(data as Exam[]);
        setPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setExams(data.exams as Exam[]);
        setPagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load exams"));
  };

  useEffect(() => { loadExams(page); }, [page]);
  useEffect(() => {
    api.getBatches().then((d) => setBatches((Array.isArray(d) ? d : d.batches) as Batch[])).catch(() => {});
    api.getCourses().then((d) => setCourses((Array.isArray(d) ? d : d.courses) as Course[])).catch(() => {});
  }, []);

  const generateWithGroq = async () => {
    if (!aiTopic.trim()) {
      toast.error("Enter a topic for AI question generation");
      return;
    }
    setAiLoading(true);
    try {
      const courseName = courses.find((c) => c._id === form.course)?.name;
      const res = await api.generateExamQuestions({
        topic: aiTopic.trim(),
        count: Number(aiCount) || 5,
        questionType: form.questionType as "mcq" | "typing" | "shorthand",
        difficulty: aiDifficulty,
        courseName,
      });
      const generated = res.questions.map((q) => ({
        ...q,
        options: q.options || (form.questionType === "mcq" ? ["", "", "", ""] : undefined),
      }));
      setForm((f) => ({
        ...f,
        questions: f.questions.length === 1 && !f.questions[0].question
          ? generated
          : [...f.questions, ...generated],
      }));
      toast.success(`Generated ${generated.length} questions with Groq AI`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setModal(true);
  };

  const openEdit = (exam: Exam) => {
    setEditId(exam._id);
    setForm({
      title: exam.title,
      type: exam.type,
      questionType: exam.questionType,
      scheduledAt: exam.scheduledAt ? new Date(exam.scheduledAt).toISOString().slice(0, 16) : "",
      duration: String(exam.duration),
      isPublished: exam.isPublished ?? true,
      isTimed: exam.isTimed !== false,
      course: exam.course?._id || "",
      batch: exam.batch?._id || "",
      questions: exam.questions?.length
        ? exam.questions.map((q) => ({ ...q, options: q.options || ["", "", "", ""] }))
        : [emptyQuestion()],
    });
    setModal(true);
  };

  const removeExam = (exam: Exam) => {
    Alert.alert(
      "Delete exam?",
      `Delete "${exam.title}"?\n\nThis will permanently delete the exam and all student attempts.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteExam(exam._id);
              loadExams(page);
              toast.success("Exam deleted");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to delete exam");
            }
          },
        },
      ]
    );
  };

  const openEvaluation = async (exam: Exam) => {
    try {
      const data = await api.getExamEvaluation(exam._id);
      setEvalExam(data.exam);
      setRoster(data.roster);
      setEvalStats(data.stats);
      setShowEvaluate(true);
      setEvaluateList(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load evaluation");
    }
  };

  const addQuestion = () => {
    setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
  };

  const removeQuestion = (index: number) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index: number, field: keyof ExamQuestion, value: string | number | string[]) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.scheduledAt) {
      toast.error("Title and scheduled date/time are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        questionType: form.questionType,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: Number(form.duration) || 60,
        isPublished: form.isPublished,
        isTimed: form.isTimed,
        course: form.course || undefined,
        batch: form.batch || undefined,
        totalMarks: form.questions.reduce((s, q) => s + (q.marks || 1), 0),
        questions: form.questions.map((q) => {
          if (form.questionType === "mcq") return q;
          return { ...q, options: undefined };
        }),
      };
      if (editId) {
        await api.updateExam(editId, payload);
        toast.success("Exam updated");
      } else {
        await api.createExam(payload);
        toast.success("Exam created successfully");
      }
      setModal(false);
      setForm(emptyForm());
      setEditId(null);
      loadExams(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save exam");
    } finally {
      setLoading(false);
    }
  };

  const rosterBadgeVariant = (status: string): "success" | "warning" | "danger" | "primary" => {
    if (status === "present") return "success";
    if (status === "in_progress") return "warning";
    if (status === "absent") return "danger";
    return "primary";
  };

  return (
    <Screen
      title="Examinations"
      action={
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button label="Evaluate" onPress={() => setEvaluateList(true)} small variant="outline" />
          <Button label="Create Exam" onPress={openCreate} small />
        </View>
      }
    >
      {exams.map((e) => (
        <Card key={e._id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Badge label={e.type} />
                <Badge label={e.questionType} variant="primary" />
                {e.isPublished && <Badge label="Published" variant="success" />}
                {e.isTimed !== false && <Badge label="Timed" variant="warning" />}
              </View>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginTop: 8 }}>{e.title}</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                {e.questionType} · {e.totalMarks} marks · {e.duration} min
              </Text>
              <Text style={{ color: colors.text, marginTop: 4 }}>{formatDateTime(e.scheduledAt)}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                {e.questions?.length || 0} questions
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable onPress={() => openEvaluation(e)} hitSlop={8}>
                <Ionicons name="clipboard-outline" size={18} color={colors.accent} />
              </Pressable>
              <Pressable onPress={() => openEdit(e)} hitSlop={8}>
                <Ionicons name="pencil-outline" size={18} color={colors.text} />
              </Pressable>
              <Pressable onPress={() => removeExam(e)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </View>
          </View>
        </Card>
      ))}
      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <AppModal visible={modal} title={editId ? "Edit Exam" : "Create Timed Exam"} onClose={() => { setModal(false); setEditId(null); }}>
        <Input label="Exam Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <SelectDropdown
          label="Exam Type"
          value={form.type}
          options={EXAM_TYPES}
          onChange={(v) => setForm({ ...form, type: v })}
        />
        <SelectDropdown
          label="Question Type"
          value={form.questionType}
          options={QUESTION_TYPES}
          onChange={(v) => setForm({ ...form, questionType: v })}
        />
        <SelectDropdown
          label="Course (optional)"
          value={form.course}
          options={[{ id: "", label: "— All courses —" }, ...courses.map((c) => ({ id: c._id, label: c.name }))]}
          onChange={(v) => setForm({ ...form, course: v })}
        />
        <SelectDropdown
          label="Batch (optional)"
          value={form.batch}
          options={[{ id: "", label: "— All batches —" }, ...batches.map((b) => ({ id: b._id, label: b.name }))]}
          onChange={(v) => setForm({ ...form, batch: v })}
        />
        <Input
          label="Scheduled At (YYYY-MM-DDTHH:MM)"
          value={form.scheduledAt}
          onChangeText={(v) => setForm({ ...form, scheduledAt: v })}
          placeholder="2026-06-08T10:00"
        />
        <Input
          label="Duration (minutes)"
          value={form.duration}
          onChangeText={(v) => setForm({ ...form, duration: v })}
          keyboardType="numeric"
        />
        <Pressable
          onPress={() => setForm({ ...form, isPublished: !form.isPublished })}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: form.isPublished ? colors.primary : colors.border,
              backgroundColor: form.isPublished ? colors.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {form.isPublished && <Text style={{ color: colors.primaryText, fontSize: 14, fontWeight: "700" }}>✓</Text>}
          </View>
          <Text style={{ color: colors.text }}>Publish immediately</Text>
        </Pressable>
        <Pressable
          onPress={() => setForm({ ...form, isTimed: !form.isTimed })}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: form.isTimed ? colors.primary : colors.border,
              backgroundColor: form.isTimed ? colors.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {form.isTimed && <Text style={{ color: colors.primaryText, fontSize: 14, fontWeight: "700" }}>✓</Text>}
          </View>
          <Text style={{ color: colors.text }}>Timed exam — auto-closes after duration</Text>
        </Pressable>

        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.accent,
            backgroundColor: colors.primaryLight,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 14 }}>✨ Generate with Groq AI</Text>
          <Input
            value={aiTopic}
            onChangeText={setAiTopic}
            placeholder="Topic e.g. Pitman shorthand, 80 WPM typing passage"
          />
          <SelectDropdown
            label="Question count"
            value={aiCount}
            options={[
              { id: "3", label: "3 questions" },
              { id: "5", label: "5 questions" },
              { id: "8", label: "8 questions" },
              { id: "10", label: "10 questions" },
            ]}
            onChange={setAiCount}
          />
          <SelectDropdown
            label="Difficulty"
            value={aiDifficulty}
            options={[
              { id: "beginner", label: "Beginner" },
              { id: "intermediate", label: "Intermediate" },
              { id: "advanced", label: "Advanced" },
            ]}
            onChange={setAiDifficulty}
          />
          <Button
            label={aiLoading ? "Generating..." : "Generate Questions"}
            onPress={generateWithGroq}
            disabled={aiLoading}
            small
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Questions ({form.questions.length})</Text>
          <Button label="+ Add" small variant="outline" onPress={addQuestion} />
        </View>

        {form.questions.map((q, qi) => (
          <View
            key={qi}
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>Q{qi + 1}</Text>
              {form.questions.length > 1 && (
                <Pressable onPress={() => removeQuestion(qi)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              )}
            </View>
            <Input
              label="Question / Passage"
              value={q.question}
              onChangeText={(v) => updateQuestion(qi, "question", v)}
            />
            {form.questionType === "mcq" ? (
              <>
                {q.options?.map((opt, oi) => (
                  <Input
                    key={oi}
                    label={`Option ${oi + 1}`}
                    value={opt}
                    onChangeText={(v) => {
                      const opts = [...(q.options || [])];
                      opts[oi] = v;
                      updateQuestion(qi, "options", opts);
                    }}
                  />
                ))}
                <Input
                  label="Correct Answer"
                  value={q.correctAnswer || ""}
                  onChangeText={(v) => updateQuestion(qi, "correctAnswer", v)}
                />
              </>
            ) : (
              <Input
                label="Expected Typed Text"
                value={q.correctAnswer || ""}
                onChangeText={(v) => updateQuestion(qi, "correctAnswer", v)}
              />
            )}
            <Input
              label="Marks"
              value={String(q.marks ?? 1)}
              onChangeText={(v) => updateQuestion(qi, "marks", Number(v) || 1)}
              keyboardType="numeric"
            />
          </View>
        ))}

        <Button
          label={loading ? (editId ? "Saving..." : "Creating...") : (editId ? "Save Changes" : "Create Exam")}
          onPress={submit}
          disabled={loading}
        />
      </AppModal>

      <AppModal visible={evaluateList} title="Evaluate Exams" onClose={() => setEvaluateList(false)}>
        {exams.map((exam) => (
          <Pressable
            key={exam._id}
            onPress={() => openEvaluation(exam)}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>{exam.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {formatDateTime(exam.scheduledAt)} · {exam.batch?.name || "All batches"}
              </Text>
            </View>
            <Ionicons name="clipboard-outline" size={18} color={colors.accent} />
          </Pressable>
        ))}
      </AppModal>

      <AppModal
        visible={showEvaluate}
        title={evalExam ? `Evaluate: ${evalExam.title}` : "Evaluation"}
        onClose={() => setShowEvaluate(false)}
      >
        {evalExam && (
          <>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <View style={{ flex: 1 }}><StatCard title="Total" value={evalStats.total} /></View>
              <View style={{ flex: 1 }}><StatCard title="Present" value={evalStats.present} /></View>
              <View style={{ flex: 1 }}><StatCard title="Absent" value={evalStats.absent} /></View>
              <View style={{ flex: 1 }}><StatCard title="In Progress" value={evalStats.inProgress} /></View>
            </View>

            {roster.map((r) => (
              <View
                key={r.student._id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "600" }}>{r.student.name}</Text>
                    {r.student.email ? <Text style={{ color: colors.muted, fontSize: 12 }}>{r.student.email}</Text> : null}
                  </View>
                  <Badge label={r.status.replace("_", " ")} variant={rosterBadgeVariant(r.status)} />
                </View>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>
                  Score: {r.score != null ? `${r.score}/${evalExam.totalMarks}` : "—"} · WPM: {r.wpm ?? "—"} · Rank: {r.rank ?? "—"}
                </Text>
              </View>
            ))}
          </>
        )}
      </AppModal>
    </Screen>
  );
}