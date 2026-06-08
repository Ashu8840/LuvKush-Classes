import { useEffect, useState } from "react";
import { Text, StyleSheet, Alert, View, Pressable } from "react-native";
import { api, Pagination as PaginationMeta } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { Screen, Card, Button, Input, AppModal, Badge, Pagination } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

type Profile = {
  _id: string;
  user: { _id: string; name: string; email: string; phone?: string; isActive: boolean };
  qualification: string;
  experience: string;
  subjects?: string[];
  batches?: { name: string }[];
};

type Batch = { _id: string; name: string };

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  password: "",
  qualification: "",
  experience: "",
  subjects: "",
  salary: "",
  joiningDate: "",
  batches: [] as string[],
});

export default function AdminTeachersScreen() {
  const { colors } = useTheme();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });

  const loadList = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    if (search) params.set("search", search);
    api.adminTeachers(params.toString()).then((d) => {
      setProfiles((d.profiles as Profile[]) || []);
      if (d.pagination) setPagination(d.pagination as PaginationMeta);
    }).catch(() => toast.error("Failed to load teachers"));
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { loadList(page); }, [page, search]);
  useEffect(() => {
    api.getBatches().then((d) => setBatches((Array.isArray(d) ? d : d.batches) as Batch[])).catch(() => {});
  }, []);

  const reload = () => loadList(page);

  const toggleBatch = (batchId: string) => {
    setForm((f) => ({
      ...f,
      batches: f.batches.includes(batchId)
        ? f.batches.filter((id) => id !== batchId)
        : [...f.batches, batchId],
    }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      await api.createTeacher({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        qualification: form.qualification,
        experience: form.experience,
        subjects: form.subjects,
        salary: Number(form.salary) || 0,
        joiningDate: form.joiningDate || undefined,
        batches: form.batches,
      });
      setModal(false);
      setForm(emptyForm());
      reload();
      toast.success("Teacher created and batches assigned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create teacher");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = (p: Profile) => {
    const next = !p.user.isActive;
    Alert.alert(
      next ? "Activate Teacher" : "Block Teacher",
      next ? `Allow ${p.user.name} to login?` : `Block ${p.user.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: next ? "Activate" : "Block",
          onPress: async () => {
            try {
              await api.updateTeacher(p.user._id, { isActive: next });
              reload();
            } catch { toast.error("Failed to update teacher"); }
          },
        },
      ]
    );
  };

  const archive = (p: Profile) => {
    Alert.alert(
      "Archive Teacher",
      `Archive ${p.user.name}? Records are permanently saved in the Database.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await api.archiveTeacher(p.user._id);
              reload();
            } catch { toast.error("Failed to archive teacher"); }
          },
        },
      ]
    );
  };

  return (
    <Screen title="Teacher Management" action={<Button label="Add Teacher" onPress={() => setModal(true)} small />}>
      <Input value={search} onChangeText={setSearch} placeholder="Search by name or email..." />
      {profiles.map((p) => (
        <Card key={p._id}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{p.user?.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{p.user?.email}</Text>
            </View>
            <Badge label={p.user?.isActive ? "Active" : "Blocked"} variant={p.user?.isActive ? "success" : "danger"} />
          </View>
          <Text style={{ color: colors.text, marginTop: 8 }}>{p.qualification || "—"} · {p.experience || "—"}</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Phone: {p.user?.phone || "—"}</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
            Subjects: {p.subjects?.join(", ") || "—"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
            Batches: {p.batches?.map((b) => b.name).join(", ") || "—"}
          </Text>
          <View style={styles.actions}>
            <Button label={p.user.isActive ? "Block" : "Activate"} variant={p.user.isActive ? "outline" : "primary"} small onPress={() => toggleActive(p)} />
            <Button label="Archive" variant="danger" small onPress={() => archive(p)} />
          </View>
        </Card>
      ))}
      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />
      <AppModal visible={modal} title="Add New Teacher" onClose={() => setModal(false)}>
        <Input label="Full Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
        <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Input label="Password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
        <Input label="Qualification" value={form.qualification} onChangeText={(v) => setForm({ ...form, qualification: v })} />
        <Input label="Experience" value={form.experience} onChangeText={(v) => setForm({ ...form, experience: v })} />
        <Input label="Subjects (comma-separated)" value={form.subjects} onChangeText={(v) => setForm({ ...form, subjects: v })} placeholder="Shorthand, Typing" />
        <Input label="Salary (₹)" value={form.salary} onChangeText={(v) => setForm({ ...form, salary: v })} keyboardType="numeric" />
        <Input label="Joining Date (YYYY-MM-DD)" value={form.joiningDate} onChangeText={(v) => setForm({ ...form, joiningDate: v })} />

        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 8, textTransform: "uppercase" }}>
          Assign Batches
        </Text>
        {batches.map((b) => (
          <Pressable
            key={b._id}
            onPress={() => toggleBatch(b._id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: form.batches.includes(b._id) ? colors.primary : colors.border,
                backgroundColor: form.batches.includes(b._id) ? colors.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {form.batches.includes(b._id) && (
                <Text style={{ color: colors.primaryText, fontSize: 14, fontWeight: "700" }}>✓</Text>
              )}
            </View>
            <Text style={{ color: colors.text, fontSize: 15 }}>{b.name}</Text>
          </Pressable>
        ))}

        <Button label={loading ? "Creating..." : "Create Teacher"} onPress={submit} disabled={loading} />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { fontSize: 16, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
});