import { useEffect, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { ThemeSelector } from "../components/layout/ThemeSelector";
import { FloatingSquares } from "../components/public/FloatingSquares";
import { FadeInView } from "../components/public/FadeInView";
import { useTheme } from "../contexts/ThemeContext";
import type { PublicStackParamList } from "../navigation/PublicNavigator";

const ACCENT = "#facc15";
const ACCENT_DARK = "#ca8a04";

const highlights = [
  { icon: "book-outline" as const, text: "Courses, batches & live classes" },
  { icon: "sparkles-outline" as const, text: "AI-powered study guidance" },
  { icon: "school-outline" as const, text: "Typing, shorthand & certificates" },
];

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const { login } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg.includes("Cannot reach") ? msg : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          keyboardOpen && styles.scrollKeyboard,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => navigation.navigate("Home")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: "700", marginLeft: 4, fontSize: 14 }}>Home</Text>
          </Pressable>
          <ThemeSelector />
        </View>

        {/* Branding collapses while typing — form inputs stay mounted */}
        {!keyboardOpen && (
          <View style={[styles.panel, { backgroundColor: colors.background }]}>
            <FloatingSquares />
            <View style={styles.panelInner}>
              <FadeInView delay={0}>
                <View style={styles.portalBadge}>
                  <Ionicons name="sparkles" size={14} color={ACCENT_DARK} />
                  <Text style={styles.portalBadgeText}>STUDENT & STAFF PORTAL</Text>
                </View>
              </FadeInView>

              <FadeInView delay={150}>
                <Text style={[styles.headline, { color: colors.text }]}>
                  WELCOME TO{" "}
                  <Text style={{ color: ACCENT_DARK }}>LUV KUSH</Text>
                </Text>
              </FadeInView>

              <FadeInView delay={350}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>COACHING CENTER</Text>
                </View>
              </FadeInView>

              <FadeInView delay={500}>
                <Text style={[styles.subtext, { color: colors.muted }]}>
                  Shorthand, typing, computer fundamentals, Tally, and digital literacy —
                  built for students, job seekers, and working professionals.
                </Text>
              </FadeInView>

              <FadeInView delay={650}>
                {highlights.map((h) => (
                  <View key={h.text} style={styles.highlightRow}>
                    <View style={styles.highlightIcon}>
                      <Ionicons name={h.icon} size={16} color={ACCENT_DARK} />
                    </View>
                    <Text style={{ color: colors.text, fontSize: 13, flex: 1 }}>{h.text}</Text>
                  </View>
                ))}
              </FadeInView>
            </View>
          </View>
        )}

        {/* Sign-in card — always the same instance, never remounted */}
        <View style={[styles.panel, styles.formPanel, { backgroundColor: colors.background }]}>
          {!keyboardOpen && <FloatingSquares />}
          <View style={styles.formCardWrap}>
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>SIGN IN</Text>
              <Text style={[styles.formSub, { color: colors.muted }]}>
                Enter your credentials to access your dashboard
              </Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>

              <Pressable
                style={[styles.signInBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.signInBtnText}>SIGN IN</Text>
                    <Ionicons name="arrow-forward" size={16} color="#000" />
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  scrollKeyboard: { paddingTop: 8 },
  panel: { position: "relative", overflow: "hidden" },
  panelInner: { position: "relative", zIndex: 1, paddingTop: 8, paddingBottom: 20 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 2, marginBottom: 8 },
  backBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  portalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  portalBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, color: ACCENT_DARK },
  headline: { fontSize: 32, fontWeight: "900", lineHeight: 38, marginTop: 20, letterSpacing: -0.5 },
  heroBadge: { marginTop: 12, alignSelf: "flex-start", backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 8 },
  heroBadgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 2, color: "#000" },
  subtext: { fontSize: 14, lineHeight: 22, marginTop: 16, maxWidth: 340 },
  highlightRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  highlightIcon: { borderRadius: 10, padding: 8, backgroundColor: "rgba(250, 204, 21, 0.15)" },
  formPanel: { paddingTop: 4, paddingBottom: 32 },
  formCardWrap: { position: "relative", zIndex: 1 },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  formTitle: { fontSize: 26, fontWeight: "900", letterSpacing: -0.3 },
  formSub: { marginTop: 6, marginBottom: 20, fontSize: 14, lineHeight: 20 },
  inputLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, color: "#71717a", marginBottom: 6, marginTop: 4 },
  inputWrap: { position: "relative", marginBottom: 12 },
  inputIcon: { position: "absolute", left: 14, top: 15, zIndex: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, paddingLeft: 44, fontSize: 16 },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 24,
    paddingVertical: 15,
    marginTop: 8,
    backgroundColor: ACCENT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  signInBtnText: { fontWeight: "800", fontSize: 13, letterSpacing: 1, color: "#000" },
  error: { color: "#ef4444", marginBottom: 12, fontSize: 13 },
});