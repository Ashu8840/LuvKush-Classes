import React, { useState } from "react";
import { View, Pressable, Modal, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ColorTheme } from "../../contexts/ThemeContext";

const THEMES: { id: ColorTheme; color: string; label: string }[] = [
  { id: "pink", color: "#f9a8d4", label: "Pink" },
  { id: "green", color: "#86efac", label: "Green" },
  { id: "blue", color: "#93c5fd", label: "Blue" },
  { id: "orange", color: "#fdba74", label: "Orange" },
  { id: "mono", color: "#18181b", label: "Black" },
];

export function ThemeSelector() {
  const { colors, colorTheme, setColorTheme, isDark, toggleDark } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.row}>
      <Pressable onPress={toggleDark} style={[styles.iconBtn, { borderColor: colors.border }]}>
        <Ionicons name={isDark ? "sunny" : "moon"} size={18} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => setOpen(true)} style={[styles.iconBtn, { borderColor: colors.border }]}>
        <Ionicons name="color-palette" size={18} color={colors.text} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.menuTitle, { color: colors.muted }]}>Color Theme</Text>
            {THEMES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => { setColorTheme(t.id); setOpen(false); }}
                style={[styles.menuItem, colorTheme === t.id && { backgroundColor: colors.primaryLight }]}
              >
                <View style={[styles.dot, { backgroundColor: t.color, borderColor: colors.border }]} />
                <Text style={{ color: colors.text, fontWeight: colorTheme === t.id ? "700" : "400" }}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  iconBtn: { borderWidth: 1, borderRadius: 12, padding: 8 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 56, paddingRight: 12 },
  menu: { width: 180, borderRadius: 16, borderWidth: 1, padding: 12 },
  menuTitle: { fontSize: 11, fontWeight: "600", marginBottom: 8, paddingHorizontal: 4 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
});