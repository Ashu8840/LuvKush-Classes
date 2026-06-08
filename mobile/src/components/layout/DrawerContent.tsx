import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { UserRole } from "../../lib/api";
import { BrandLogo } from "../BrandLogo";

export type NavItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const ADMIN_NAV: NavItem[] = [
  { name: "AdminDashboard", label: "Dashboard", icon: "grid-outline" },
  { name: "AdminStudents", label: "Students", icon: "people-outline" },
  { name: "AdminTeachers", label: "Teachers", icon: "school-outline" },
  { name: "AdminCourses", label: "Courses", icon: "book-outline" },
  { name: "AdminBatches", label: "Batches", icon: "calendar-outline" },
  { name: "AdminAttendance", label: "Attendance Reports", icon: "checkbox-outline" },
  { name: "AdminFees", label: "Fees", icon: "wallet-outline" },
  { name: "AdminExams", label: "Exams", icon: "document-text-outline" },
  { name: "AdminCertifications", label: "Certifications", icon: "ribbon-outline" },
  { name: "AdminTypingLibrary", label: "Typing Library", icon: "keypad-outline" },
  { name: "AdminAnnouncements", label: "Announcements", icon: "megaphone-outline" },
  { name: "AdminStudentFeedback", label: "Feedback & Contact", icon: "chatbox-ellipses-outline" },
  { name: "AdminReports", label: "Reports", icon: "bar-chart-outline" },
  { name: "AdminDatabase", label: "Database", icon: "server-outline" },
];

export const TEACHER_NAV: NavItem[] = [
  { name: "TeacherDashboard", label: "Dashboard", icon: "grid-outline" },
  { name: "TeacherStudents", label: "Students", icon: "people-outline" },
  { name: "TeacherAttendance", label: "Attendance", icon: "checkbox-outline" },
  { name: "TeacherClasses", label: "Live Classes", icon: "videocam-outline" },
  { name: "TeacherExams", label: "Exams", icon: "document-text-outline" },
  { name: "TeacherShorthand", label: "Shorthand", icon: "mic-outline" },
  { name: "TeacherTypingLibrary", label: "Typing Library", icon: "keypad-outline" },
  { name: "TeacherAnnouncements", label: "Announcements", icon: "megaphone-outline" },
  { name: "TeacherMaterials", label: "Library (Public)", icon: "folder-open-outline" },
  { name: "TeacherLearningModules", label: "Learning Modules", icon: "book-outline" },
];

export const STUDENT_NAV: NavItem[] = [
  { name: "StudentDashboard", label: "Dashboard", icon: "grid-outline" },
  { name: "StudentCourses", label: "Learning Modules", icon: "book-outline" },
  { name: "StudentAnnouncements", label: "Announcements", icon: "megaphone-outline" },
  { name: "StudentTyping", label: "Typing Practice", icon: "keypad-outline" },
  { name: "StudentShorthand", label: "Shorthand", icon: "mic-outline" },
  { name: "StudentLiveClasses", label: "Live Classes", icon: "videocam-outline" },
  { name: "StudentExams", label: "Exams", icon: "document-text-outline" },
  { name: "StudentLeaderboard", label: "Leaderboard", icon: "trophy-outline" },
  { name: "StudentAnalytics", label: "Analytics", icon: "stats-chart-outline" },
  { name: "StudentFees", label: "Fees", icon: "wallet-outline" },
  { name: "StudentLibrary", label: "Library", icon: "library-outline" },
  { name: "StudentCertificates", label: "Certificates", icon: "ribbon-outline" },
  { name: "StudentAICoach", label: "AI Coach", icon: "chatbubble-ellipses-outline" },
  { name: "StudentFeedback", label: "Feedback", icon: "chatbox-outline" },
];

export const PARENT_NAV: NavItem[] = [
  { name: "ParentDashboard", label: "Dashboard", icon: "grid-outline" },
  { name: "ParentAttendance", label: "Attendance", icon: "checkbox-outline" },
  { name: "ParentFees", label: "Fees", icon: "wallet-outline" },
  { name: "ParentProgress", label: "Progress", icon: "trending-up-outline" },
  { name: "ParentCertificates", label: "Certificates", icon: "ribbon-outline" },
];

const PROFILE_ROUTES: Partial<Record<UserRole, string>> = {
  admin: "AdminProfile",
  student: "StudentProfile",
  teacher: "TeacherProfile",
};

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function AppDrawerContent({ role, ...props }: DrawerContentComponentProps & { role: UserRole }) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const nav =
    role === "admin" ? ADMIN_NAV
    : role === "teacher" ? TEACHER_NAV
    : role === "parent" ? PARENT_NAV
    : STUDENT_NAV;
  const activeRoute = props.state.routes[props.state.index]?.name;
  const profileRoute = PROFILE_ROUTES[role];

  return (
    <View style={[styles.drawerRoot, { backgroundColor: colors.card }]}>
      <View style={[styles.brandHeader, { paddingTop: insets.top + 35, borderBottomColor: colors.border }]}>
        <BrandLogo size="md" framed compact />
        <Text style={[styles.panelLabel, { color: colors.text }]}>{role} Panel</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nav}>
          {nav.map((item) => {
            const active = activeRoute === item.name;
            return (
              <Pressable
                key={item.name}
                onPress={() => props.navigation.navigate(item.name)}
                style={[styles.navItem, active && { backgroundColor: colors.primaryLight }]}
              >
                <Ionicons name={item.icon} size={20} color={active ? colors.accent : colors.muted} />
                <Text
                  style={[
                    styles.navLabel,
                    { color: active ? colors.accent : colors.muted },
                    active && { fontWeight: "700" },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        {profileRoute ? (
          <Pressable
            onPress={() => props.navigation.navigate(profileRoute)}
            style={[
              styles.profileLink,
              activeRoute === profileRoute && { backgroundColor: colors.primaryLight },
            ]}
          >
            <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.primaryLight }]}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarInitials, { color: colors.accent }]}>
                  {getInitials(user?.name || "?")}
                </Text>
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{user?.name}</Text>
              <Text style={[styles.userEmail, { color: colors.muted }]} numberOfLines={1}>{user?.email}</Text>
              <Text style={[styles.viewProfile, { color: colors.accent }]}>View Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        ) : (
          <>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>{user?.email}</Text>
          </>
        )}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surface : colors.card,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={16} color={colors.muted} />
          <Text style={[styles.logoutBtnText, { color: colors.text }]}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerRoot: { flex: 1 },
  brandHeader: {
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  panelLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 5, paddingBottom: 8 },
  nav: { paddingHorizontal: 16 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  navLabel: { fontSize: 14 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  profileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarInitials: { fontSize: 14, fontWeight: "700" },
  profileText: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: "600" },
  userEmail: { fontSize: 12, marginTop: 2 },
  viewProfile: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutBtnText: { fontSize: 14, fontWeight: "600" },
});