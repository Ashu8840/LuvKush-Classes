import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { api, Pagination as PaginationMeta } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { formatCurrency } from "../../lib/utils";
import { Screen, Card, Button, Input, AppModal, Badge, Pagination } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";

type Profile = {
  _id: string;
  user: { _id: string; name: string; email: string; isActive: boolean };
  feesStatus: string;
  totalFees: number;
  paidFees: number;
  attendancePercent: number;
  performanceScore: number;
  course?: { name: string };
  batch?: { name: string };
};

type Course = { _id: string; name: string };
type Batch = { _id: string; name: string; course?: { _id: string } };

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  password: "",
  parentName: "",
  parentPhone: "",
  totalFees: "",
  course: "",
  batch: "",
  dateOfBirth: "",
  address: "",
});

export default function AdminStudentsScreen() {
  const { colors } = useTheme();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
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
    api.adminStudents(params.toString()).then((d) => {
      setProfiles((d.profiles as Profile[]) || []);
      if (d.pagination) setPagination(d.pagination as PaginationMeta);
    }).catch(() => toast.error("Failed to load students"));
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { loadList(page); }, [page, search]);
  useEffect(() => {
    api.getCourses().then((d) => setCourses((Array.isArray(d) ? d : d.courses) as Course[])).catch(() => {});
    api.getBatches().then((d) => setBatches((Array.isArray(d) ? d : d.batches) as Batch[])).catch(() => {});
  }, []);

  const reload = () => loadList(page);

  const filteredBatches = form.course
    ? batches.filter((b) => !b.course?._id || b.course._id === form.course)
    : batches;

  const submit = async () => {
    setLoading(true);
    try {
      await api.createStudent({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        parentName: form.parentName || undefined,
        parentPhone: form.parentPhone || undefined,
        totalFees: Number(form.totalFees) || 0,
        course: form.course || undefined,
        batch: form.batch || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address || undefined,
      });
      setModal(false);
      setForm(emptyForm());
      reload();
      toast.success("Student created and enrolled in batch");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (p: Profile) => {
    const next = !p.user.isActive;
    const action = next ? "activate" : "block";
    Alert.alert(
      next ? "Activate Student" : "Block Student",
      next ? `Allow ${p.user.name} to login again?` : `Block ${p.user.name}? They cannot login until reactivated.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: next ? "Activate" : "Block",
          style: next ? "default" : "destructive",
          onPress: async () => {
            try {
              await api.updateStudent(p.user._id, { isActive: next });
              reload();
            } catch { toast.error(`Failed to ${action} student`); }
          },
        },
      ]
    );
  };

  const archive = (p: Profile) => {
    Alert.alert(
      "Archive Student",
      `Remove ${p.user.name} from active students?\n\nAll records (scores, fees, certificates, attendance) are permanently saved in the Database. They can be looked up years later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await api.archiveStudent(p.user._id);
              reload();
            } catch { toast.error("Failed to archive student"); }
          },
        },
      ]
    );
  };

  return (
    <Screen title="Student Management" action={<Button label="Add Student" onPress={() => setModal(true)} small />}>
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
          <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>
            {p.course?.name || "—"} · {p.batch?.name || "—"}
          </Text>
          <Text style={{ color: colors.text, marginTop: 4, fontSize: 13 }}>
            Fees: {formatCurrency(p.paidFees)} / {formatCurrency(p.totalFees)} ({p.feesStatus})
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Attendance: {p.attendancePercent}% · Score: {p.performanceScore}</Text>
          <View style={styles.actions}>
            <Button
              label={p.user.isActive ? "Block" : "Activate"}
              variant={p.user.isActive ? "outline" : "primary"}
              small
              onPress={() => toggleActive(p)}
            />
            <Button label="Archive" variant="danger" small onPress={() => archive(p)} />
          </View>
        </Card>
      ))}
      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />
      <AppModal visible={modal} title="Add New Student" onClose={() => setModal(false)}>
        <Input label="Full Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
        <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Input label="Password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
        <Input label="Parent Name" value={form.parentName} onChangeText={(v) => setForm({ ...form, parentName: v })} />
        <Input label="Parent Phone (optional)" value={form.parentPhone} onChangeText={(v) => setForm({ ...form, parentPhone: v })} keyboardType="phone-pad" />
        <Input label="Date of Birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={(v) => setForm({ ...form, dateOfBirth: v })} />
        <Input label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
        <SelectDropdown
          label="Course"
          value={form.course || (courses[0]?._id ?? "")}
          options={[{ id: "", label: "— Select course —" }, ...courses.map((c) => ({ id: c._id, label: c.name }))]}
          onChange={(v) => setForm({ ...form, course: v, batch: "" })}
        />
        <SelectDropdown
          label="Batch"
          value={form.batch || (filteredBatches[0]?._id ?? "")}
          options={[{ id: "", label: "— Select batch —" }, ...filteredBatches.map((b) => ({ id: b._id, label: b.name }))]}
          onChange={(v) => setForm({ ...form, batch: v })}
        />
        <Input label="Total Fees (₹)" value={form.totalFees} onChangeText={(v) => setForm({ ...form, totalFees: v })} keyboardType="numeric" />
        <Button label={loading ? "Creating..." : "Create Student"} onPress={submit} disabled={loading} />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { fontSize: 16, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
});