import { useCallback, useEffect, useState } from "react";
import { Text, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Screen, Card, Button, PillGroup } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppRefresh } from "../../contexts/RefreshContext";

type Student = { user: { _id: string; name: string } };

export default function TeacherAttendanceScreen() {
  const { colors } = useTheme();
  const { refreshKey } = useAppRefresh();
  const [students, setStudents] = useState<Student[]>([]);
  const [batchId, setBatchId] = useState("");
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [markedCount, setMarkedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMarkList = useCallback(async (bid?: string) => {
    setLoading(true);
    try {
      const data = await api.getAttendanceMarkList(bid);
      const studs = (data.students as Student[]) || [];
      setStudents(studs);
      setMarkedCount((data.markedCount as number) ?? 0);
      setTotalStudents((data.totalStudents as number) ?? 0);
      const init: Record<string, string> = {};
      studs.forEach((s) => { init[s.user._id] = "present"; });
      setStatuses(init);
    } catch {
      Alert.alert("Error", "Failed to load attendance list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.teacherDashboard().then((d) => {
      const batches = (d.batches as { _id: string }[]) || [];
      const bid = batches[0]?._id || "";
      setBatchId(bid);
      loadMarkList(bid);
    }).catch(() => setLoading(false));
  }, [loadMarkList, refreshKey]);

  const save = async () => {
    if (!batchId || students.length === 0) return;
    setSaving(true);
    try {
      await api.markBulkAttendance({
        batchId,
        date: new Date().toISOString(),
        records: students.map((s) => ({ studentId: s.user._id, status: statuses[s.user._id] || "present" })),
      });
      Alert.alert("Saved", `Attendance recorded for ${students.length} student(s)`);
      await loadMarkList(batchId);
    } catch {
      Alert.alert("Error", "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = ["present", "absent", "late", "leave"].map((s) => ({ id: s, label: s }));

  return (
    <Screen title="Mark Attendance" action={<Button label={saving ? "Saving..." : "Save"} onPress={save} small disabled={saving || students.length === 0} />}>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
        Marked students won&apos;t appear until tomorrow
      </Text>

      <Card style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Pending</Text>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>{students.length}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Marked today</Text>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>{markedCount}/{totalStudents}</Text>
        </View>
      </Card>

      {loading ? (
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 24 }}>Loading...</Text>
      ) : students.length === 0 ? (
        <Card style={{ alignItems: "center", paddingVertical: 32 }}>
          <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
          <Text style={{ color: colors.text, fontWeight: "600", marginTop: 12 }}>All done for today!</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4, textAlign: "center" }}>
            Students will reappear tomorrow for marking
          </Text>
        </Card>
      ) : (
        students.map((s) => (
          <Card key={s.user._id}>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>{s.user.name}</Text>
            <PillGroup
              options={statusOptions}
              value={statuses[s.user._id] || "present"}
              onChange={(v) => setStatuses((prev) => ({ ...prev, [s.user._id]: v }))}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}