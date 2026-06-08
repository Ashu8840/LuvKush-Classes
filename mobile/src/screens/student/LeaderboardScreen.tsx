import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, LeaderboardEntry } from "../../lib/api";
import { formatBadgeName } from "../../lib/utils";
import { Screen, Card, Badge, PillGroup, Loading } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function StudentLeaderboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [period, setPeriod] = useState("week");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<{ badges: string[]; streak: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getLeaderboard({ period, scope: "batch" }),
      api.getAchievements(),
    ])
      .then(([lb, ach]) => { setLeaderboard(lb); setAchievements(ach); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const myRank = leaderboard.find((e) => e.studentId === user?.id);

  return (
    <Screen title="Batch Leaderboard">
      <PillGroup
        options={[{ id: "week", label: "This Week" }, { id: "month", label: "This Month" }]}
        value={period}
        onChange={setPeriod}
      />

      {loading ? <Loading /> : (
        <>
          {myRank && (
            <Card style={{ backgroundColor: colors.primaryLight, borderColor: colors.primary }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>Your Rank</Text>
                  <Text style={{ color: colors.accent, fontSize: 28, fontWeight: "700" }}>#{myRank.rank}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>Period XP</Text>
                  <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>{myRank.periodXp}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="flame" size={20} color="#f97316" />
                  <Text style={{ color: "#f97316", fontWeight: "700" }}>{achievements?.streak ?? myRank.streak}d</Text>
                </View>
              </View>
            </Card>
          )}

          {leaderboard.slice(0, 3).map((entry, i) => (
            <Card key={entry.studentId} style={i === 0 ? { borderColor: "#facc15" } : undefined}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ionicons
                  name="trophy"
                  size={28}
                  color={i === 0 ? "#eab308" : i === 1 ? "#9ca3af" : "#b45309"}
                />
                <View>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{entry.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>#{entry.rank} · {entry.periodXp} XP · Lv {entry.level}</Text>
                </View>
              </View>
            </Card>
          ))}

          <Card>
            <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 12 }}>Full Rankings</Text>
            {leaderboard.map((entry) => (
              <View
                key={entry.studentId}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: entry.studentId === user?.id ? colors.primaryLight : "transparent",
                  paddingHorizontal: entry.studentId === user?.id ? 8 : 0,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: entry.studentId === user?.id ? "700" : "400" }}>
                  #{entry.rank} {entry.name}
                </Text>
                <Text style={{ color: colors.muted }}>{entry.periodXp} XP</Text>
              </View>
            ))}
          </Card>

          {achievements?.badges?.length ? (
            <Card>
              <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Your Badges</Text>
              {achievements.badges.map((b) => <Badge key={b} label={formatBadgeName(b)} />)}
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}