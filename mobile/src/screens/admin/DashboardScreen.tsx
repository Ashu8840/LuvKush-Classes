import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { Screen, StatCard, Card } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

const QUICK_ACTIONS = [
  { label: "Add Student", screen: "AdminStudents" as const, icon: "person-add-outline" as const },
  { label: "Add Teacher", screen: "AdminTeachers" as const, icon: "school-outline" as const },
  { label: "Create Course", screen: "AdminCourses" as const, icon: "book-outline" as const },
  { label: "Manage Fees", screen: "AdminFees" as const, icon: "wallet-outline" as const },
];

type AdminDrawerParamList = {
  AdminDashboard: undefined;
  AdminStudents: undefined;
  AdminTeachers: undefined;
  AdminCourses: undefined;
  AdminFees: undefined;
  AdminDatabase: undefined;
  AdminStudentFeedback: { initialType?: string } | undefined;
};

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [newContacts, setNewContacts] = useState(0);

  useEffect(() => {
    api.adminDashboard().then((d) => setStats((d.stats as Record<string, number>) || {})).catch(() => {});
    api.getAdminFeedback("type=contact&limit=1").then((d) => {
      setNewContacts(d.stats.newContactInquiries);
    }).catch(() => {});
  }, []);

  const cards = [
    { title: "Total Students", value: stats.totalStudents ?? "—" },
    { title: "Active Students", value: stats.activeStudents ?? "—" },
    { title: "Total Teachers", value: stats.totalTeachers ?? "—" },
    { title: "Today's Attendance", value: stats.todayAttendance ?? "—" },
    { title: "Fees Collected", value: stats.feesCollected != null ? formatCurrency(stats.feesCollected) : "—" },
    { title: "Pending Fees", value: stats.pendingFees != null ? formatCurrency(stats.pendingFees) : "—", subtitle: stats.pendingFeesCount ? `${stats.pendingFeesCount} record(s)` : "To collect" },
    { title: "Upcoming Exams", value: stats.upcomingExams ?? "—" },
    { title: "Enrollments", value: stats.courseEnrollments ?? "—" },
  ];

  return (
    <Screen>
      {newContacts > 0 && (
        <Pressable
          onPress={() => navigation.navigate("AdminStudentFeedback", { initialType: "contact" })}
          style={[styles.contactAlert, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}
        >
          <Ionicons name="mail-outline" size={22} color={colors.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {newContacts} new contact inquir{newContacts === 1 ? "y" : "ies"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              Tap to review Contact Us submissions
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      )}
      <View style={styles.grid}>
        {cards.map((c) => <StatCard key={c.title} title={c.title} value={c.value} />)}
      </View>
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        {QUICK_ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => navigation.navigate(a.screen)}
            style={({ pressed }) => [
              styles.actionRow,
              { borderColor: colors.border, backgroundColor: pressed ? colors.primaryLight : "transparent" },
            ]}
          >
            <View style={styles.actionInner}>
              <Ionicons name={a.icon} size={20} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: "500" }}>{a.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>
      <Pressable onPress={() => navigation.navigate("AdminDatabase")}>
        <Card style={{ backgroundColor: colors.primaryLight }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Records Database</Text>
          <Text style={{ color: colors.muted }}>View archived students & teachers — scores, certificates & full history preserved</Text>
        </Card>
      </Pressable>
      <Card style={{ backgroundColor: colors.primaryLight }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Classes</Text>
        <Text style={{ color: colors.muted }}>{stats.liveClasses ?? 0} classes running now</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contactAlert: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  actionInner: { flexDirection: "row", alignItems: "center", gap: 12 },
});