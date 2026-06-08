import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, findNodeHandle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useTheme } from "../../contexts/ThemeContext";
import { Card, Button, Input } from "../ui";

export function ChangePasswordSection({ scrollRef }: { scrollRef?: React.RefObject<ScrollView | null> }) {
  const { colors } = useTheme();
  const sectionRef = useRef<View>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollToSection = () => {
    if (!scrollRef?.current || !sectionRef.current) return;
    const scrollNode = findNodeHandle(scrollRef.current);
    if (!scrollNode) return;
    sectionRef.current.measureLayout(
      scrollNode,
      (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
      },
      () => scrollRef.current?.scrollToEnd({ animated: true })
    );
  };

  const submit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      Alert.alert("Success", "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View ref={sectionRef} collapsable={false}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="key-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
        </View>
        <Input
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          onFocus={scrollToSection}
        />
        <Input
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          onFocus={scrollToSection}
        />
        <Input
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          onFocus={scrollToSection}
        />
        <Button
          label={loading ? "Updating…" : "Update Password"}
          onPress={submit}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: "700" },
});