import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useTheme } from "../../contexts/ThemeContext";
import { Card, Button, Input } from "../ui";

export function ChangePasswordSection() {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <Card style={{ marginTop: 16 }}>
      <View style={styles.header}>
        <Ionicons name="key-outline" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
      </View>
      <Input
        label="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      <Input
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <Input
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Button
        label={loading ? "Updating…" : "Update Password"}
        onPress={submit}
        disabled={loading || !currentPassword || !newPassword || !confirmPassword}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "700" },
});