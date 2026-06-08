import { ActivityIndicator, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppRefresh } from "../../contexts/RefreshContext";

export function AppRefreshButton() {
  const { colors } = useTheme();
  const { refreshApp, refreshing } = useAppRefresh();

  return (
    <Pressable onPress={refreshApp} disabled={refreshing} hitSlop={8}>
      {refreshing ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Ionicons name="refresh-outline" size={22} color={colors.text} />
      )}
    </Pressable>
  );
}