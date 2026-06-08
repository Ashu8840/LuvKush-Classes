import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { AppModal } from "./index";

type Option = { id: string; label: string };

export function SelectDropdown({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value) || options[0];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: 14, flex: 1 }} numberOfLines={1}>
          {selected?.label}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>▼</Text>
      </Pressable>

      <AppModal visible={open} title={label} onClose={() => setOpen(false)}>
        <View style={{ gap: 4 }}>
          {options.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => {
                onChange(o.id);
                setOpen(false);
              }}
              style={[
                styles.option,
                {
                  backgroundColor: value === o.id ? colors.primaryLight : "transparent",
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: value === o.id ? colors.primary : colors.text,
                  fontWeight: value === o.id ? "700" : "500",
                  fontSize: 15,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 140 },
  label: { fontSize: 11, fontWeight: "700", marginBottom: 4, textTransform: "uppercase" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});