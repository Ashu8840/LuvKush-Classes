import React, { useState } from "react";
import {
  View, Text, Pressable, TextInput, Modal, ScrollView,
  ActivityIndicator, StyleSheet, ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

export function Screen({ children, title, action }: {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.screenPad}>
      {(title || action) && (
        <View style={styles.rowBetween}>
          {title ? <Text style={[styles.pageTitle, { color: colors.text }]}>{title}</Text> : <View />}
          {action}
        </View>
      )}
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{title}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {subtitle ? <Text style={[styles.statSub, { color: colors.accent }]}>{subtitle}</Text> : null}
    </Card>
  );
}

export function Button({ label, onPress, variant = "primary", disabled, small }: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
  small?: boolean;
}) {
  const { colors } = useTheme();
  const bg = variant === "primary" ? colors.primary : variant === "danger" ? "#dc2626" : "transparent";
  const fg = variant === "outline" ? colors.text : variant === "danger" ? "#fff" : colors.primaryText;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        small && styles.btnSm,
        { backgroundColor: bg, borderColor: colors.border, opacity: disabled ? 0.6 : 1 },
        variant === "outline" && { borderWidth: 1 },
      ]}
    >
      <Text style={[styles.btnText, { color: fg }, small && styles.btnTextSm]}>{label}</Text>
    </Pressable>
  );
}

export function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, onFocus }: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  onFocus?: () => void;
}) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry ? hidden : false}
          keyboardType={keyboardType}
          onFocus={onFocus}
          style={[
            styles.input,
            secureTextEntry && styles.inputWithIcon,
            { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
          ]}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            style={styles.inputEyeBtn}
            hitSlop={8}
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Badge({ label, variant = "primary" }: { label: string; variant?: "primary" | "success" | "warning" | "danger" }) {
  const { colors } = useTheme();
  const palette: Record<string, { bg: string; fg: string }> = {
    primary: { bg: colors.primaryLight, fg: colors.accent },
    success: { bg: "#f0fdf4", fg: "#16a34a" },
    warning: { bg: "#fffbeb", fg: "#d97706" },
    danger: { bg: "#fef2f2", fg: "#dc2626" },
  };
  const p = palette[variant];
  return (
    <View style={[styles.badge, { backgroundColor: p.bg }]}>
      <Text style={[styles.badgeText, { color: p.fg }]}>{label}</Text>
    </View>
  );
}

export function AppModal({ visible, title, onClose, children }: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose}><Text style={{ color: colors.muted, fontSize: 22 }}>×</Text></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 480 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Loading({ full }: { full?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.loading, full && { flex: 1 }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function Empty({ message }: { message: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.empty, { color: colors.muted }]}>{message}</Text>;
}

export function Pagination({ page, pages, onPageChange }: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}) {
  const { colors } = useTheme();
  if (pages <= 1) return null;
  return (
    <View style={styles.paginationRow}>
      <Pressable
        disabled={page <= 1}
        onPress={() => onPageChange(page - 1)}
        style={{ opacity: page <= 1 ? 0.4 : 1 }}
      >
        <Text style={{ color: colors.accent, fontWeight: "600" }}>Previous</Text>
      </Pressable>
      <Text style={{ color: colors.muted }}>{page} / {pages}</Text>
      <Pressable
        disabled={page >= pages}
        onPress={() => onPageChange(page + 1)}
        style={{ opacity: page >= pages ? 0.4 : 1 }}
      >
        <Text style={{ color: colors.accent, fontWeight: "600" }}>Next</Text>
      </Pressable>
    </View>
  );
}

export function PillGroup({ options, value, onChange }: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.pillRow}>
      {options.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => onChange(o.id)}
          style={[
            styles.pill,
            { borderColor: colors.border },
            value === o.id && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.pillText, { color: value === o.id ? colors.primaryText : colors.text }]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function getStatusBadgeVariant(status: string): "success" | "warning" | "danger" | "primary" {
  if (status === "paid" || status === "approved" || status === "present" || status === "active") return "success";
  if (status === "pending" || status === "partial" || status === "late") return "warning";
  if (status === "rejected" || status === "absent" || status === "suspended") return "danger";
  return "primary";
}

const styles = StyleSheet.create({
  screenPad: { padding: 16, paddingBottom: 32, gap: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  pageTitle: { fontSize: 18, fontWeight: "600" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  statCard: { flex: 1, minWidth: "46%" },
  statLabel: { fontSize: 13, fontWeight: "500" },
  statValue: { fontSize: 28, fontWeight: "700", marginTop: 4 },
  statSub: { fontSize: 11, marginTop: 2 },
  btn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  btnSm: { paddingVertical: 8, paddingHorizontal: 12 },
  btnText: { fontWeight: "600", fontSize: 14 },
  btnTextSm: { fontSize: 12 },
  inputWrap: { gap: 6, marginBottom: 10 },
  inputLabel: { fontSize: 14, fontWeight: "500" },
  inputRow: { position: "relative", justifyContent: "center" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  inputWithIcon: { paddingRight: 44 },
  inputEyeBtn: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  loading: { padding: 40, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", padding: 24, fontSize: 14 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
    marginBottom: 24,
  },
});