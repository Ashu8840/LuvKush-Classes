import { useState } from "react";
import { Platform, Pressable, Text, View, StyleSheet } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDateTime } from "../../lib/utils";

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
};

export function DateTimePickerField({ label, value, onChange, minimumDate }: Props) {
  const { colors } = useTheme();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const selected = value || new Date();

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowDate(false);
    if (date) onChange(date);
  };

  const onTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowTime(false);
    if (date) onChange(date);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setShowDate(true)}
          style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={{ color: colors.text }}>
            {value ? value.toLocaleDateString() : "Select date"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowTime(true)}
          style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={{ color: colors.text }}>
            {value ? value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Select time"}
          </Text>
        </Pressable>
      </View>
      {value && (
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
          Scheduled: {formatDateTime(value.toISOString())}
        </Text>
      )}
      {showDate && (
        <DateTimePicker
          value={selected}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minimumDate}
          onChange={onDateChange}
        />
      )}
      {showTime && (
        <DateTimePicker
          value={selected}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  row: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});