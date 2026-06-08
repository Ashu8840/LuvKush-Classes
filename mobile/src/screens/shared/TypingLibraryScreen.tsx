import { useEffect, useState } from "react";
import { Text, View, Alert, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, TypingPassage } from "../../lib/api";
import { Screen, Card, Button, PillGroup, AppModal, Loading } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

const PAGE_SIZE = 6;

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

type FormState = {
  title: string;
  content: string;
  language: "english" | "hindi";
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  isAiGenerated?: boolean;
};

const emptyForm: FormState = {
  title: "",
  content: "",
  language: "english",
  difficulty: "intermediate",
  category: "general",
  isAiGenerated: false,
};

export default function TypingLibraryScreen() {
  const { colors } = useTheme();
  const [passages, setPassages] = useState<TypingPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterLang, setFilterLang] = useState("");
  const [activeModal, setActiveModal] = useState<"add" | "ai" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [aiForm, setAiForm] = useState({
    language: "english" as "english" | "hindi",
    topic: "",
    difficulty: "intermediate" as "beginner" | "intermediate" | "advanced",
    targetWords: 1200,
  });

  const loadPassages = () => {
    setLoading(true);
    api
      .getTypingPassages(filterLang ? { language: filterLang } : undefined)
      .then(setPassages)
      .catch(() => Alert.alert("Error", "Failed to load typing passages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPassages();
    setPage(1);
  }, [filterLang]);

  const totalPages = Math.max(1, Math.ceil(passages.length / PAGE_SIZE));
  const paginatedPassages = passages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSave = async () => {
    const words = countWords(form.content);
    if (words < 100) {
      Alert.alert("Too short", "Content must have at least 100 words");
      return;
    }
    setSaving(true);
    try {
      await api.createTypingPassage({ ...form, isAiGenerated: form.isAiGenerated || false });
      Alert.alert("Success", "Passage added to Typing Library!");
      setForm(emptyForm);
      setActiveModal(null);
      loadPassages();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await api.generateTypingPassage(aiForm);
      setForm({
        title: generated.title,
        content: generated.content,
        language: aiForm.language,
        difficulty: aiForm.difficulty,
        category: aiForm.topic || "general",
        isAiGenerated: true,
      });
      setActiveModal("add");
      Alert.alert("Generated", `${generated.wordCount} words — review and save`);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm", "Remove this passage from the Typing Library?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteTypingPassage(id);
            loadPassages();
          } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "Delete failed");
          }
        },
      },
    ]);
  };

  const formWordCount = countWords(form.content);

  const fieldStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 15,
  };

  return (
    <Screen title="Typing Library">
      <Text style={{ color: colors.muted, fontSize: 13 }}>
        Manage practice passages for English & Hindi typing drills
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button label="Generate with AI" variant="outline" onPress={() => setActiveModal("ai")} small />
        <Button
          label="Add Passage"
          onPress={() => {
            setForm(emptyForm);
            setActiveModal("add");
          }}
          small
        />
      </View>

      <PillGroup
        options={[
          { id: "", label: "All" },
          { id: "english", label: "English" },
          { id: "hindi", label: "Hindi" },
        ]}
        value={filterLang}
        onChange={setFilterLang}
      />

      {loading ? (
        <Loading />
      ) : passages.length === 0 ? (
        <Card>
          <Text style={{ color: colors.muted, textAlign: "center" }}>
            No passages yet. Add manually or generate with AI.
          </Text>
        </Card>
      ) : (
        <>
          {paginatedPassages.map((p) => (
            <Card key={p._id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{p.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                    {p.language} · {p.difficulty} · {p.wordCount} words · {p.category}
                    {p.isAiGenerated ? " · AI" : ""}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }} numberOfLines={2}>
                    {p.content.slice(0, 120)}...
                  </Text>
                </View>
                <Pressable onPress={() => handleDelete(p._id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </Pressable>
              </View>
            </Card>
          ))}

          {totalPages > 1 && (
            <Card>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10, textAlign: "center" }}>
                Page {page} of {totalPages} · {passages.length} passages
              </Text>
              <View style={styles.paginationRow}>
                <Button
                  label="Prev"
                  variant="outline"
                  small
                  disabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                />
                <View style={styles.pageNums}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setPage(n)}
                      style={[
                        styles.pageBtn,
                        {
                          backgroundColor: page === n ? colors.primary : colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: page === n ? colors.primaryText : colors.text, fontWeight: "700" }}>
                        {n}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Button
                  label="Next"
                  variant="outline"
                  small
                  disabled={page >= totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </View>
            </Card>
          )}
        </>
      )}

      <AppModal visible={activeModal === "ai"} title="Generate with AI (Groq)" onClose={() => setActiveModal(null)}>
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            AI will create a 1000–2000 word passage for typing practice
          </Text>
          <PillGroup
            options={[
              { id: "english", label: "English" },
              { id: "hindi", label: "Hindi" },
            ]}
            value={aiForm.language}
            onChange={(v) => setAiForm({ ...aiForm, language: v as "english" | "hindi" })}
          />
          <PillGroup
            options={[
              { id: "beginner", label: "Beginner" },
              { id: "intermediate", label: "Intermediate" },
              { id: "advanced", label: "Advanced" },
            ]}
            value={aiForm.difficulty}
            onChange={(v) => setAiForm({ ...aiForm, difficulty: v as "beginner" | "intermediate" | "advanced" })}
          />
          <TextInput
            value={aiForm.topic}
            onChangeText={(topic) => setAiForm({ ...aiForm, topic })}
            placeholder="Topic e.g. technology, nature..."
            placeholderTextColor={colors.muted}
            style={fieldStyle}
          />
          <Text style={{ color: colors.muted, fontSize: 12 }}>Target words: {aiForm.targetWords}</Text>
          <Button
            label={generating ? "Generating..." : "Generate Passage"}
            onPress={handleGenerate}
            disabled={generating}
          />
        </View>
      </AppModal>

      <AppModal visible={activeModal === "add"} title="Add Passage" onClose={() => setActiveModal(null)}>
        <View style={{ gap: 12 }}>
          <TextInput
            value={form.title}
            onChangeText={(title) => setForm({ ...form, title })}
            placeholder="Passage title"
            placeholderTextColor={colors.muted}
            style={fieldStyle}
          />
          <PillGroup
            options={[
              { id: "english", label: "English" },
              { id: "hindi", label: "Hindi" },
            ]}
            value={form.language}
            onChange={(v) => setForm({ ...form, language: v as "english" | "hindi" })}
          />
          <PillGroup
            options={[
              { id: "beginner", label: "Beginner" },
              { id: "intermediate", label: "Intermediate" },
              { id: "advanced", label: "Advanced" },
            ]}
            value={form.difficulty}
            onChange={(v) => setForm({ ...form, difficulty: v as "beginner" | "intermediate" | "advanced" })}
          />
          <TextInput
            value={form.category}
            onChangeText={(category) => setForm({ ...form, category })}
            placeholder="Category"
            placeholderTextColor={colors.muted}
            style={fieldStyle}
          />
          <TextInput
            value={form.content}
            onChangeText={(content) => setForm({ ...form, content })}
            placeholder="Paste passage content (1000–2000 words recommended)..."
            placeholderTextColor={colors.muted}
            multiline
            style={[fieldStyle, { minHeight: 160, textAlignVertical: "top" }]}
          />
          <Text style={{ color: colors.muted, fontSize: 12 }}>Word count: {formWordCount}</Text>
          <Button label={saving ? "Saving..." : "Save to Library"} onPress={handleSave} disabled={saving} />
        </View>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  deleteBtn: {
    padding: 8,
    alignSelf: "flex-start",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pageNums: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    flex: 1,
  },
  pageBtn: {
    minWidth: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
});