import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { Card, Badge } from "../ui";

type UserInfo = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  recoverablePassword?: string;
};

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function UserManagementCard({
  user,
  children,
  actions,
}: {
  user: UserInfo;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.avatar, { borderColor: colors.primary + "55", backgroundColor: colors.primaryLight }]}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
          ) : (
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>{getInitials(user.name)}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{user.email}</Text>
              {user.phone ? <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{user.phone}</Text> : null}
            </View>
            <Badge label={user.isActive ? "Active" : "Blocked"} variant={user.isActive ? "success" : "danger"} />
          </View>
        </View>
      </View>

      <View style={[styles.passwordRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Ionicons name="key-outline" size={14} color={colors.muted} />
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600" }}>Login Password:</Text>
        <Text style={[styles.passwordText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          {user.recoverablePassword
            ? showPassword
              ? user.recoverablePassword
              : "••••••••"
            : "Not recorded"}
        </Text>
        {user.recoverablePassword ? (
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ marginTop: 10, gap: 4 }}>{children}</View>
      <View style={styles.actions}>{actions}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  nameRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 16, fontWeight: "600" },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  passwordText: { fontFamily: "monospace", fontSize: 13 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
});