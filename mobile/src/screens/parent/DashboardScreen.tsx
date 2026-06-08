import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api, ParentChild } from "../../lib/api";
import { formatCurrency, formatBadgeName } from "../../lib/utils";
import { Screen, StatCard, Card, Badge, Loading } from "../../components/ui";
import { ChildSelector } from "../../components/parent/ChildSelector";
import { useTheme } from "../../contexts/ThemeContext";

export default function ParentDashboardScreen() {
  const { colors } = useTheme();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getParentChildren().then((data) => {
      setChildren(data);
      if (data.length) setSelectedId(data[0].student._id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api.getChildDashboard(selectedId)
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const profile = dashboard?.profile as {
    course?: { name: string };
    batch?: { name: string };
    feesStatus?: string;
    totalFees?: number;
    paidFees?: number;
  } | undefined;
  const attendance = dashboard?.attendance as { percent?: number } | undefined;
  const gamification = dashboard?.gamification as { level?: number; streak?: number; badges?: string[] } | undefined;
  const student = dashboard?.student as { name?: string } | undefined;
  const examResults = (dashboard?.examResults as { exam?: { title: string }; score?: number }[]) || [];

  if (loading && !children.length) return <Loading full />;

  return (
    <Screen title="Parent Dashboard">
      <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Select Child</Text>
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? (
        <Loading />
      ) : dashboard ? (
        <>
          <Card style={{ backgroundColor: colors.primaryLight }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>{student?.name}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              {profile?.course?.name || "No course"} · Batch: {profile?.batch?.name || "—"}
            </Text>
          </Card>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <StatCard title="Attendance" value={`${attendance?.percent ?? 0}%`} />
            <StatCard title="Fees Status" value={profile?.feesStatus ?? "—"} />
            <StatCard title="Level" value={gamification?.level ?? 1} />
            <StatCard title="Streak" value={`${gamification?.streak ?? 0} days`} />
          </View>

          <Card>
            <Text style={{ color: colors.text, fontWeight: "600" }}>Fee Summary</Text>
            {profile?.totalFees ? (
              <Text style={{ color: colors.text, marginTop: 8, fontSize: 16 }}>
                {formatCurrency(profile.paidFees || 0)} / {formatCurrency(profile.totalFees)}
              </Text>
            ) : (
              <Text style={{ color: colors.muted, marginTop: 8 }}>No fee records</Text>
            )}
          </Card>

          <Card>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Achievements</Text>
            {gamification?.badges?.length ? (
              gamification.badges.map((b) => <Badge key={b} label={formatBadgeName(b)} />)
            ) : (
              <Text style={{ color: colors.muted }}>No badges yet</Text>
            )}
          </Card>

          <Card>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Recent Exam Results</Text>
            {examResults.length ? examResults.slice(0, 5).map((r, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ color: colors.text }}>{r.exam?.title}</Text>
                <Text style={{ color: colors.accent, fontWeight: "600" }}>{r.score} marks</Text>
              </View>
            )) : (
              <Text style={{ color: colors.muted }}>No exam results yet</Text>
            )}
          </Card>
        </>
      ) : (
        <Text style={{ color: colors.muted, textAlign: "center" }}>Unable to load dashboard data.</Text>
      )}
    </Screen>
  );
}