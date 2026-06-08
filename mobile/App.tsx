import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { BrandLogo } from "./src/components/BrandLogo";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { RefreshProvider } from "./src/contexts/RefreshContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { ToastProvider } from "./src/contexts/ToastContext";
import PublicNavigator from "./src/navigation/PublicNavigator";
import AdminNavigator from "./src/navigation/AdminNavigator";
import TeacherNavigator from "./src/navigation/TeacherNavigator";
import StudentNavigator from "./src/navigation/StudentNavigator";
import ParentNavigator from "./src/navigation/ParentNavigator";

function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <BrandLogo size="lg" framed />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <PublicNavigator />
      ) : user.role === "admin" ? (
        <AdminNavigator />
      ) : user.role === "teacher" ? (
        <TeacherNavigator />
      ) : user.role === "parent" ? (
        <ParentNavigator />
      ) : (
        <StudentNavigator />
      )}
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <RefreshProvider>
                <AppNavigator />
              </RefreshProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
});