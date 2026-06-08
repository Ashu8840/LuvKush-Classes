import React, { useEffect, useState } from "react";
import { View, Pressable, Modal, Text, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useTheme } from "../../contexts/ThemeContext";

type Notification = {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  type?: string;
};

const LINK_TO_SCREEN: Record<string, string> = {
  "/student/announcements": "StudentAnnouncements",
  "/teacher/announcements": "TeacherAnnouncements",
  "/admin/announcements": "AdminAnnouncements",
  "/admin/fees": "AdminFees",
};

export function NotificationBell() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = () => {
    api.getNotifications().then((data) => {
      setNotifications((data.notifications as Notification[]) || []);
      setUnread((data.unreadCount as number) || 0);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const dismiss = async (n: Notification) => {
    await api.dismissNotification(n._id);
    setNotifications((prev) => prev.filter((item) => item._id !== n._id));
    setUnread((c) => Math.max(0, c - (n.isRead ? 0 : 1)));
    setOpen(false);
    if (n.link) {
      const screen = LINK_TO_SCREEN[n.link];
      if (screen) {
        navigation.navigate(screen as never);
      }
    }
  };

  const clearAll = async () => {
    await api.markAllNotificationsRead();
    setNotifications([]);
    setUnread(0);
  };

  return (
    <View>
      <Pressable onPress={() => setOpen(true)} style={[styles.btn, { borderColor: colors.border }]}>
        <Ionicons name="notifications-outline" size={18} color={colors.text} />
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        )}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
              {notifications.length > 0 && (
                <Pressable onPress={clearAll}>
                  <Text style={{ color: colors.accent, fontSize: 12 }}>Clear all</Text>
                </Pressable>
              )}
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {notifications.length === 0 ? (
                <Text style={[styles.empty, { color: colors.muted }]}>No notifications</Text>
              ) : notifications.map((n) => (
                <Pressable
                  key={n._id}
                  onPress={() => dismiss(n)}
                  style={[styles.item, { borderColor: colors.border }, !n.isRead && { backgroundColor: colors.primaryLight }]}
                >
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{n.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{n.message}</Text>
                  {n.type === "announcement" && (
                    <Text style={{ color: colors.accent, fontSize: 11, marginTop: 4 }}>Tap to view</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { borderWidth: 1, borderRadius: 12, padding: 8 },
  badge: { position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 56, paddingRight: 12 },
  panel: { width: 300, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#e7e5e4" },
  title: { fontWeight: "600" },
  empty: { padding: 24, textAlign: "center" },
  item: { padding: 12, borderBottomWidth: 1 },
  itemTitle: { fontSize: 14, fontWeight: "500", marginBottom: 2 },
});