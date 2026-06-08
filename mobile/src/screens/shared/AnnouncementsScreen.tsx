import React, { useEffect, useState } from "react";
import {
  View, Text, Image, Pressable, TextInput, Alert, StyleSheet, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { api, Announcement } from "../../lib/api";
import { formatDateTime } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Screen, Card, Button, AppModal } from "../../components/ui";

type PostType = "text" | "image" | "poll";

function Avatar({ name, url, size = 40 }: { name: string; url?: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, borderColor: colors.border, backgroundColor: colors.primaryLight }]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ color: colors.accent, fontWeight: "700", fontSize: size * 0.3 }}>{initials}</Text>
      )}
    </View>
  );
}

export default function AnnouncementsScreen({ canPost }: { canPost: boolean }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [postType, setPostType] = useState<PostType>("text");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = (p = 1) => {
    setLoading(true);
    api.getAnnouncements(p)
      .then((data) => {
        setPosts(data.announcements);
        setPage(data.pagination.page);
        setPages(data.pagination.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const pickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "image/*", copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const { url } = await api.uploadAnnouncementImage(asset.uri, asset.name || "photo.jpg", asset.mimeType || "image/jpeg");
      setImageUrl(url);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setCaption("");
    setImageUrl("");
    setPollOptions(["", ""]);
    setPostType("text");
  };

  const createPost = async () => {
    setSubmitting(true);
    try {
      await api.createAnnouncement({
        type: postType,
        caption,
        imageUrl: postType === "image" ? imageUrl : undefined,
        pollOptions: postType === "poll" ? pollOptions.filter((o) => o.trim()).map((text) => ({ text })) : undefined,
      });
      setShowCreate(false);
      resetForm();
      load(1);
      Alert.alert("Posted", "Everyone has been notified");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (post: Announcement) => {
    try {
      const res = await api.likeAnnouncement(post._id);
      setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, likedByMe: res.liked, likeCount: res.likeCount } : p)));
    } catch { /* ignore */ }
  };

  const vote = async (post: Announcement, idx: number) => {
    try {
      const updated = await api.voteAnnouncementPoll(post._id, idx);
      setPosts((prev) => prev.map((p) => (p._id === post._id ? updated : p)));
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Vote failed");
    }
  };

  const addComment = async (postId: string) => {
    const text = drafts[postId]?.trim();
    if (!text) return;
    try {
      const res = await api.commentOnAnnouncement(postId, text);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: [...p.comments, res.comment], commentCount: res.commentCount } : p
        )
      );
      setDrafts((d) => ({ ...d, [postId]: "" }));
      setExpanded((e) => ({ ...e, [postId]: true }));
    } catch { /* ignore */ }
  };

  const removeComment = async (postId: string, commentId: string) => {
    try {
      const res = await api.deleteAnnouncementComment(postId, commentId);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: p.comments.filter((c) => c._id !== commentId), commentCount: res.commentCount }
            : p
        )
      );
    } catch { /* ignore */ }
  };

  const removePost = (id: string) => {
    Alert.alert("Remove announcement?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await api.deleteAnnouncement(id);
          setPosts((prev) => prev.filter((p) => p._id !== id));
        },
      },
    ]);
  };

  const totalVotes = (post: Announcement) => post.pollOptions?.reduce((s, o) => s + o.voteCount, 0) || 0;

  return (
    <Screen>
      {canPost && (
        <Button label="+ New Announcement" onPress={() => setShowCreate(true)} small />
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : posts.length === 0 ? (
        <Card style={{ alignItems: "center", paddingVertical: 40, marginTop: 16 }}>
          <Ionicons name="megaphone-outline" size={40} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>No announcements yet</Text>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post._id} style={{ marginTop: 12, padding: 0, overflow: "hidden" }}>
            <View style={styles.postHeader}>
              <Avatar name={post.author.name} url={post.author.avatar} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14 }}>{post.author.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{formatDateTime(post.createdAt)}</Text>
              </View>
              {user?.role === "admin" && (
                <Pressable onPress={() => removePost(post._id)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              )}
            </View>

            {post.type === "image" && post.imageUrl && (
              <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
            )}

            {post.type === "text" && post.caption ? (
              <Text style={[styles.caption, { color: colors.text }]}>{post.caption}</Text>
            ) : null}

            {post.type === "poll" && (
              <View style={styles.pollWrap}>
                {post.caption ? <Text style={[styles.caption, { color: colors.text, fontWeight: "600" }]}>{post.caption}</Text> : null}
                {post.pollOptions?.map((opt, idx) => {
                  const total = totalVotes(post);
                  const pct = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
                  const voted = post.myPollVoteIndex >= 0;
                  return (
                    <Pressable
                      key={opt._id}
                      onPress={() => vote(post, idx)}
                      style={[styles.pollOpt, { borderColor: opt.votedByMe ? colors.accent : colors.border, backgroundColor: opt.votedByMe ? colors.primaryLight : colors.surface }]}
                    >
                      <Text style={{ color: colors.text, fontSize: 14 }}>{opt.text}</Text>
                      {voted && <Text style={{ color: colors.muted, fontSize: 11 }}>{pct}% · {opt.voteCount}</Text>}
                    </Pressable>
                  );
                })}
                <Text style={{ color: colors.muted, fontSize: 11 }}>{totalVotes(post)} votes</Text>
              </View>
            )}

            {post.type === "image" && post.caption ? (
              <Text style={[styles.caption, { color: colors.text }]}>
                <Text style={{ fontWeight: "700" }}>{post.author.name}</Text> {post.caption}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable onPress={() => toggleLike(post)} style={styles.actionBtn}>
                <Ionicons name={post.likedByMe ? "heart" : "heart-outline"} size={22} color={post.likedByMe ? "#ef4444" : colors.muted} />
                {post.likeCount > 0 && <Text style={{ color: colors.muted, marginLeft: 4 }}>{post.likeCount}</Text>}
              </Pressable>
              <Pressable onPress={() => setExpanded((e) => ({ ...e, [post._id]: !e[post._id] }))} style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.muted} />
                {post.commentCount > 0 && <Text style={{ color: colors.muted, marginLeft: 4 }}>{post.commentCount}</Text>}
              </Pressable>
            </View>

            {expanded[post._id] && (
              <View style={[styles.comments, { borderTopColor: colors.border }]}>
                {post.comments.map((c) => {
                  const canDelete = c.user._id === user?.id || user?.role === "admin";
                  return (
                    <View key={c._id} style={styles.commentRow}>
                      <Avatar name={c.user.name} url={c.user.avatar} size={28} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 12 }}>{c.user.name}</Text>
                        <Text style={{ color: colors.text, fontSize: 13 }}>{c.text}</Text>
                      </View>
                      {canDelete && (
                        <Pressable onPress={() => removeComment(post._id, c._id)}>
                          <Ionicons name="close" size={16} color={colors.muted} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
                <View style={styles.commentInput}>
                  <TextInput
                    value={drafts[post._id] || ""}
                    onChangeText={(t) => setDrafts((d) => ({ ...d, [post._id]: t }))}
                    placeholder="Add a comment…"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                  />
                  <Pressable onPress={() => addComment(post._id)} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="send" size={16} color={colors.primaryText} />
                  </Pressable>
                </View>
              </View>
            )}
          </Card>
        ))
      )}

      {pages > 1 && (
        <View style={styles.pagination}>
          <Button label="Previous" variant="outline" small disabled={page <= 1} onPress={() => load(page - 1)} />
          <Text style={{ color: colors.muted }}>{page}/{pages}</Text>
          <Button label="Next" variant="outline" small disabled={page >= pages} onPress={() => load(page + 1)} />
        </View>
      )}

      <AppModal visible={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="New Announcement">
        <View style={styles.typeRow}>
          {(["text", "image", "poll"] as PostType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setPostType(t)}
              style={[styles.typeBtn, { borderColor: postType === t ? colors.accent : colors.border, backgroundColor: postType === t ? colors.primaryLight : "transparent" }]}
            >
              <Text style={{ color: postType === t ? colors.accent : colors.muted, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {postType === "image" && (
          <View style={{ gap: 10, marginBottom: 12 }}>
            {imageUrl ? (
              <View>
                <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 200, borderRadius: 12 }} />
                <Pressable onPress={() => setImageUrl("")} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.accent, fontSize: 12 }}>Remove image</Text>
                </Pressable>
              </View>
            ) : (
              <Button label={uploading ? "Uploading…" : "Upload Photo"} variant="outline" onPress={pickImage} disabled={uploading} />
            )}
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Caption"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
          </View>
        )}

        {postType === "text" && (
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write your announcement…"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={5}
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, marginBottom: 12 }]}
          />
        )}

        {postType === "poll" && (
          <View style={{ gap: 8, marginBottom: 12 }}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Poll question"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            {pollOptions.map((opt, i) => (
              <TextInput
                key={i}
                value={opt}
                onChangeText={(t) => {
                  const next = [...pollOptions];
                  next[i] = t;
                  setPollOptions(next);
                }}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
            ))}
            {pollOptions.length < 4 && (
              <Pressable onPress={() => setPollOptions([...pollOptions, ""])}>
                <Text style={{ color: colors.accent, fontSize: 12 }}>+ Add option</Text>
              </Pressable>
            )}
          </View>
        )}

        <Button
          label={submitting ? "Posting…" : "Post Announcement"}
          onPress={createPost}
          disabled={submitting || (postType === "image" && !imageUrl) || (postType === "text" && !caption.trim())}
        />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  postHeader: { flexDirection: "row", alignItems: "center", padding: 12 },
  postImage: { width: "100%", aspectRatio: 1 },
  caption: { paddingHorizontal: 12, paddingBottom: 8, fontSize: 14, lineHeight: 20 },
  pollWrap: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  pollOpt: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actions: { flexDirection: "row", gap: 16, paddingHorizontal: 12, paddingVertical: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center" },
  comments: { borderTopWidth: 1, padding: 12, gap: 10 },
  commentRow: { flexDirection: "row", alignItems: "flex-start" },
  commentInput: { flexDirection: "row", gap: 8, marginTop: 4 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  sendBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16, marginBottom: 24 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
});