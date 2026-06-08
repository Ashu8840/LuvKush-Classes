import { useState } from "react";
import { Text, TextInput, ScrollView, View, KeyboardAvoidingView, Platform } from "react-native";
import { api } from "../../lib/api";
import { useTheme } from "../../contexts/ThemeContext";
import { Button } from "../../components/ui";

type Message = { role: "user" | "assistant"; content: string };

export default function StudentAICoachScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI coach. Ask me about typing or shorthand!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const data = await api.askCoach(q);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ backgroundColor: colors.primaryLight, padding: 10, borderRadius: 12 }}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>AI Study Coach</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Powered by Groq AI</Text>
          </View>
        </View>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ gap: 12 }}>
        {messages.map((m, i) => (
          <View key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <View style={{
              backgroundColor: m.role === "user" ? colors.primary : colors.primaryLight,
              borderRadius: 16, padding: 12,
            }}>
              <Text style={{ color: m.role === "user" ? colors.primaryText : colors.text, fontSize: 14 }}>{m.content}</Text>
            </View>
          </View>
        ))}
        {loading && <Text style={{ color: colors.muted, fontStyle: "italic" }}>Thinking...</Text>}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask your coach..."
          placeholderTextColor={colors.muted}
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: colors.text, backgroundColor: colors.surface }}
        />
        <Button label="Send" onPress={send} disabled={loading} small />
      </View>
    </KeyboardAvoidingView>
  );
}