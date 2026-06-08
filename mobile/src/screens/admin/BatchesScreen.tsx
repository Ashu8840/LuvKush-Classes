import { useEffect, useState } from "react";
import { Text, Pressable, Alert, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, Pagination as PaginationMeta } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { Screen, Card, Badge, Button, Input, AppModal, Pagination } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";

type Batch = {
  _id: string;
  name: string;
  type: string;
  timing: string;
  strength: number;
  course?: { name: string };
  teacher?: { name: string };
  students?: unknown[];
};

type Course = { _id: string; name: string };
type Teacher = { user: { _id: string; name: string } };

const BATCH_TYPES = [
  { id: "morning", label: "Morning" },
  { id: "evening", label: "Evening" },
  { id: "weekend", label: "Weekend" },
];

const emptyForm = () => ({
  name: "",
  type: "morning",
  timing: "",
  strength: "30",
  course: "",
  teacher: "",
});

export default function AdminBatchesScreen() {
  const { colors } = useTheme();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });

  const loadBatches = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    api.getBatches(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setBatches(data as Batch[]);
        setPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setBatches(data.batches as Batch[]);
        setPagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load batches"));
  };

  useEffect(() => { loadBatches(page); }, [page]);
  useEffect(() => {
    api.getCourses().then((d) => setCourses((Array.isArray(d) ? d : d.courses) as Course[])).catch(() => {});
    api.adminTeachers().then((d) => setTeachers((d.profiles as Teacher[]) || [])).catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.timing.trim()) {
      toast.error("Batch name and timing are required");
      return;
    }
    setLoading(true);
    try {
      await api.createBatch({
        name: form.name.trim(),
        type: form.type,
        timing: form.timing.trim(),
        strength: Number(form.strength) || 30,
        course: form.course || undefined,
        teacher: form.teacher || undefined,
      });
      setModal(false);
      setForm(emptyForm());
      loadBatches(page);
      toast.success("Batch created successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setLoading(false);
    }
  };

  const removeBatch = (batch: Batch) => {
    Alert.alert(
      "Delete batch?",
      `Delete "${batch.name}"?\n\nThis batch will be permanently removed. Students will be unassigned.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteBatch(batch._id);
              loadBatches(page);
              toast.success("Batch deleted");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to delete batch");
            }
          },
        },
      ]
    );
  };

  return (
    <Screen title="Batch Management" action={<Button label="Create Batch" onPress={() => setModal(true)} small />}>
      {batches.map((b) => (
        <Card key={b._id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>{b.name}</Text>
              <Badge label={b.type} variant="success" />
              <Text style={{ color: colors.muted, marginTop: 8 }}>{b.timing}</Text>
              <Text style={{ color: colors.text, marginTop: 4 }}>Course: {b.course?.name || "—"}</Text>
              <Text style={{ color: colors.text }}>Teacher: {b.teacher?.name || "—"}</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                {b.students?.length || 0} / {b.strength} students
              </Text>
            </View>
            <Pressable onPress={() => removeBatch(b)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </Pressable>
          </View>
        </Card>
      ))}
      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <AppModal visible={modal} title="Create Batch" onClose={() => setModal(false)}>
        <Input label="Batch Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <SelectDropdown
          label="Type"
          value={form.type}
          options={BATCH_TYPES}
          onChange={(v) => setForm({ ...form, type: v })}
        />
        <Input label="Timing" value={form.timing} onChangeText={(v) => setForm({ ...form, timing: v })} placeholder="e.g. 7:00 AM - 9:00 AM" />
        <Input label="Strength" value={form.strength} onChangeText={(v) => setForm({ ...form, strength: v })} keyboardType="numeric" />
        <SelectDropdown
          label="Course"
          value={form.course || (courses[0]?._id ?? "")}
          options={[{ id: "", label: "— Select course —" }, ...courses.map((c) => ({ id: c._id, label: c.name }))]}
          onChange={(v) => setForm({ ...form, course: v })}
        />
        <SelectDropdown
          label="Teacher"
          value={form.teacher || (teachers[0]?.user?._id ?? "")}
          options={[
            { id: "", label: "— Select teacher —" },
            ...teachers.map((t) => ({ id: t.user._id, label: t.user.name })),
          ]}
          onChange={(v) => setForm({ ...form, teacher: v })}
        />
        <Button label={loading ? "Creating..." : "Create Batch"} onPress={submit} disabled={loading} />
      </AppModal>
    </Screen>
  );
}