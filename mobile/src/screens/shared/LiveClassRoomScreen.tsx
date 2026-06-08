import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  ListRenderItem,
} from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, LiveClassSession, LiveClassChatMessage } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../contexts/ToastContext";
import { Button, Badge } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";

type Params = { classId: string; isTeacher?: boolean };
type Tab = "people" | "chat";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function chatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function LiveClassRoomScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const route = useRoute<RouteProp<{ LiveClassRoom: Params }, "LiveClassRoom">>();
  const { classId, isTeacher = false } = route.params;
  const [session, setSession] = useState<LiveClassSession | null>(null);
  const [chatText, setChatText] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatListRef = useRef<FlatList<LiveClassChatMessage>>(null);
  const chatInputRef = useRef<TextInput>(null);

  const refresh = useCallback(
    () => api.getLiveClass(classId).then(setSession).catch(() => {}),
    [classId]
  );

  useEffect(() => {
    api.requestJoinLiveClass(classId).catch(() => {});
    refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [classId, refresh]);

  useEffect(() => {
    if (activeTab === "chat" && session?.chatMessages?.length) {
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [session?.chatMessages?.length, activeTab]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      if (activeTab === "chat") {
        setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 80);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [activeTab]);

  if (!session || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 12 }}>Joining class room...</Text>
      </View>
    );
  }

  const myP = session.sessionParticipants.find(
    (p) => p.user._id === user.id || (p.user as { id?: string }).id === user.id
  );
  const admitted = isTeacher || myP?.status === "admitted";
  const waiting = !isTeacher && myP?.status === "waiting";
  const kicked = myP?.status === "kicked";
  const waitingList = session.sessionParticipants.filter((p) => p.status === "waiting");
  const inClass = session.sessionParticipants.filter((p) => p.status === "admitted");
  const messages = session.chatMessages || [];

  const jitsiUrl =
    `https://meet.jit.si/${session.roomId}` +
    `#config.prejoinPageEnabled=false` +
    `&config.disableDeepLinking=true` +
    `&config.startWithAudioMuted=${isTeacher ? "false" : "true"}` +
    `&config.startWithVideoMuted=false` +
    `&userInfo.displayName="${encodeURIComponent(user.name)}"`;

  const sendChat = async () => {
    const text = chatText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.sendLiveClassChat(classId, text);
      setChatText("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const goLive = async () => {
    try {
      await api.goLiveClass(classId);
      refresh();
      toast.success("Class is now live");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to go live");
    }
  };

  const renderChatItem: ListRenderItem<LiveClassChatMessage> = ({ item }) => {
    const mine = item.user._id === user.id;
    return (
      <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
        {!mine && (
          <View style={[styles.chatAvatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>
              {initials(item.user.name)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            mine
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
          ]}
        >
          {!mine && (
            <Text style={[styles.bubbleName, { color: colors.accent }]}>{item.user.name}</Text>
          )}
          <Text style={[styles.bubbleText, { color: mine ? colors.primaryText : colors.text }]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, { color: mine ? "rgba(255,255,255,0.75)" : colors.muted }]}>
            {chatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (kicked) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface, padding: 24 }]}>
        <Ionicons name="ban-outline" size={48} color="#dc2626" />
        <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 17, marginTop: 16, textAlign: "center" }}>
          You were removed from this class
        </Text>
      </View>
    );
  }

  if (waiting) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface, padding: 24 }]}>
        <View style={[styles.waitingIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="hourglass-outline" size={40} color={colors.accent} />
        </View>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18, marginTop: 20, textAlign: "center" }}>
          Waiting for teacher
        </Text>
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          {session.title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 16 }}>Keep this screen open</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const chatKeyboardOpen = activeTab === "chat" && keyboardHeight > 0;
  const videoHeight = chatKeyboardOpen ? 0 : 220;
  const videoPlaceholderHeight = chatKeyboardOpen ? 0 : 140;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {session.status === "live" && <View style={styles.liveDot} />}
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }} numberOfLines={1}>
              {session.title}
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
            {session.batch?.name || "All batches"} · {inClass.length} in class
          </Text>
        </View>
        <Badge label={session.status} variant={session.status === "live" ? "success" : "primary"} />
      </View>

      {/* Video */}
      {session.status === "live" && admitted && videoHeight > 0 ? (
        <View style={[styles.videoWrap, { height: videoHeight }]}>
          <WebView
            source={{ uri: jitsiUrl }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            mediaCapturePermissionGrantType="grant"
            setSupportMultipleWindows={false}
            {...(Platform.OS === "android" ? { androidLayerType: "hardware" as const } : {})}
            style={{ flex: 1, backgroundColor: "#000" }}
          />
        </View>
      ) : videoPlaceholderHeight > 0 ? (
        <View style={[styles.videoPlaceholder, { backgroundColor: colors.card, borderColor: colors.border, height: videoPlaceholderHeight }]}>
          {isTeacher && session.status === "scheduled" ? (
            <Button label="Go Live Now" onPress={goLive} />
          ) : (
            <>
              <Ionicons name="videocam-outline" size={36} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 8, textAlign: "center" }}>
                {isTeacher ? "Tap Go Live to start video" : "Video starts when teacher goes live"}
              </Text>
            </>
          )}
        </View>
      ) : null}

      {/* Quick actions */}
      <View style={[styles.actionRow, { borderBottomColor: colors.border }]}>
        {!isTeacher && session.handRaiseEnabled && session.status === "live" && (
          <Pressable
            onPress={() => api.toggleLiveHandRaise(classId).then(refresh)}
            style={[
              styles.actionChip,
              { borderColor: colors.border, backgroundColor: myP?.handRaised ? colors.primary : colors.card },
            ]}
          >
            <Text style={{ fontSize: 16 }}>✋</Text>
            <Text style={{ color: myP?.handRaised ? colors.primaryText : colors.text, fontSize: 13, fontWeight: "600" }}>
              {myP?.handRaised ? "Lower hand" : "Raise hand"}
            </Text>
          </Pressable>
        )}
        {isTeacher && session.status === "live" && (
          <Button label="End Class" variant="danger" small onPress={async () => { await api.endLiveClass(classId); refresh(); }} />
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["people", "chat"] as Tab[]).map((tab) => {
          const count = tab === "people" ? inClass.length : messages.length;
          const label = tab === "people" ? `People (${count})` : `Chat${messages.length ? ` (${messages.length})` : ""}`;
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, active && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
            >
              <Ionicons
                name={tab === "people" ? "people-outline" : "chatbubbles-outline"}
                size={18}
                color={active ? colors.accent : colors.muted}
              />
              <Text style={{ color: active ? colors.accent : colors.muted, fontWeight: active ? "700" : "500", fontSize: 13 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab panels */}
      {activeTab === "people" ? (
        <FlatList
          data={[
            ...(isTeacher && waitingList.length
              ? [{ type: "waiting-header" as const }]
              : []),
            ...waitingList.map((p) => ({ type: "waiting" as const, participant: p })),
            { type: "in-header" as const },
            ...inClass.map((p) => ({ type: "in" as const, participant: p })),
          ]}
          keyExtractor={(item, i) => {
            if ("participant" in item) return item.participant.user._id;
            return `${item.type}-${i}`;
          }}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 16 }}
          renderItem={({ item }) => {
            if (item.type === "waiting-header") {
              return (
                <Text style={[styles.sectionLabel, { color: colors.muted }]}>
                  Waiting room ({waitingList.length})
                </Text>
              );
            }
            if (item.type === "in-header") {
              return (
                <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 12 }]}>
                  In class ({inClass.length})
                </Text>
              );
            }
            const p = item.participant;
            const isWaiting = item.type === "waiting";
            return (
              <View
                style={[
                  styles.personRow,
                  {
                    backgroundColor: isWaiting ? colors.primaryLight : colors.card,
                    borderColor: isWaiting ? colors.accent : colors.border,
                  },
                ]}
              >
                <View style={[styles.personAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 12 }}>
                    {initials(p.user.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{p.user.name}</Text>
                  {p.handRaised && <Text style={{ color: colors.accent, fontSize: 12 }}>✋ Hand raised</Text>}
                </View>
                {isTeacher && isWaiting && (
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <Pressable
                      onPress={() => api.admitLiveParticipant(classId, p.user._id).then(refresh)}
                      style={[styles.iconBtn, { backgroundColor: "#16a34a" }]}
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </Pressable>
                    <Pressable
                      onPress={() => api.kickLiveParticipant(classId, p.user._id).then(refresh)}
                      style={[styles.iconBtn, { borderColor: colors.border, borderWidth: 1 }]}
                    >
                      <Ionicons name="close" size={18} color={colors.muted} />
                    </Pressable>
                  </View>
                )}
                {isTeacher && !isWaiting && p.user._id !== user.id && (
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <Pressable onPress={() => api.kickLiveParticipant(classId, p.user._id).then(refresh)} style={styles.smallIconBtn}>
                      <Ionicons name="exit-outline" size={16} color={colors.muted} />
                    </Pressable>
                    <Pressable onPress={() => api.blockLiveParticipant(classId, p.user._id).then(refresh)} style={styles.smallIconBtn}>
                      <Ionicons name="ban-outline" size={16} color="#dc2626" />
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
        >
        <View style={{ flex: 1 }}>
          {!session.chatEnabled ? (
            <View style={styles.centered}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 12 }}>Chat is disabled for this class</Text>
            </View>
          ) : (
            <FlatList
              ref={chatListRef}
              data={messages}
              keyExtractor={(m) => m._id}
              renderItem={renderChatItem}
              contentContainerStyle={[
                styles.chatList,
                messages.length === 0 && { flex: 1, justifyContent: "center" },
              ]}
              ListEmptyComponent={
                <View style={{ alignItems: "center", padding: 24 }}>
                  <Ionicons name="chatbubbles-outline" size={44} color={colors.muted} />
                  <Text style={{ color: colors.text, fontWeight: "600", marginTop: 12 }}>No messages yet</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4, textAlign: "center" }}>
                    Say hello or ask a question
                  </Text>
                </View>
              }
              onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {session.chatEnabled && admitted && (
            <View
              style={[
                styles.chatComposer,
                {
                  backgroundColor: colors.card,
                  borderTopColor: colors.border,
                  paddingBottom: Platform.OS === "ios"
                    ? insets.bottom + 8
                    : Math.max(insets.bottom + 8, keyboardHeight > 0 ? 8 : insets.bottom + 8),
                },
              ]}
            >
              <TextInput
                ref={chatInputRef}
                value={chatText}
                onChangeText={setChatText}
                placeholder="Type a message..."
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                style={[styles.chatInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                onFocus={() => setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100)}
                onSubmitEditing={sendChat}
                blurOnSubmit={false}
              />
              <Pressable
                onPress={sendChat}
                disabled={!chatText.trim() || sending}
                style={[
                  styles.sendBtn,
                  { backgroundColor: chatText.trim() ? colors.primary : colors.border },
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <Ionicons name="send" size={20} color={chatText.trim() ? colors.primaryText : colors.muted} />
                )}
              </Pressable>
            </View>
          )}
        </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },
  videoWrap: { backgroundColor: "#000", overflow: "hidden" },
  videoPlaceholder: {
    margin: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  smallIconBtn: { padding: 8 },
  chatList: { padding: 12, paddingBottom: 8 },
  bubbleRow: { flexDirection: "row", marginBottom: 10, alignItems: "flex-end", gap: 8 },
  bubbleRowMine: { justifyContent: "flex-end" },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleName: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  chatComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  waitingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});