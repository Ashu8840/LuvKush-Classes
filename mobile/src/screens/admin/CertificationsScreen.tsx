import { useEffect, useState } from "react";
import { Text, View, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Screen, Card, Button, Input, AppModal } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";

type Program = {
  _id: string;
  title: string;
  description?: string;
  pdfUrl?: string;
  youtubeUrl?: string;
  questionsPerExam: number;
  passingPercent: number;
  isActive: boolean;
  questions?: { question: string; options: string[]; correctAnswer: string }[];
};

const emptyQ = () => ({ question: "", options: ["", "", "", ""], correctAnswer: "" });

export default function AdminCertificationsScreen() {
  const { colors } = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    pdfUrl: "",
    youtubeUrl: "",
    questionsPerExam: "10",
    passingPercent: "65",
    isActive: true,
    questions: [emptyQ()],
  });

  const load = () => api.getCertificationPrograms().then((d) => setPrograms(d as Program[])).catch(() => {});

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", pdfUrl: "", youtubeUrl: "", questionsPerExam: "10", passingPercent: "65", isActive: true, questions: [emptyQ()] });
    setModal(true);
  };

  const openEdit = (p: Program) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description || "",
      pdfUrl: p.pdfUrl || "",
      youtubeUrl: p.youtubeUrl || "",
      questionsPerExam: String(p.questionsPerExam),
      passingPercent: String(p.passingPercent),
      isActive: p.isActive,
      questions: p.questions?.length ? p.questions : [emptyQ()],
    });
    setModal(true);
  };

  const save = async () => {
    const questions = form.questions
      .filter((q) => q.question.trim())
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.filter((o) => o.trim()),
        correctAnswer: q.correctAnswer.trim(),
      }));
    if (!form.title.trim() || !questions.length) return Alert.alert("Error", "Title and at least one question required");

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        pdfUrl: form.pdfUrl,
        youtubeUrl: form.youtubeUrl,
        questionsPerExam: parseInt(form.questionsPerExam) || 10,
        passingPercent: parseInt(form.passingPercent) || 65,
        isActive: form.isActive,
        questions,
      };
      if (editing) await api.updateCertificationProgram(editing._id, payload);
      else await api.createCertificationProgram(payload);
      setModal(false);
      load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert("Delete?", "Remove this certification program?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => api.deleteCertificationProgram(id).then(load) },
    ]);
  };

  return (
    <Screen title="Certifications" action={<Button label="New" onPress={openNew} small />}>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
        PDF + YouTube + Q&A — students need 65%+ to earn certificate
      </Text>
      {programs.map((p) => (
        <Card key={p._id}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Ionicons name="ribbon" size={22} color="#d97706" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{p.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {p.questions?.length || 0} Qs · {p.questionsPerExam}/exam · Pass {p.passingPercent}%
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <Button label="Edit" small variant="outline" onPress={() => openEdit(p)} />
            <Button label="Delete" small variant="danger" onPress={() => remove(p._id)} />
          </View>
        </Card>
      ))}

      <AppModal visible={modal} title={editing ? "Edit Program" : "New Program"} onClose={() => setModal(false)}>
        <ScrollView style={{ maxHeight: 440 }}>
          <Input label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          <Input label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
          <Input label="PDF URL" value={form.pdfUrl} onChangeText={(v) => setForm({ ...form, pdfUrl: v })} />
          <Input label="YouTube URL" value={form.youtubeUrl} onChangeText={(v) => setForm({ ...form, youtubeUrl: v })} />
          <Input label="Questions per exam" value={form.questionsPerExam} onChangeText={(v) => setForm({ ...form, questionsPerExam: v })} keyboardType="numeric" />
          <Input label="Passing %" value={form.passingPercent} onChangeText={(v) => setForm({ ...form, passingPercent: v })} keyboardType="numeric" />

          <Text style={{ color: colors.text, fontWeight: "600", marginVertical: 8 }}>Questions</Text>
          {form.questions.map((q, qi) => (
            <View key={qi} style={{ marginBottom: 12, padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>
              <Input label={`Q${qi + 1}`} value={q.question} onChangeText={(v) => {
                const questions = [...form.questions];
                questions[qi] = { ...questions[qi], question: v };
                setForm({ ...form, questions });
              }} />
              {q.options.map((opt, oi) => (
                <Input key={oi} label={`Opt ${oi + 1}`} value={opt} onChangeText={(v) => {
                  const questions = [...form.questions];
                  const options = [...questions[qi].options];
                  options[oi] = v;
                  questions[qi] = { ...questions[qi], options };
                  setForm({ ...form, questions });
                }} />
              ))}
              <Input label="Correct answer" value={q.correctAnswer} onChangeText={(v) => {
                const questions = [...form.questions];
                questions[qi] = { ...questions[qi], correctAnswer: v };
                setForm({ ...form, questions });
              }} />
            </View>
          ))}
          <Button label="+ Add Question" variant="outline" small onPress={() => setForm({ ...form, questions: [...form.questions, emptyQ()] })} />
          <View style={{ marginTop: 12 }}>
            <Button label={saving ? "Saving..." : "Save Program"} onPress={save} disabled={saving} />
          </View>
        </ScrollView>
      </AppModal>
    </Screen>
  );
}