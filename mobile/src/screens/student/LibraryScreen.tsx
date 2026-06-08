import { useEffect, useState } from "react";
import { Text, Pressable, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, LibraryItem } from "../../lib/api";
import { parseLibraryResponse } from "../../lib/paginate";
import { useAppRefresh } from "../../contexts/RefreshContext";
import { Screen, Card, Input, PillGroup, Pagination } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { StudentStackParamList } from "../../navigation/StudentNavigator";

const CATS = ["", "shorthand", "typing", "ccc", "computer"];

const typeIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  pdf: "document-text",
  video: "videocam",
  audio: "mic",
  note: "book",
  paper: "document",
};

const typeColor: Record<string, string> = {
  pdf: "#f43f5e",
  video: "#3b82f6",
  audio: "#8b5cf6",
  note: "#10b981",
  paper: "#f59e0b",
};

export default function StudentLibraryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const { refreshKey } = useAppRefresh();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ visibility: "public", page: String(page), limit: "6" });
    if (search) params.set("search", search);
    if (filter) params.set("category", filter);
    api.getLibrary(params.toString()).then((data) => {
      const parsed = parseLibraryResponse(data);
      setItems(parsed.items);
      setPages(parsed.pagination.pages);
    }).catch(() => {});
  }, [search, filter, page, refreshKey]);

  useEffect(() => { setPage(1); }, [search, filter]);

  const openItem = (item: LibraryItem) => {
    navigation.navigate("MaterialViewer", { item });
  };

  return (
    <Screen title="Digital Library">
      <View style={[styles.hero, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
        <Ionicons name="library" size={28} color={colors.accent} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Public Library</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>Read PDFs & notes in-app</Text>
        </View>
      </View>

      <Input value={search} onChangeText={setSearch} placeholder="Search materials..." />
      <PillGroup options={CATS.map((c) => ({ id: c, label: c || "All" }))} value={filter} onChange={setFilter} />

      {items.length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>No materials found</Text>
      ) : (
        items.map((item) => (
          <Pressable key={item._id} onPress={() => openItem(item)}>
            <Card style={styles.materialCard}>
              <View style={[styles.iconBox, { backgroundColor: `${typeColor[item.type] || colors.primary}18` }]}>
                <Ionicons name={typeIcon[item.type] || "folder"} size={22} color={typeColor[item.type] || colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>{item.category}</Text>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15, marginTop: 2 }}>{item.title}</Text>
                {item.description ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>{item.description}</Text> : null}
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4, textTransform: "capitalize" }}>{item.type} · Tap to read</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
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
  materialCard: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});