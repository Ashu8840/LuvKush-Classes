import { useEffect, useState } from "react";
import { Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, LiveClassSession } from "../../lib/api";
import { paginateSlice } from "../../lib/paginate";
import { useAppRefresh } from "../../contexts/RefreshContext";
import { formatDateTime } from "../../lib/utils";
import { Screen, Card, Badge, Pagination } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { StudentStackParamList } from "../../navigation/StudentNavigator";

type Nav = NativeStackNavigationProp<StudentStackParamList>;

export default function StudentLiveClassesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { refreshKey } = useAppRefresh();
  const [classes, setClasses] = useState<LiveClassSession[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.getLiveClasses().then(setClasses).catch(() => {});
  }, [refreshKey]);

  const live = classes.filter((c) => c.status === "live");
  const upcoming = classes.filter((c) => c.status === "scheduled");
  const upcomingPage = paginateSlice(upcoming, page);

  return (
    <Screen title="Live Classes">
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
        Join teacher live sessions with video, chat, and hand raise
      </Text>

      {live.map((c) => (
        <Pressable key={c._id} onPress={() => navigation.navigate("LiveClassRoom", { classId: c._id, isTeacher: false })}>
          <Card style={{ borderColor: "#16a34a", borderWidth: 2 }}>
            <Badge label="LIVE" variant="success" />
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 17, marginTop: 8 }}>{c.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{c.teacher.name} · {c.batch?.name}</Text>
          </Card>
        </Pressable>
      ))}

      {upcomingPage.items.map((c) => (
        <Pressable key={c._id} onPress={() => navigation.navigate("LiveClassRoom", { classId: c._id, isTeacher: false })}>
          <Card>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{c.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{c.teacher.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDateTime(c.scheduledAt)}</Text>
          </Card>
        </Pressable>
      ))}

      {upcoming.length > 0 && (
        <Pagination page={upcomingPage.page} pages={upcomingPage.pages} onPageChange={setPage} />
      )}

      {classes.length === 0 && (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 24 }}>No live classes for your batch yet</Text>
      )}
    </Screen>
  );
}