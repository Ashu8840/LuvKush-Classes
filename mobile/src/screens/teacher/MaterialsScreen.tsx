import { useEffect, useState } from "react";
import { Text, Pressable, View, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import { api, LibraryItem } from "../../lib/api";
import { parseLibraryResponse } from "../../lib/paginate";
import { useAppRefresh } from "../../contexts/RefreshContext";
import { toast } from "../../contexts/ToastContext";
import { Screen, Card, Button, Input, AppModal, Pagination } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";
import { TeacherStackParamList } from "../../navigation/TeacherNavigator";

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

export default function TeacherMaterialsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();
  const { refreshKey } = useAppRefresh();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modal, setModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", type: "pdf", category: "general", tags: "" });
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const load = (p = page) => {
    const params = new URLSearchParams({ visibility: "public", page: String(p), limit: "6" });
    api.getLibrary(params.toString()).then((data) => {
      const parsed = parseLibraryResponse(data);
      setItems(parsed.items);
      setPages(parsed.pagination.pages);
    }).catch(() => {});
  };

  useEffect(() => { load(page); }, [page, refreshKey]);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      setFile(result.assets[0]);
      setModal(true);
    }
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploadFile(file.uri, file.name, file.mimeType || "application/octet-stream");
      await api.addLibraryItem({
        title: form.title || file.name,
        type: form.type,
        category: form.category,
        url: uploaded.url,
        visibility: "public",
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setModal(false);
      setFile(null);
      setPage(1);
      load(1);
      toast.success("Shared to public library");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert("Remove material?", "Students will no longer see this in the public library.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => api.deleteLibraryItem(id).then(() => { toast.success("Removed"); load(page); }),
      },
    ]);
  };

  return (
    <Screen title="Public Library" action={<Button label="Add" onPress={pickFile} small />}>
      <View style={[styles.hero, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
        <Ionicons name="library" size={26} color={colors.accent} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>Public Library</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Free for all students · read in-app</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>No materials yet. Tap Add to upload.</Text>
      ) : (
        items.map((item) => (
          <Card key={item._id} style={styles.materialCard}>
            <Pressable style={{ flex: 1, flexDirection: "row", alignItems: "center" }} onPress={() => navigation.navigate("MaterialViewer", { item })}>
              <View style={[styles.iconBox, { backgroundColor: `${typeColor[item.type] || colors.primary}18` }]}>
                <Ionicons name={typeIcon[item.type] || "folder"} size={22} color={typeColor[item.type] || colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>{item.category}</Text>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{item.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, textTransform: "capitalize", marginTop: 2 }}>{item.type} · Tap to read</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => remove(item._id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </Pressable>
          </Card>
        ))
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <AppModal visible={modal} title="Add to Public Library" onClose={() => setModal(false)}>
        <Input label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <SelectDropdown
          label="Type"
          value={form.type}
          options={[
            { id: "pdf", label: "PDF" },
            { id: "video", label: "Video" },
            { id: "audio", label: "Audio" },
            { id: "note", label: "Note" },
            { id: "paper", label: "Paper" },
          ]}
          onChange={(v) => setForm({ ...form, type: v })}
        />
        <SelectDropdown
          label="Category"
          value={form.category}
          options={[
            { id: "shorthand", label: "Shorthand" },
            { id: "typing", label: "Typing" },
            { id: "computer", label: "Computer" },
            { id: "ccc", label: "CCC" },
            { id: "general", label: "General" },
          ]}
          onChange={(v) => setForm({ ...form, category: v })}
        />
        <Input label="Tags (comma separated)" value={form.tags} onChangeText={(v) => setForm({ ...form, tags: v })} />
        {file && <Text style={{ color: colors.muted, marginBottom: 8 }}>File: {file.name}</Text>}
        <Button label={uploading ? "Uploading..." : "Share with All"} onPress={upload} disabled={uploading || !file} />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  materialCard: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  deleteBtn: { padding: 8, marginLeft: 4 },
});