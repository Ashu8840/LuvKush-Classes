import { useEffect, useState } from "react";
import { Text, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { api, ShorthandDictation } from "../../lib/api";
import { AudioPlaybackButton } from "../../components/AudioPlaybackButton";
import { formatDate } from "../../lib/utils";
import { Screen, Card, Button, Input, Loading } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

export default function TeacherShorthandScreen() {
  const { colors } = useTheme();
  const [dictations, setDictations] = useState<ShorthandDictation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    transcript: "",
    targetWpm: "80",
    durationSeconds: "120",
    audioUrl: "",
  });

  const loadDictations = () => {
    api.getDictations()
      .then(setDictations)
      .catch(() => Alert.alert("Error", "Failed to load dictations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDictations(); }, []);

  const handleAudioUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const { url } = await api.uploadAudio(asset.uri, asset.name, asset.mimeType || "audio/mpeg");
      setForm((f) => ({ ...f, audioUrl: url }));
      Alert.alert("Success", "Audio uploaded successfully");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.audioUrl) {
      Alert.alert("Required", "Please upload an audio file");
      return;
    }
    if (!form.title.trim() || !form.transcript.trim()) {
      Alert.alert("Required", "Title and transcript are required");
      return;
    }
    try {
      await api.createDictation({
        title: form.title,
        transcript: form.transcript,
        targetWpm: Number(form.targetWpm),
        durationSeconds: Number(form.durationSeconds),
        audioUrl: form.audioUrl,
      });
      Alert.alert("Success", "Dictation created!");
      setForm({ title: "", transcript: "", targetWpm: "80", durationSeconds: "120", audioUrl: "" });
      setShowForm(false);
      loadDictations();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to create dictation");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm", "Deactivate this dictation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteDictation(id);
            loadDictations();
          } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "Delete failed");
          }
        },
      },
    ]);
  };

  return (
    <Screen
      title="Shorthand Dictations"
      action={<Button label={showForm ? "Cancel" : "Upload"} small onPress={() => setShowForm(!showForm)} />}
    >
      {showForm && (
        <Card>
          <Input label="Title" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} placeholder="Dictation title" />
          <Input label="Transcript" value={form.transcript} onChangeText={(t) => setForm({ ...form, transcript: t })} placeholder="Full transcript for AI evaluation" />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input label="Target WPM" value={form.targetWpm} onChangeText={(t) => setForm({ ...form, targetWpm: t })} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Duration (sec)" value={form.durationSeconds} onChangeText={(t) => setForm({ ...form, durationSeconds: t })} keyboardType="numeric" />
            </View>
          </View>
          <Button label={uploading ? "Uploading..." : "Upload Audio File"} variant="outline" disabled={uploading} onPress={handleAudioUpload} />
          {form.audioUrl ? <Text style={{ color: colors.accent, fontSize: 12, marginTop: 4 }}>Audio ready ✓</Text> : null}
          <Button label="Create Dictation" onPress={handleSubmit} />
        </Card>
      )}

      {loading ? <Loading /> : dictations.length ? dictations.map((d) => (
        <Card key={d._id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
              <View style={{ backgroundColor: colors.primaryLight, borderRadius: 12, padding: 10 }}>
                <Ionicons name="mic" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{d.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{d.targetWpm} WPM · {d.durationSeconds}s</Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                  {d.batch?.name || "All batches"} · {formatDate(d.createdAt)}
                </Text>
              </View>
            </View>
            <Button label="Delete" variant="danger" small onPress={() => handleDelete(d._id)} />
          </View>
          <DictationPreview url={d.audioUrl} />
        </Card>
      )) : (
        <Text style={{ color: colors.muted, textAlign: "center" }}>No dictations yet. Upload your first one!</Text>
      )}
    </Screen>
  );
}

function DictationPreview({ url }: { url: string }) {
  return <AudioPlaybackButton url={url} playLabel="Preview Audio" small />;
}