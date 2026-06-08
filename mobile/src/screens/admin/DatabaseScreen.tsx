import { useEffect, useState } from "react";
import { Text, View, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, Pagination as PaginationMeta } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Screen, Card, Input, PillGroup, AppModal, Badge, Empty, Pagination } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

type User = { _id: string; name: string; email: string; role: string; archivedAt?: string };
type StudentProfile = {
  user: User;
  course?: { name: string };
  batch?: { name: string };
  performanceScore: number;
  attendancePercent: number;
  paidFees: number;
  totalFees: number;
};
type TeacherProfile = { user: User; qualification?: string; experience?: string };
type DeleteTarget = { user: User; role: "student" | "teacher" };

export default function AdminDatabaseScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);

  const load = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    if (search) params.set("search", search);
    if (tab !== "all") params.set("role", tab);
    api.adminDatabase(params.toString()).then((d) => {
      setStudentProfiles((d.studentProfiles as StudentProfile[]) || []);
      setTeacherProfiles((d.teacherProfiles as TeacherProfile[]) || []);
      if (d.pagination) setPagination(d.pagination as PaginationMeta);
    }).catch(() => toast.error("Failed to load database"));
  };

  useEffect(() => { setPage(1); }, [search, tab]);
  useEffect(() => { load(page); }, [page, search, tab]);

  const openRecord = async (userId: string) => {
    setSelectedId(userId);
    try {
      const data = await api.getPersonRecord(userId);
      setRecord(data);
    } catch { setRecord(null); }
  };

  const removeRecord = (target: DeleteTarget) => {
    const roleLabel = target.role === "student" ? "student" : "teacher";
    Alert.alert(
      "Delete record permanently?",
      `Delete "${target.user.name}" from the database?\n\nAll archived ${roleLabel} data will be permanently removed. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteArchivedRecord(target.user._id);
              if (selectedId === target.user._id) {
                setSelectedId(null);
                setRecord(null);
              }
              load(page);
              toast.success("Record deleted permanently");
            } catch {
              toast.error("Failed to delete record");
            }
          },
        },
      ]
    );
  };

  const user = record?.user as User | undefined;
  const profile = record?.profile as Record<string, unknown> | undefined;
  const attendance = (record?.attendance as { date: string; status: string; batch?: { name: string } }[]) || [];
  const fees = (record?.fees as { amount: number; paidAmount: number; status: string }[]) || [];
  const certificates = (record?.certificates as { type: string; course?: { name: string }; certificateId: string; score?: number; issuedAt: string }[]) || [];

  return (
    <Screen title="Records Database">
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 4 }}>
        Permanent archive — students & teachers removed from active list. All scores, certificates & fees preserved forever.
      </Text>
      <Input value={search} onChangeText={setSearch} placeholder="Search by name or email..." />
      <PillGroup
        options={[{ id: "all", label: "All" }, { id: "student", label: "Students" }, { id: "teacher", label: "Teachers" }]}
        value={tab}
        onChange={setTab}
      />

      {(tab === "all" || tab === "student") && studentProfiles.map((p) => (
        <Card key={p.user._id}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <Pressable style={{ flex: 1 }} onPress={() => openRecord(p.user._id)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.text, fontWeight: "600", flex: 1 }}>{p.user.name}</Text>
                <Badge label="Student" variant="primary" />
              </View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{p.user.email}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                Archived: {p.user.archivedAt ? formatDate(p.user.archivedAt) : "—"}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13, marginTop: 4 }}>
                {p.course?.name} · Score {p.performanceScore} · Attendance {p.attendancePercent}%
              </Text>
            </Pressable>
            <Pressable onPress={() => removeRecord({ user: p.user, role: "student" })} hitSlop={8} style={{ paddingTop: 2 }}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </Pressable>
          </View>
        </Card>
      ))}

      {(tab === "all" || tab === "teacher") && teacherProfiles.map((p) => (
        <Card key={p.user._id}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <Pressable style={{ flex: 1 }} onPress={() => openRecord(p.user._id)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.text, fontWeight: "600", flex: 1 }}>{p.user.name}</Text>
                <Badge label="Teacher" variant="warning" />
              </View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{p.user.email}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                Archived: {p.user.archivedAt ? formatDate(p.user.archivedAt) : "—"}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13, marginTop: 4 }}>{p.qualification} · {p.experience}</Text>
            </Pressable>
            <Pressable onPress={() => removeRecord({ user: p.user, role: "teacher" })} hitSlop={8} style={{ paddingTop: 2 }}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </Pressable>
          </View>
        </Card>
      ))}

      {studentProfiles.length === 0 && teacherProfiles.length === 0 && (
        <Empty message="No archived records yet. When you archive a student or teacher, they appear here with full history." />
      )}

      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <AppModal visible={!!selectedId} title={user?.name || "Full Record"} onClose={() => { setSelectedId(null); setRecord(null); }}>
        {user && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <Text style={{ color: colors.muted }}>{user.email} · {user.role}</Text>
              <Pressable
                onPress={() => removeRecord({ user, role: user.role === "teacher" ? "teacher" : "student" })}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fef2f2", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
              >
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600" }}>Delete record</Text>
              </Pressable>
            </View>
            {profile && (
              <Text style={{ color: colors.text, marginTop: 8 }}>
                Performance: {(profile as { performanceScore?: number }).performanceScore ?? "—"} ·
                Attendance: {(profile as { attendancePercent?: number }).attendancePercent ?? "—"}%
              </Text>
            )}
            {certificates.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>Certificates</Text>
                {certificates.map((c, i) => (
                  <Text key={i} style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                    {c.type} — {c.course?.name} · ID: {c.certificateId}{c.score ? ` · Score: ${c.score}` : ""}
                  </Text>
                ))}
              </View>
            )}
            {fees.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>Fee History</Text>
                {fees.slice(0, 5).map((f, i) => (
                  <Text key={i} style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                    {formatCurrency(f.amount)} — {f.status} (paid {formatCurrency(f.paidAmount)})
                  </Text>
                ))}
              </View>
            )}
            {attendance.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>Attendance ({attendance.length} records)</Text>
                {attendance.slice(0, 5).map((a, i) => (
                  <Text key={i} style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                    {formatDate(a.date)} — {a.status} · {a.batch?.name}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}
      </AppModal>
    </Screen>
  );
}