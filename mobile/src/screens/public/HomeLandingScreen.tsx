import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, Image, Pressable, StyleSheet, Linking, Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "../../components/BrandLogo";
import { ThemeSelector } from "../../components/layout/ThemeSelector";
import { TestimonialsCarousel } from "../../components/public/TestimonialsCarousel";
import { ContactForm } from "../../components/public/ContactForm";
import { FloatingSquares } from "../../components/public/FloatingSquares";
import { FadeInView } from "../../components/public/FadeInView";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicStackParamList } from "../../navigation/PublicNavigator";

const ACCENT = "#facc15";
const ACCENT_DARK = "#ca8a04";
const SCREEN_WIDTH = Dimensions.get("window").width;
const PORTRAIT_WIDTH = Math.min(SCREEN_WIDTH - 48, 300);
const PORTRAIT_HEIGHT = Math.round(PORTRAIT_WIDTH * (4 / 3));

const EXPERTISE = [
  "Computer Fundamentals & History of Computers",
  "Operating Systems (Windows)",
  "Computer Hardware & Software",
  "MS Office (Word, Excel, PowerPoint)",
  "Tally Prime & Accounting Fundamentals",
  "Internet & Digital Literacy",
  "Online Ticket Booking & E-Services",
  "Basic Troubleshooting & Practical Applications",
];

const FEATURES = [
  { icon: "keypad-outline" as const, title: "Typing Practice", desc: "Hindi & English typing with WPM tracking, accuracy analysis, and leaderboards." },
  { icon: "mic-outline" as const, title: "Shorthand Dictation", desc: "Audio dictation at 80, 100, 120, and 140 WPM speeds with evaluation." },
  { icon: "book-outline" as const, title: "Complete Coaching", desc: "Courses, batches, exams, certificates, and AI-powered study plans." },
  { icon: "sparkles-outline" as const, title: "AI Study Coach", desc: "Personalized guidance, doubt solving, and practice recommendations." },
  { icon: "ribbon-outline" as const, title: "Certificates", desc: "Verified digital certificates for course completion and achievements." },
  { icon: "videocam-outline" as const, title: "Live Classes", desc: "Interactive online sessions with attendance, chat, and screen sharing." },
];

type Props = NativeStackScreenProps<PublicStackParamList, "Home">;

export default function HomeLandingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navBarHeight, setNavBarHeight] = useState(insets.top + 88);
  const sectionY = useRef<Record<string, number>>({});
  const navHeight = navBarHeight;

  const scrollTo = (key: string) => {
    setMenuOpen(false);
    const y = sectionY.current[key] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - navHeight), animated: true });
  };

  const NAV = [
    { key: "home", label: "Home" },
    { key: "about", label: "About" },
    { key: "testimonials", label: "Testimonials" },
    { key: "contact", label: "Contact Us" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        onLayout={(e) => setNavBarHeight(e.nativeEvent.layout.height)}
        style={[
          styles.navbar,
          {
            paddingTop: insets.top + 4,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            zIndex: 102,
          },
        ]}
      >
        <View style={styles.logoWrap}>
          <BrandLogo size="xs" framed compact />
        </View>
        <View style={styles.navRight}>
          <ThemeSelector />
          <Pressable onPress={() => setMenuOpen((v) => !v)} style={styles.menuBtn}>
            <Ionicons name={menuOpen ? "close" : "menu"} size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — content panel */}
        <View
          onLayout={(e) => { sectionY.current.home = e.nativeEvent.layout.y; }}
          style={[styles.heroPanel, { backgroundColor: colors.background }]}
        >
          <FloatingSquares />
          <View style={styles.heroInner}>
            <FadeInView delay={0}>
              <Text style={[styles.heroEyebrow, { color: colors.text }]}>
                LUV KUSH COACHING CENTER
              </Text>
            </FadeInView>

            <FadeInView delay={200}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                LEARN{" "}
                <Text style={{ color: ACCENT_DARK }}>SKILLS THAT</Text>
              </Text>
            </FadeInView>

            <FadeInView delay={500}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>BUILD YOUR FUTURE</Text>
              </View>
            </FadeInView>

            <FadeInView delay={800}>
              <Text style={[styles.heroSub, { color: colors.muted }]}>
                Shorthand, typing, computer fundamentals, Tally, and digital literacy —
                built for students, job seekers, and working professionals.
              </Text>
            </FadeInView>

            <FadeInView delay={1100} style={styles.heroActions}>
              <Pressable
                onPress={() => navigation.navigate("Login")}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>GET STARTED</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </Pressable>
              <Pressable onPress={() => scrollTo("about")} style={styles.ghostBtn}>
                <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 12, letterSpacing: 1 }}>
                  MEET THE INSTRUCTOR
                </Text>
              </Pressable>
            </FadeInView>
          </View>
        </View>

        {/* Hero — portrait panel */}
        <View style={[styles.heroImagePanel, { backgroundColor: colors.background }]}>
          <FloatingSquares />
          <FadeInView delay={300} style={styles.portraitOuter}>
            <View style={styles.portraitShadow}>
              <View style={styles.portraitFrame}>
                <Image
                  source={require("../../../assets/owner.png")}
                  style={styles.ownerImg}
                  resizeMode="cover"
                />
              </View>
            </View>
          </FadeInView>
        </View>

        {/* About */}
        <View
          onLayout={(e) => { sectionY.current.about = e.nativeEvent.layout.y; }}
          style={[styles.section, styles.aboutSection, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.eyebrow, { color: colors.accent }]}>ABOUT</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hi, I&apos;m Lavkush</Text>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18, marginTop: 4 }}>LuvKush Tiwari</Text>
          <Text style={[styles.body, { color: colors.muted, marginTop: 10 }]}>
            Computer Instructor &amp; Tally Trainer dedicated to helping students build strong digital and accounting skills.
          </Text>
          <Text style={[styles.quote, { color: colors.text, borderLeftColor: ACCENT }]}>
            &ldquo;Learn Skills That Build Your Future.&rdquo;
          </Text>
          <Text style={[styles.body, { color: colors.muted, marginTop: 14 }]}>
            With hands-on teaching experience, I focus on practical learning that prepares students for real-world office,
            business, and professional environments.
          </Text>
          <Text style={[styles.listTitle, { color: colors.text }]}>My Expertise Includes</Text>
          {EXPERTISE.map((item) => (
            <View key={item} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={16} color={ACCENT_DARK} />
              <Text style={{ color: colors.text, fontSize: 13, flex: 1, lineHeight: 19 }}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Platform Features */}
        <View style={[styles.section, styles.featuresSection, { backgroundColor: colors.background }]}>
          <FloatingSquares />
          <View style={styles.featuresInner}>
            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: "center" }]}>
              PLATFORM FEATURES
            </Text>
            <Text style={[styles.body, { color: colors.muted, marginBottom: 20, textAlign: "center" }]}>
              Everything you need to master shorthand, typing, and professional computer skills.
            </Text>
            {FEATURES.map((f, i) => (
              <FadeInView key={f.title} delay={i * 80} style={styles.featureCardWrap}>
                <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon} size={24} color={ACCENT_DARK} />
                  </View>
                  <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15, marginTop: 12, letterSpacing: 0.5 }}>
                    {f.title.toUpperCase()}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{f.desc}</Text>
                </View>
              </FadeInView>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View
          onLayout={(e) => { sectionY.current.testimonials = e.nativeEvent.layout.y; }}
          style={[styles.section, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.eyebrow, { color: colors.accent }]}>STUDENT VOICES</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What Our Students Say</Text>
          <TestimonialsCarousel />
        </View>

        {/* Contact */}
        <View
          onLayout={(e) => { sectionY.current.contact = e.nativeEvent.layout.y; }}
          style={[styles.section, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
          <Text style={[styles.body, { color: colors.muted, marginBottom: 14 }]}>
            Send us a message and we&apos;ll get back to you about courses, batches, or admissions.
          </Text>
          {[
            { icon: "location-outline" as const, label: "Location", value: "Luv Kush Coaching Center" },
            { icon: "call-outline" as const, label: "Phone", value: "Contact institute for details" },
            { icon: "mail-outline" as const, label: "Email", value: "info@luvkushclasses.com" },
          ].map((c) => (
            <Pressable
              key={c.label}
              onPress={() => c.label === "Email" && Linking.openURL("mailto:info@luvkushclasses.com")}
              style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name={c.icon} size={20} color={colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14 }}>{c.label}</Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{c.value}</Text>
              </View>
            </Pressable>
          ))}
          <View style={{ marginTop: 16 }}>
            <ContactForm />
          </View>
          <Pressable onPress={() => navigation.navigate("Login")} style={[styles.primaryBtn, { marginTop: 16, alignSelf: "center" }]}>
            <Text style={styles.primaryBtnText}>ENROLL NOW</Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.muted }]}>
          © 2026 Luv Kush Coaching Center
        </Text>
      </ScrollView>

      {menuOpen && (
        <View style={styles.menuOverlay} pointerEvents="box-none">
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Close menu"
          />
          <View
            style={[
              styles.menuDropdown,
              {
                top: navBarHeight,
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            {NAV.map((item) => (
              <Pressable key={item.key} onPress={() => scrollTo(item.key)} style={styles.menuItem}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => { setMenuOpen(false); navigation.navigate("Login"); }}
              style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.primaryText, fontWeight: "700" }}>Login</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  logoWrap: { marginTop: 23 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  menuBtn: { padding: 6 },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 101,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  menuDropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 14,
  },
  menuItem: { paddingVertical: 11 },
  loginBtn: { borderRadius: 20, paddingVertical: 10, alignItems: "center", marginTop: 4 },
  heroPanel: { position: "relative", overflow: "hidden", paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  heroInner: { position: "relative", zIndex: 1 },
  heroEyebrow: { fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  heroTitle: { fontSize: 36, fontWeight: "900", lineHeight: 42, marginTop: 8, letterSpacing: -0.5 },

  heroBadge: { marginTop: 12, alignSelf: "flex-start", backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 8 },
  heroBadgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 2, color: "#000" },
  heroSub: { fontSize: 14, lineHeight: 22, marginTop: 16, maxWidth: 340 },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 22 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 13,
    backgroundColor: ACCENT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 1 },
  ghostBtn: { borderRadius: 24, paddingHorizontal: 18, paddingVertical: 13, justifyContent: "center" },
  heroImagePanel: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  portraitOuter: {
    position: "relative",
    zIndex: 1,
    width: PORTRAIT_WIDTH,
    alignSelf: "center",
  },
  portraitShadow: {
    width: PORTRAIT_WIDTH,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  portraitFrame: {
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0a0a0a",
  },
  ownerImg: {
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT,
  },
  section: { paddingHorizontal: 20, paddingVertical: 32 },
  aboutSection: { marginTop: 0 },
  featuresSection: { position: "relative", overflow: "hidden" },
  featuresInner: { position: "relative", zIndex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  sectionTitle: { fontSize: 26, fontWeight: "900", marginTop: 8, letterSpacing: -0.3 },
  body: { fontSize: 14, lineHeight: 22 },
  quote: {
    marginTop: 14,
    paddingLeft: 12,
    borderLeftWidth: 4,
    fontSize: 16,
    fontWeight: "700",
    fontStyle: "italic",
  },
  listTitle: { fontSize: 12, fontWeight: "800", marginTop: 18, marginBottom: 8, letterSpacing: 1 },
  listItem: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  featureCardWrap: { marginBottom: 12 },
  featureCard: { borderRadius: 20, borderWidth: 1, padding: 20 },
  featureIcon: { alignSelf: "flex-start", borderRadius: 14, padding: 12, backgroundColor: "rgba(250, 204, 21, 0.2)" },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  footer: { textAlign: "center", fontSize: 12, paddingVertical: 20 },
});