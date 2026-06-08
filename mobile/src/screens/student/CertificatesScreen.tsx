import { useEffect, useState } from "react";
import { Text, View, Pressable, ScrollView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { Screen, Card, Input, Button, AppModal, PillGroup } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { StudentStackParamList } from "../../navigation/StudentNavigator";

type Program = {
  _id: string;
  title: string;
  description?: string;
  pdfUrl?: string;
  youtubeUrl?: string;
  questionsPerExam: number;
  passingPercent: number;
  hasCertificate?: boolean;
  latestAttempt?: { percentage: number; passed: boolean };
};

type Cert = {
  _id: string;
  certificateId: string;
  type: string;
  title?: string;
  program?: { _id: string; title: string };
  issuedAt: string;
  percentage?: number;
  score?: number;
};

type ExamQ = { questionIndex: number; question: string; options: string[] };

export default function StudentCertificatesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const [tab, setTab] = useState("earn");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [selected, setSelected] = useState<Program | null>(null);
  const [modal, setModal] = useState(false);
  const [examModal, setExamModal] = useState(false);
  const [exam, setExam] = useState<{ attemptId: string; questions: ExamQ[]; passingPercent: number } | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ passed: boolean; percentage: number; passingPercent: number; certificate?: Cert } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyId, setVerifyId] = useState("");
  const [verified, setVerified] = useState<Record<string, unknown> | null>(null);

  const load = () => {
    api.getCertificationPrograms().then((d) => setPrograms(d as Program[])).catch(() => {});
    api.getCertificates().then((d) => setCerts(d as Cert[])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openProgram = async (p: Program) => {
    const full = await api.getCertificationProgram(p._id) as Program;
    setSelected(full);
    setResult(null);
    setModal(true);
  };

  const startExam = async () => {
    if (!selected) return;
    try {
      const data = await api.startCertificationExam(selected._id) as { attemptId: string; questions: ExamQ[]; passingPercent: number };
      setExam(data);
      setAnswers({});
      setModal(false);
      setExamModal(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cannot start");
    }
  };

  const submit = async () => {
    if (!selected || !exam) return;
    setSubmitting(true);
    try {
      const res = await api.submitCertificationExam(
        selected._id,
        exam.attemptId,
        exam.questions.map((q) => ({ questionIndex: q.questionIndex, answer: answers[q.questionIndex] || "" }))
      ) as { passed: boolean; percentage: number; passingPercent: number; certificate?: Cert };
      setResult(res);
      setExamModal(false);
      setModal(true);
      if (res.passed) load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const ytId = (url?: string) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([^&\s?]+)/);
    return m?.[1];
  };

  return (
    <Screen title="Certificates">
      <PillGroup
        options={[
          { id: "earn", label: "Earn Certificate" },
          { id: "mine", label: `My Certs (${certs.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "earn" ? (
        programs.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>No programs available yet</Text>
        ) : (
          programs.map((p) => {
            const earned = certs.some((c) => c.program?._id === p._id);
            return (
              <Pressable key={p._id} onPress={() => openProgram(p)}>
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name="ribbon" size={28} color="#d97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{p.title}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>Pass {p.passingPercent}% · {p.questionsPerExam} questions</Text>
                      {earned && <Text style={{ color: "#16a34a", fontSize: 11, marginTop: 4 }}>✓ Earned</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </View>
                </Card>
              </Pressable>
            );
          })
        )
      ) : (
        certs.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>No certificates yet</Text>
        ) : (
          certs.map((c) => (
            <Card key={c._id} style={{ borderWidth: 2, borderColor: "#fbbf24" }}>
              <Ionicons name="ribbon" size={22} color="#d97706" />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 8 }}>{c.program?.title || c.title}</Text>
              <Text style={{ color: colors.muted }}>{formatDate(c.issuedAt)} · {c.percentage ?? c.score}%</Text>
              <Text style={{ color: colors.muted, fontFamily: "monospace", fontSize: 11, marginTop: 4 }}>{c.certificateId}</Text>
              <View style={{ marginTop: 10 }}>
                <Button
                  label="View & Download"
                  small
                  onPress={() => navigation.navigate("CertificateView", { certificateId: c.certificateId })}
                />
              </View>
            </Card>
          ))
        )
      )}

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600" }}>Verify Certificate</Text>
        <Input value={verifyId} onChangeText={setVerifyId} placeholder="LKC-..." />
        <Button label="Verify" onPress={async () => {
          try {
            setVerified(await api.verifyCertificate(verifyId) as Record<string, unknown>);
          } catch { setVerified(null); }
        }} />
        {verified && (
          <Text style={{ color: "#16a34a", marginTop: 8 }}>
            Valid — {(verified.student as { name: string })?.name}
          </Text>
        )}
      </Card>

      <AppModal visible={modal} title={selected?.title || "Program"} onClose={() => { setModal(false); setResult(null); }}>
        {result ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Ionicons name={result.passed ? "checkmark-circle" : "close-circle"} size={56} color={result.passed ? "#16a34a" : "#ef4444"} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
              {result.passed ? "Congratulations!" : "Try Again"}
            </Text>
            <Text style={{ color: colors.muted }}>Score: {result.percentage}% (need {result.passingPercent}%)</Text>
            {result.passed && result.certificate && (
              <Button label="View Certificate" onPress={() => {
                setModal(false);
                navigation.navigate("CertificateView", { certificateId: result.certificate!.certificateId });
              }} />
            )}
            {!result.passed && <Button label="Retry Assessment" onPress={() => { setResult(null); startExam(); }} />}
          </View>
        ) : selected ? (
          <ScrollView style={{ maxHeight: 400 }}>
            {selected.description ? <Text style={{ color: colors.muted, marginBottom: 12 }}>{selected.description}</Text> : null}
            {selected.hasCertificate && <Text style={{ color: "#16a34a", marginBottom: 12 }}>✓ Already earned</Text>}
            {selected.youtubeUrl && ytId(selected.youtubeUrl) && (
              <Pressable onPress={() => Linking.openURL(selected.youtubeUrl!)} style={{ marginBottom: 12 }}>
                <Card style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="logo-youtube" size={24} color="#ef4444" />
                  <Text style={{ color: colors.text }}>Watch Course Video</Text>
                </Card>
              </Pressable>
            )}
            {selected.pdfUrl && (
              <Pressable onPress={() => Linking.openURL(selected.pdfUrl!)} style={{ marginBottom: 12 }}>
                <Card style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="document-text" size={24} color={colors.accent} />
                  <Text style={{ color: colors.text }}>Open Course PDF</Text>
                </Card>
              </Pressable>
            )}
            {!selected.hasCertificate && (
              <Button label="Start Assessment" onPress={startExam} />
            )}
          </ScrollView>
        ) : null}
      </AppModal>

      <AppModal visible={examModal} title="Assessment" onClose={() => setExamModal(false)}>
        <ScrollView style={{ maxHeight: 420 }}>
          {exam?.questions.map((q, i) => (
            <View key={q.questionIndex} style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>{i + 1}. {q.question}</Text>
              {q.options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setAnswers((a) => ({ ...a, [q.questionIndex]: opt }))}
                  style={{
                    padding: 10,
                    marginBottom: 6,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: answers[q.questionIndex] === opt ? colors.accent : colors.border,
                    backgroundColor: answers[q.questionIndex] === opt ? colors.primaryLight : "transparent",
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 14 }}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          ))}
          <Button label={submitting ? "Submitting..." : "Submit"} onPress={submit} disabled={submitting} />
        </ScrollView>
      </AppModal>
    </Screen>
  );
}