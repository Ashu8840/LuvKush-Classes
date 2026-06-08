import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api } from "../../lib/api";
import { Screen, StatCard, Card } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

export default function TeacherDashboardScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    api.teacherDashboard().then(setData).catch(() => {});
  }, []);

  const batches = (data.batches as { name: string; timing: string }[]) || [];
  const students = (data.students as { user?: { name: string }; performanceScore?: number; attendancePercent?: number }[]) || [];

  return (
    <Screen>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <StatCard title="Batches" value={batches.length} />
        <StatCard title="Students" value={students.length} />
      </View>
      <Card style={{ backgroundColor: colors.primaryLight }}>
        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>Start Live Class</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>Camera, microphone, chat & screen sharing ready</Text>
      </Card>
      <Card>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 12 }}>My Batches</Text>
        {batches.map((b, i) => (
          <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.text, fontWeight: "500" }}>{b.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{b.timing}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 12 }}>Student Progress</Text>
        {students.map((s, i) => (
          <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.text }}>{s.user?.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Score: {s.performanceScore ?? 0} · Attendance: {s.attendancePercent ?? 0}%</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}