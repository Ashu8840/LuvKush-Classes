import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useTheme } from "../../contexts/ThemeContext";
import { Button, Card } from "../ui";

export function ContactForm() {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      Alert.alert("Required", "Please fill in name, email, phone, and message.");
      return;
    }
    setLoading(true);
    try {
      await api.submitContactInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      setSubmitted(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card style={{ alignItems: "center", paddingVertical: 28 }}>
        <Ionicons name="checkmark-circle" size={48} color={colors.accent} />
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 17, marginTop: 10 }}>Message sent!</Text>
        <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
          Thank you for reaching out. We will contact you shortly.
        </Text>
        <Button label="Send another" onPress={() => setSubmitted(false)} small />
      </Card>
    );
  }

  return (
    <Card>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        <View style={{ backgroundColor: colors.primaryLight, borderRadius: 12, padding: 10 }}>
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Send us a message</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>We typically respond within 1–2 business days.</Text>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Full name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={colors.muted}
        maxLength={80}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
      />

      <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Phone *</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+91 98765 43210"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
        maxLength={20}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
      />

      <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Email *</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        maxLength={120}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
      />

      <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Subject (optional)</Text>
      <TextInput
        value={subject}
        onChangeText={setSubject}
        placeholder="Admission inquiry, course details…"
        placeholderTextColor={colors.muted}
        maxLength={120}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
      />

      <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Message *</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="How can we help you?"
        placeholderTextColor={colors.muted}
        multiline
        numberOfLines={5}
        maxLength={2000}
        style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
      />
      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{message.length}/2000</Text>

      <Button
        label={loading ? "Sending…" : "Send Message"}
        onPress={submit}
        disabled={loading}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: { minHeight: 110, textAlignVertical: "top" },
});