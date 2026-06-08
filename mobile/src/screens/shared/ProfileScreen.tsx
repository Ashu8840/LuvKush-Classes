import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { api, StudentProfile, TeacherProfile } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Screen, Card, Button } from "../../components/ui";
import { ChangePasswordSection } from "../../components/profile/ChangePasswordSection";

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function maskAadhaar(value?: string) {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "—";
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.fieldHeader}>
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
        <Ionicons name="lock-closed-outline" size={12} color={colors.muted} />
      </View>
      <Text style={[styles.fieldValue, { color: colors.text }]}>{value || "—"}</Text>
    </View>
  );
}

export default function ProfileScreen({ role }: { role: "student" | "teacher" | "admin" }) {
  const { colors } = useTheme();
  const { user, setUserAvatar } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getMe()
      .then((data) => setProfile(data.profile))
      .catch(() => Alert.alert("Error", "Could not load profile"))
      .finally(() => setLoading(false));
  }, []);

  const pickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);
      const { url } = await api.uploadAvatar(
        asset.uri,
        asset.name || "avatar.jpg",
        asset.mimeType || "image/jpeg"
      );
      const { user: updated } = await api.updateProfile({ avatar: url });
      setUserAvatar(updated.avatar || url);
      Alert.alert("Success", "Profile photo updated");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const studentProfile = role === "student" ? (profile as StudentProfile | null) : null;
  const teacherProfile = role === "teacher" ? (profile as TeacherProfile | null) : null;

  return (
    <Screen>
      <Card style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.primaryLight }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.initials, { color: colors.primary }]}>{getInitials(user?.name || "?")}</Text>
            )}
          </View>
          <Pressable
            onPress={pickAvatar}
            disabled={uploading}
            style={[styles.cameraBtn, { backgroundColor: colors.primary, borderColor: colors.card }]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <Ionicons name="camera" size={16} color={colors.primaryText} />
            )}
          </Pressable>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.role, { color: colors.muted }]}>{role}</Text>
        <Text style={[styles.email, { color: colors.muted }]}>{user?.email}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          {role === "admin"
            ? "You can update your profile photo and password. Other account details are managed by the institute."
            : "Only your profile photo can be changed. Institute records are managed by admin."}
        </Text>
        <Button label="Change Profile Photo" onPress={pickAvatar} disabled={uploading} small />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>
      <View style={styles.grid}>
        <ReadOnlyField label="Full Name" value={user?.name || ""} />
        <ReadOnlyField label="Email" value={user?.email || ""} />
        <ReadOnlyField label="Phone" value={user?.phone || ""} />
        <ReadOnlyField label="Member Since" value={user?.createdAt ? formatDate(user.createdAt) : ""} />
        {role === "admin" && (
          <ReadOnlyField label="Last Login" value={user?.lastLogin ? formatDate(user.lastLogin) : ""} />
        )}
      </View>

      {role === "admin" && (
        <Card style={{ marginTop: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            You have full access to manage students, teachers, courses, fees, exams, and institute records.
          </Text>
        </Card>
      )}

      <ChangePasswordSection />

      {role === "student" && studentProfile && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Records</Text>
          <View style={styles.grid}>
            <ReadOnlyField label="Course" value={studentProfile.course?.name || ""} />
            <ReadOnlyField label="Batch" value={studentProfile.batch?.name || ""} />
            <ReadOnlyField label="Assigned Teacher" value={studentProfile.teacher?.name || ""} />
            <ReadOnlyField
              label="Admission Date"
              value={studentProfile.admissionDate ? formatDate(studentProfile.admissionDate) : ""}
            />
            <ReadOnlyField label="Attendance" value={`${studentProfile.attendancePercent ?? 0}%`} />
            <ReadOnlyField label="Performance Score" value={String(studentProfile.performanceScore ?? 0)} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fee Status</Text>
          <View style={styles.grid}>
            <ReadOnlyField label="Fees Status" value={studentProfile.feesStatus || ""} />
            <ReadOnlyField
              label="Paid / Total"
              value={`${formatCurrency(studentProfile.paidFees ?? 0)} / ${formatCurrency(studentProfile.totalFees ?? 0)}`}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal & Parent Details</Text>
          <View style={styles.grid}>
            <ReadOnlyField
              label="Date of Birth"
              value={studentProfile.dateOfBirth ? formatDate(studentProfile.dateOfBirth) : ""}
            />
            <ReadOnlyField label="Address" value={studentProfile.address || ""} />
            <ReadOnlyField label="Parent Name" value={studentProfile.parentName || ""} />
            <ReadOnlyField label="Parent Phone" value={studentProfile.parentPhone || ""} />
            <ReadOnlyField label="Aadhaar" value={maskAadhaar(studentProfile.aadhaarNumber)} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Progress & Achievements</Text>
          <View style={styles.grid}>
            <ReadOnlyField label="Level" value={String(studentProfile.level ?? 1)} />
            <ReadOnlyField label="XP" value={String(studentProfile.xp ?? 0)} />
            <ReadOnlyField label="Streak" value={`${studentProfile.streak ?? 0} days`} />
            <ReadOnlyField
              label="Badges"
              value={studentProfile.badges?.length ? studentProfile.badges.join(", ") : "No badges yet"}
            />
          </View>
        </>
      )}

      {role === "teacher" && teacherProfile && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Details</Text>
          <View style={styles.grid}>
            <ReadOnlyField label="Qualification" value={teacherProfile.qualification || ""} />
            <ReadOnlyField label="Experience" value={teacherProfile.experience || ""} />
            <ReadOnlyField
              label="Joining Date"
              value={teacherProfile.joiningDate ? formatDate(teacherProfile.joiningDate) : ""}
            />
            <ReadOnlyField label="Rating" value={`${teacherProfile.rating ?? 5} / 5`} />
            <ReadOnlyField label="Performance Score" value={String(teacherProfile.performanceScore ?? 0)} />
            <ReadOnlyField
              label="Subjects"
              value={teacherProfile.subjects?.length ? teacherProfile.subjects.join(", ") : ""}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Assigned Batches</Text>
          {teacherProfile.batches?.length ? (
            <View style={styles.grid}>
              {teacherProfile.batches.map((batch) => (
                <ReadOnlyField
                  key={batch._id}
                  label={batch.name}
                  value={[batch.timing, batch.type].filter(Boolean).join(" · ")}
                />
              ))}
            </View>
          ) : (
            <Card>
              <Text style={{ color: colors.muted, fontSize: 14 }}>No batches assigned yet.</Text>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: "center", marginBottom: 8 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  initials: { fontSize: 28, fontWeight: "700" },
  cameraBtn: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 22, fontWeight: "700" },
  role: { fontSize: 13, textTransform: "capitalize", marginTop: 2 },
  email: { fontSize: 13, marginTop: 4 },
  hint: { fontSize: 11, textAlign: "center", marginTop: 12, marginBottom: 12, lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 10 },
  grid: { gap: 10 },
  field: { borderWidth: 1, borderRadius: 12, padding: 12 },
  fieldHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  fieldValue: { fontSize: 14, fontWeight: "500" },
});