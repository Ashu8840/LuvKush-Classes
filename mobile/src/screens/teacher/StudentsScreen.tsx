import { useEffect, useState } from "react";
import {
  Text, View, Image, Pressable, ScrollView, Modal, ActivityIndicator, StyleSheet,
} from "react-native";
import { api } from "../../lib/api";
import { paginateSlice } from "../../lib/paginate";
import { useAppRefresh } from "../../contexts/RefreshContext";
import { Screen, Card, Pagination } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDateTime } from "../../lib/utils";

type Student = {
  _id?: string;
  user?: { _id: string; name: string; email: string; avatar?: string };
  batch?: { name: string };
  course?: { name: string };
  performanceScore?: number;
  attendancePercent?: number;
};

type ReportData = {
  profile?: Student;
  exams?: {
    attemptId: string;
    exam?: { title: string; type: string; questionType: string; totalMarks?: number };
    score: number;
    wpm?: number;
    accuracy?: number;
    percentage?: number;
    submittedAt?: string;
    analysis?: string;
  }[];
  shorthand?: { totalAttempts: number; avgWpm: number; avgAccuracy: number };
  typing?: { totalSessions: number; avgWpm: number; avgAccuracy: number };
  attendance?: { summary: { percent: number; present: number; absent: number; late: number; leave: number } };
};

function Avatar({ name, url, size = 72 }: { name: string; url?: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, borderColor: colors.card, backgroundColor: colors.primaryLight }]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ color: colors.accent, fontWeight: "800", fontSize: size * 0.28 }}>{initials}</Text>
      )}
    </View>
  );
}

export default function TeacherStudentsScreen() {
  const { colors } = useTheme();
  const { refreshKey } = useAppRefresh();
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Student | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    api.teacherDashboard().then((d) => setStudents((d.students as Student[]) || [])).catch(() => {});
  }, [refreshKey]);

  const openReport = async (student: Student) => {
    const id = student.user?._id;
    if (!id) return;
    setSelected(student);
    setLoadingReport(true);
    try {
      const data = await api.getStudentReport(id);
      setReport(data as ReportData);
    } catch {
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const paged = paginateSlice(students, page);

  return (
    <Screen title="My Students">
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
        Tap a card to view the student report card
      </Text>

      <View style={styles.grid}>
        {paged.items.map((s, i) => (
          <Pressable key={s.user?._id || i} onPress={() => openReport(s)} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
            <Card style={{ ...styles.idCard, borderColor: colors.border }}>
              <View style={[styles.idHeader, { backgroundColor: colors.primaryLight }]}>
                <Avatar name={s.user?.name || "?"} url={s.user?.avatar} />
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, marginTop: 10, textAlign: "center" }}>
                  {s.user?.name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center" }}>{s.user?.email}</Text>
              </View>
              <View style={styles.idBody}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Batch: <Text style={{ color: colors.text, fontWeight: "600" }}>{s.batch?.name || "—"}</Text></Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Course: <Text style={{ color: colors.text, fontWeight: "600" }}>{s.course?.name || "—"}</Text></Text>
                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                    <Text style={{ color: colors.muted, fontSize: 10 }}>Score</Text>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{s.performanceScore ?? 0}</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                    <Text style={{ color: colors.muted, fontSize: 10 }}>Attendance</Text>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{s.attendancePercent ?? 0}%</Text>
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Pagination page={paged.page} pages={paged.pages} onPageChange={setPage} />

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => { setSelected(null); setReport(null); }}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>
              Report — {selected?.user?.name}
            </Text>
            <Pressable onPress={() => { setSelected(null); setReport(null); }}>
              <Text style={{ color: colors.accent, fontWeight: "600" }}>Close</Text>
            </Pressable>
          </View>
          {loadingReport ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
              {report && (
                <>
                  <View style={styles.reportStats}>
                    {[
                      { l: "Performance", v: report.profile?.performanceScore ?? 0 },
                      { l: "Attendance", v: `${report.attendance?.summary?.percent ?? 0}%` },
                      { l: "Exams", v: report.exams?.length ?? 0 },
                      { l: "Shorthand", v: `${report.shorthand?.avgAccuracy ?? 0}%` },
                    ].map((x) => (
                      <View key={x.l} style={[styles.reportStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={{ color: colors.muted, fontSize: 10 }}>{x.l}</Text>
                        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{x.v}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>Examination Results</Text>
                  {(report.exams?.length ?? 0) === 0 ? (
                    <Text style={{ color: colors.muted }}>No evaluated exams yet</Text>
                  ) : (
                    report.exams?.map((e) => (
                      <Card key={e.attemptId}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: "600" }}>{e.exam?.title}</Text>
                            <Text style={{ color: colors.muted, fontSize: 11, textTransform: "capitalize" }}>
                              {e.exam?.type} · {e.exam?.questionType}
                            </Text>
                            {e.submittedAt && <Text style={{ color: colors.muted, fontSize: 11 }}>{formatDateTime(e.submittedAt)}</Text>}
                          </View>
                          <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 18 }}>
                            {e.score}{e.exam?.totalMarks ? `/${e.exam.totalMarks}` : ""}
                          </Text>
                        </View>
                        {e.analysis ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{e.analysis}</Text> : null}
                      </Card>
                    ))
                  )}

                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15, marginTop: 8 }}>Shorthand & Typing</Text>
                  <Card>
                    <Text style={{ color: colors.text }}>Shorthand: {report.shorthand?.totalAttempts ?? 0} attempts · {report.shorthand?.avgWpm ?? 0} WPM · {report.shorthand?.avgAccuracy ?? 0}%</Text>
                    <Text style={{ color: colors.text, marginTop: 6 }}>Typing: {report.typing?.totalSessions ?? 0} sessions · {report.typing?.avgWpm ?? 0} WPM · {report.typing?.avgAccuracy ?? 0}%</Text>
                  </Card>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  idCard: { overflow: "hidden", padding: 0 },
  idHeader: { alignItems: "center", paddingVertical: 20, paddingHorizontal: 12 },
  avatar: { borderWidth: 3, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  idBody: { padding: 14 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  statBox: { flex: 1, borderRadius: 10, padding: 8, alignItems: "center" },
  modal: { flex: 1, marginTop: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  reportStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reportStat: { flex: 1, minWidth: "40%", borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
});