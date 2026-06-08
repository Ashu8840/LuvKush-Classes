import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, FeedbackCategory } from "../../lib/api";
import { FEEDBACK_CATEGORIES } from "../../lib/feedback";
import { useTheme } from "../../contexts/ThemeContext";
import { Screen, Card, Button } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";

type Mode = "feedback" | "testimonial";

export default function StudentFeedbackScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>("feedback");
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [rating, setRating] = useState(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!message.trim()) {
      Alert.alert("Required", "Please write your message before submitting.");
      return;
    }
    if (mode === "testimonial" && rating < 1) {
      Alert.alert("Required", "Please select a star rating for your testimonial.");
      return;
    }
    setLoading(true);
    try {
      await api.submitFeedback({
        category,
        rating: rating || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
        isTestimonial: mode === "testimonial",
      });
      setSubmitted(true);
      setCategory("general");
      setRating(0);
      setSubject("");
      setMessage("");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Screen>
        <Card style={{ alignItems: "center", paddingVertical: 40 }}>
          <Ionicons name="checkmark-circle" size={56} color={colors.accent} />
          <Text style={[styles.successTitle, { color: colors.text }]}>Thank you!</Text>
          <Text style={[styles.successText, { color: colors.muted }]}>
            {mode === "testimonial"
              ? "Your testimonial was submitted. If approved, it may appear on our website homepage."
              : "Your feedback was submitted anonymously. The admin team will review it."}
          </Text>
          <Button label="Submit another" onPress={() => setSubmitted(false)} small />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          onPress={() => setMode("feedback")}
          style={[styles.modeBtn, mode === "feedback" && { backgroundColor: colors.primary }]}
        >
          <Ionicons name="shield-checkmark-outline" size={16} color={mode === "feedback" ? colors.primaryText : colors.muted} />
          <Text style={{ color: mode === "feedback" ? colors.primaryText : colors.muted, fontWeight: "600", fontSize: 13 }}>
            Feedback
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("testimonial")}
          style={[styles.modeBtn, mode === "testimonial" && { backgroundColor: colors.primary }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={mode === "testimonial" ? colors.primaryText : colors.muted} />
          <Text style={{ color: mode === "testimonial" ? colors.primaryText : colors.muted, fontWeight: "600", fontSize: 13 }}>
            Testimonial
          </Text>
        </Pressable>
      </View>

      <Card style={{ marginBottom: 12, backgroundColor: colors.primaryLight }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Ionicons
            name={mode === "feedback" ? "shield-checkmark-outline" : "chatbubble-ellipses-outline"}
            size={28}
            color={colors.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {mode === "feedback" ? "Anonymous Feedback" : "Share a Testimonial"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
              {mode === "feedback"
                ? "Your name and identity are never shown to admin."
                : "Your name, photo, and rating will be visible to admin. Approved testimonials may appear on the homepage."}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        {mode === "feedback" && (
          <SelectDropdown
            label="Category"
            value={category}
            options={FEEDBACK_CATEGORIES.map((c) => ({ id: c.value, label: c.label }))}
            onChange={(v) => setCategory(v as FeedbackCategory)}
          />
        )}

        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
          Star rating {mode === "feedback" ? "(optional)" : "*"}
        </Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n === rating ? 0 : n)}>
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={32}
                color={n <= rating ? "#fbbf24" : colors.muted}
              />
            </Pressable>
          ))}
        </View>

        {mode === "feedback" && (
          <>
            <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Subject (optional)</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Short summary…"
              placeholderTextColor={colors.muted}
              maxLength={120}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            />
          </>
        )}

        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
          {mode === "feedback" ? "Your feedback" : "Your testimonial"}
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={mode === "feedback" ? "What should we improve?" : "Describe your learning experience…"}
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={6}
          maxLength={2000}
          style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{message.length}/2000</Text>

        <Button
          label={loading ? "Submitting…" : mode === "feedback" ? "Submit Anonymous Feedback" : "Submit Testimonial"}
          onPress={submit}
          disabled={loading}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 12, gap: 4 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 10 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  stars: { flexDirection: "row", gap: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  successTitle: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  successText: { fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 16, lineHeight: 20 },
});