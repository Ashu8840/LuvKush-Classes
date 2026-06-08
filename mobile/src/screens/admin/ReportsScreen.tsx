import { View, Text } from "react-native";
import { Screen, Card, Button } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

const REPORTS = ["Student Performance", "Fee Collection", "Attendance Summary", "Exam Results", "Teacher Analytics"];

export default function AdminReportsScreen() {
  const { colors } = useTheme();

  return (
    <Screen title="Reports">
      {REPORTS.map((r) => (
        <Card key={r}>
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>{r}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <Button label="PDF" small />
            <Button label="Excel" variant="outline" small />
          </View>
        </Card>
      ))}
    </Screen>
  );
}