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

type Batch = { _id: string; name: string };

const typeIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  pdf: "document-text",
  video: "videocam",
  audio: "mic",
  note: "book",
  paper: "document",
};

export default function TeacherLearningModulesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();
  const { refreshKey } = useAppRefresh();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modal, setModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", type: "pdf", category: "general", batchId: "", tags: "" });
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const load = (p = page) => {
    const params = new URLSearchParams({ visibility: "course", page: String(p), limit: "6" });
    api.getLibrary(params.toString()).then((data) => {
      const parsed = parseLibraryResponse(data);
      setItems(parsed.items);
      setPages(parsed.pagination.pages);
    }).catch(() => {});
  };

  useEffect(() => { load(page); }, [page, refreshKey]);
  useEffect(() => {
    api.teacherDashboard().then((d) => setBatches((d.batches as Batch[]) || [])).catch(() => {});
  }, [refreshKey]);

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
        visibility: "course",
        batch: form.batchId || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setModal(false);
      setFile(null);
      setPage(1);
      load(1);
      toast.success("Module added for your students");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert("Delete module?", "Only your students will lose access.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => api.deleteLibraryItem(id).then(() => { toast.success("Deleted"); load(page); }),
      },
    ]);
  };

  return (
    <Screen title="Learning Modules" action={<Button label="Add" onPress={pickFile} small />}>
      <View style={[styles.hero, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
        <Ionicons name="school" size={26} color={colors.accent} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>Course Modules</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Only your students · read in-app</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>No modules yet. Tap Add to upload.</Text>
      ) : (
        items.map((item) => (
          <Card key={item._id} style={styles.row}>
            <Pressable style={{ flex: 1, flexDirection: "row", alignItems: "center" }} onPress={() => navigation.navigate("MaterialViewer", { item })}>
              <Ionicons name={typeIcon[item.type] || "document"} size={24} color={colors.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{item.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, textTransform: "capitalize" }}>
                  {item.type} · {item.category} · {item.batch?.name || "All batches"}
                </Text>
                <Text style={{ color: colors.accent, fontSize: 11, marginTop: 4, fontWeight: "600" }}>Open reader →</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => remove(item._id)} style={{ padding: 8 }}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </Pressable>
          </Card>
        ))
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <AppModal visible={modal} title="Add Learning Module" onClose={() => setModal(false)}>
        <Input label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <SelectDropdown
          label="Type"
          value={form.type}
          options={[
            { id: "pdf", label: "PDF" },
            { id: "video", label: "Video" },
            { id: "audio", label: "Audio" },
            { id: "note", label: "Note" },
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
        <SelectDropdown
          label="Batch"
          value={form.batchId}
          options={[{ id: "", label: "All your students" }, ...batches.map((b) => ({ id: b._id, label: b.name }))]}
          onChange={(v) => setForm({ ...form, batchId: v })}
        />
        <Input label="Tags" value={form.tags} onChangeText={(v) => setForm({ ...form, tags: v })} />
        {file && <Text style={{ color: colors.muted, marginBottom: 8 }}>File: {file.name}</Text>}
        <Button label={uploading ? "Uploading..." : "Add Module"} onPress={upload} disabled={uploading || !file} />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
});