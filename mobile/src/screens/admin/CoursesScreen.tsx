import { useEffect, useState } from "react";
import { Text, Pressable, Alert, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, Pagination as PaginationMeta } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { formatCurrency } from "../../lib/utils";
import { Screen, Card, Button, Input, AppModal, Badge, Pagination } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";

type Course = { _id: string; name: string; category: string; level: string; fee: number; duration: string };

const NEW_CATEGORY = "__new__";

const emptyForm = () => ({ name: "", category: "", categoryMode: "", newCategory: "", level: "", fee: "", duration: "" });

export default function AdminCoursesScreen() {
  const { colors } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });

  const loadCourses = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    api.getCourses(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setCourses(data as Course[]);
        setPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setCourses(data.courses as Course[]);
        setPagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load courses"));
  };

  useEffect(() => { loadCourses(page); }, [page]);
  useEffect(() => { api.getCourseCategories().then(setCategories).catch(() => {}); }, []);

  const categoryOptions = [
    ...categories.map((c) => ({ id: c, label: c })),
    { id: NEW_CATEGORY, label: "+ New category..." },
  ];

  const resolvedCategory = form.categoryMode === NEW_CATEGORY ? form.newCategory.trim() : form.categoryMode;

  const submit = async () => {
    if (!form.name.trim() || !resolvedCategory) {
      toast.error("Course name and category are required");
      return;
    }
    setLoading(true);
    try {
      await api.createCourse({
        name: form.name.trim(),
        slug: form.name.trim().toLowerCase().replace(/\s+/g, "-"),
        category: resolvedCategory,
        level: form.level,
        fee: Number(form.fee) || 0,
        duration: form.duration,
      });
      setModal(false);
      setForm(emptyForm());
      loadCourses(page);
      toast.success("Course created successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  const removeCourse = (course: Course) => {
    Alert.alert(
      "Delete course?",
      `Delete "${course.name}"?\n\nThis course will be permanently removed. Linked batches and enrollments will be unassigned. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteCourse(course._id);
              loadCourses(page);
              toast.success("Course deleted");
            } catch {
              toast.error("Failed to delete course");
            }
          },
        },
      ]
    );
  };

  return (
    <Screen title="Course Management" action={<Button label="Create Course" onPress={() => setModal(true)} small />}>
      {courses.map((c) => (
        <Card key={c._id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Badge label={c.category} />
            <Pressable onPress={() => removeCourse(c)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </Pressable>
          </View>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 8 }}>{c.name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{c.level} · {c.duration}</Text>
          <Text style={{ color: colors.accent, marginTop: 4, fontWeight: "600" }}>{formatCurrency(c.fee)}</Text>
        </Card>
      ))}
      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />
      <AppModal visible={modal} title="Create Course" onClose={() => setModal(false)}>
        <Input label="Course Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <SelectDropdown
          label="Category"
          value={form.categoryMode || categoryOptions[0]?.id || NEW_CATEGORY}
          options={categoryOptions.length > 1 ? categoryOptions : [{ id: NEW_CATEGORY, label: "+ New category..." }]}
          onChange={(v) => setForm({ ...form, categoryMode: v })}
        />
        {form.categoryMode === NEW_CATEGORY && (
          <Input
            label="New Category Name"
            value={form.newCategory}
            onChangeText={(v) => setForm({ ...form, newCategory: v })}
            placeholder="e.g. Advanced Typing"
          />
        )}
        <Input label="Level" value={form.level} onChangeText={(v) => setForm({ ...form, level: v })} placeholder="e.g. 80 WPM" />
        <Input label="Fee (₹)" value={form.fee} onChangeText={(v) => setForm({ ...form, fee: v })} keyboardType="numeric" />
        <Input label="Duration" value={form.duration} onChangeText={(v) => setForm({ ...form, duration: v })} placeholder="e.g. 3 months" />
        <Button label={loading ? "Creating..." : "Create Course"} onPress={submit} disabled={loading} />
      </AppModal>
    </Screen>
  );
}