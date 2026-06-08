import { useEffect, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, LevelInfo } from "../../lib/api";
import { formatCurrency, formatDateTime, formatBadgeName } from "../../lib/utils";
import { Screen, StatCard, Card, Badge } from "../../components/ui";
import { StudentStackParamList } from "../../navigation/StudentNavigator";
import { useTheme } from "../../contexts/ThemeContext";

const QUICK_ACTIONS = [
  { screen: "StudentTyping", label: "Typing", icon: "keypad-outline" as const, color: "#3b82f6" },
  { screen: "StudentShorthand", label: "Shorthand", icon: "mic-outline" as const, color: "#a855f7" },
  { screen: "StudentExams", label: "Take Exam", icon: "document-text-outline" as const, color: "#22c55e" },
  { screen: "StudentLeaderboard", label: "Leaderboard", icon: "trophy-outline" as const, color: "#eab308" },
  { screen: "StudentAnalytics", label: "Analytics", icon: "stats-chart-outline" as const, color: "#6366f1" },
  { screen: "StudentAICoach", label: "AI Coach", icon: "chatbubble-ellipses-outline" as const, color: "#ec4899" },
];

const MOTIVATIONAL = [
  "Every keystroke brings you closer to mastery!",
  "Consistency beats intensity — keep your streak alive!",
  "Your dedication today shapes tomorrow's success.",
];

type Nav = NativeStackNavigationProp<StudentStackParamList>;

export default function StudentDashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    api.studentDashboard().then(setData).catch(() => {});
  }, []);

  const profile = data.profile as {
    attendancePercent?: number;
    feesStatus?: string;
    paidFees?: number;
    totalFees?: number;
    course?: { name: string };
    batch?: { name: string };
  } | undefined;
  const attendance = data.attendance as { percent?: number } | undefined;
  const exams = (data.upcomingExams as { _id: string; title: string; scheduledAt: string }[]) || [];
  const gamification = data.gamification as {
    xp?: number;
    level?: number;
    streak?: number;
    badges?: string[];
    levelInfo?: LevelInfo;
  } | undefined;

  const levelInfo = gamification?.levelInfo;
  const xpProgress = levelInfo ? Math.round((levelInfo.current / levelInfo.needed) * 100) : 0;
  const message = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];

  const navigateDrawer = (screen: string) => {
    navigation.navigate("StudentDrawer", { screen } as never);
  };

  return (
    <Screen>
      <Card style={{ backgroundColor: colors.primaryLight }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="flash" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>Daily Motivation</Text>
        </View>
        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginTop: 8 }}>{message}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7ed", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Ionicons name="flame" size={16} color="#f97316" />
            <Text style={{ color: "#f97316", fontWeight: "700" }}>{gamification?.streak ?? 0} day streak</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Level {gamification?.level ?? 1} · {gamification?.xp ?? 0} XP
          </Text>
        </View>
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Level Progress</Text>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>
              {levelInfo?.current ?? 0}/{levelInfo?.needed ?? 500} XP
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${xpProgress}%`, backgroundColor: colors.primary, borderRadius: 4 }} />
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <StatCard title="Attendance" value={`${attendance?.percent ?? profile?.attendancePercent ?? 0}%`} />
        <StatCard title="Fees Status" value={profile?.feesStatus ?? "—"} />
        <StatCard title="Upcoming Exams" value={exams.length} />
        <StatCard title="Badges Earned" value={gamification?.badges?.length ?? 0} />
      </View>

      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>Quick Actions</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.screen}
            onPress={() => navigateDrawer(action.screen)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 14,
              backgroundColor: colors.card,
              minWidth: "46%",
              flex: 1,
            }}
          >
            <View style={{ backgroundColor: action.color, borderRadius: 10, padding: 8 }}>
              <Ionicons name={action.icon} size={18} color="#fff" />
            </View>
            <Text style={{ color: colors.text, fontWeight: "500", fontSize: 13 }}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600" }}>My Course</Text>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 8 }}>{profile?.course?.name || "Not enrolled"}</Text>
        <Text style={{ color: colors.muted }}>Batch: {profile?.batch?.name || "—"}</Text>
        {profile?.totalFees ? (
          <Text style={{ color: colors.text, marginTop: 8 }}>
            Fees: {formatCurrency(profile.paidFees || 0)} / {formatCurrency(profile.totalFees)}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Achievements</Text>
        {gamification?.badges?.length ? (
          gamification.badges.map((b) => <Badge key={b} label={formatBadgeName(b)} />)
        ) : (
          <Text style={{ color: colors.muted }}>Practice daily to earn badges!</Text>
        )}
      </Card>

      <Card>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Upcoming Exams</Text>
        {exams.length ? exams.map((e) => (
          <View key={e._id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ color: colors.text, fontWeight: "500" }}>{e.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDateTime(e.scheduledAt)}</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("StudentExamTake", { examId: e._id })}
              style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "600" }}>Start</Text>
            </Pressable>
          </View>
        )) : (
          <Text style={{ color: colors.muted }}>No upcoming exams</Text>
        )}
      </Card>
    </Screen>
  );
}