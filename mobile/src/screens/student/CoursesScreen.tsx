import { useEffect, useState } from "react";
import { Text, Pressable, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, LibraryItem } from "../../lib/api";
import { parseLibraryResponse } from "../../lib/paginate";
import { useAppRefresh } from "../../contexts/RefreshContext";
import { Screen, Card, Badge, Pagination } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { StudentStackParamList } from "../../navigation/StudentNavigator";

export default function StudentCoursesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const { refreshKey } = useAppRefresh();
  const [modules, setModules] = useState<LibraryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ visibility: "course", page: String(page), limit: "6" });
    api.getLibrary(params.toString()).then((data) => {
      const parsed = parseLibraryResponse(data);
      setModules(parsed.items);
      setPages(parsed.pagination.pages);
    }).catch(() => {});
  }, [page, refreshKey]);

  const openItem = (item: LibraryItem) => {
    navigation.navigate("MaterialViewer", { item });
  };

  return (
    <Screen title="My Learning Modules">
      <View style={[styles.hero, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
        <Ionicons name="school" size={28} color={colors.accent} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Course Materials</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>From your teacher — read in-app</Text>
        </View>
      </View>

      {modules.length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>No modules from your teacher yet</Text>
      ) : (
        modules.map((item) => (
          <Pressable key={item._id} onPress={() => openItem(item)}>
            <Card>
              <Badge label={item.category} />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 8 }}>{item.title}</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                {item.teacher?.name} · {item.batch?.name || "Your batch"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 4 }}>
                <Ionicons name="book-outline" size={16} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>Open reader</Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
});