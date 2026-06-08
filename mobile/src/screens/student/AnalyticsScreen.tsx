import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api, LeaderboardEntry } from "../../lib/api";
import { Screen, Card, StatCard, Loading } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

export default function StudentAnalyticsScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [heatmap, setHeatmap] = useState<{ practice: Record<string, number>; attendance: Record<string, string> } | null>(null);
  const [insights, setInsights] = useState("");
  const [batchComparison, setBatchComparison] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    Promise.all([
      api.getStudentAnalytics(30),
      api.getHeatmap(90),
      api.getAiInsights(),
      api.getLeaderboard({ period: "month", scope: "batch" }),
    ])
      .then(([a, h, i, lb]) => {
        setAnalytics(a);
        setHeatmap(h);
        setInsights(i.insights);
        setBatchComparison(lb);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const summary = analytics?.summary as {
    totalSessions?: number;
    avgWpm?: number;
    avgAccuracy?: number;
    totalXpEarned?: number;
  } | undefined;
  const profile = analytics?.profile as { xp?: number } | undefined;
  const graphs = analytics?.graphs as {
    wpmTrend?: { date: string; wpm: number }[];
    accuracyTrend?: { date: string; accuracy: number }[];
  } | undefined;

  if (loading) return <Screen title="Analytics"><Loading full /></Screen>;

  const practiceDays = heatmap ? Object.keys(heatmap.practice).length : 0;
  const recentWpm = graphs?.wpmTrend?.slice(-5) || [];
  const recentAcc = graphs?.accuracyTrend?.slice(-5) || [];

  return (
    <Screen title="Analytics">
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <StatCard title="Sessions (30d)" value={summary?.totalSessions ?? 0} />
        <StatCard title="Avg WPM" value={summary?.avgWpm ?? 0} />
        <StatCard title="Avg Accuracy" value={`${summary?.avgAccuracy ?? 0}%`} />
        <StatCard title="XP Earned" value={summary?.totalXpEarned ?? profile?.xp ?? 0} />
      </View>

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Speed Trend (Recent)</Text>
        {recentWpm.length ? recentWpm.map((d, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{new Date(d.date).toLocaleDateString("en-IN")}</Text>
            <Text style={{ color: colors.accent, fontWeight: "600" }}>{d.wpm} WPM</Text>
          </View>
        )) : <Text style={{ color: colors.muted }}>No speed data yet</Text>}
      </Card>

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Accuracy Trend (Recent)</Text>
        {recentAcc.length ? recentAcc.map((d, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{new Date(d.date).toLocaleDateString("en-IN")}</Text>
            <Text style={{ color: "#16a34a", fontWeight: "600" }}>{d.accuracy}%</Text>
          </View>
        )) : <Text style={{ color: colors.muted }}>No accuracy data yet</Text>}
      </Card>

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600" }}>Practice Heatmap</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Last 90 days · {practiceDays} active days</Text>
        {heatmap && Object.entries(heatmap.practice).slice(-14).map(([date, count]) => (
          <View key={date} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{date}</Text>
            <View style={{ flexDirection: "row", gap: 2 }}>
              {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                <View key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colors.primary, opacity: 0.3 + i * 0.15 }} />
              ))}
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Batch Comparison</Text>
        {batchComparison.length ? batchComparison.slice(0, 8).map((e) => (
          <View key={e.studentId} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.text }}>{e.name}</Text>
            <Text style={{ color: colors.muted }}>{e.periodXp} XP · {e.avgWpm} WPM</Text>
          </View>
        )) : <Text style={{ color: colors.muted }}>No comparison data</Text>}
      </Card>

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>AI Insights</Text>
        <Text style={{ color: colors.text, lineHeight: 22, fontSize: 14 }}>
          {insights || "Keep practicing daily to see personalized insights."}
        </Text>
      </Card>
    </Screen>
  );
}