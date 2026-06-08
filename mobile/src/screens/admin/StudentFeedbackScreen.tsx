import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, ContactStatus, Feedback, FeedbackCategory } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { FEEDBACK_CATEGORIES, getCategoryLabel } from "../../lib/feedback";
import { formatDateTime } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { Screen, Card, StatCard } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";

type TypeFilter = "all" | "feedback" | "testimonial" | "contact";

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New",
  contacted: "Contacted",
  resolved: "Resolved",
};

const STATUS_COLOR: Record<ContactStatus, string> = {
  new: "#d97706",
  contacted: "#f97316",
  resolved: "#16a34a",
};

export default function AdminStudentFeedbackScreen() {
  const { colors } = useTheme();
  const route = useRoute();
  const routeType = (route.params as { initialType?: TypeFilter } | undefined)?.initialType;
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    routeType && ["feedback", "testimonial", "contact"].includes(routeType) ? routeType : "all"
  );
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    avgRating: null as number | null,
    approvedTestimonials: 0,
    maxHomepageTestimonials: 6,
    newContactInquiries: 0,
  });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const load = (p = 1, cat = category, type = typeFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    if (cat) params.set("category", cat);
    if (type === "feedback") params.set("type", "feedback");
    if (type === "testimonial") params.set("type", "testimonial");
    if (type === "contact") params.set("type", "contact");
    api
      .getAdminFeedback(params.toString())
      .then((data) => {
        setItems(data.feedback);
        setPage(data.pagination.page);
        setPages(data.pagination.pages);
        setStats({
          total: data.stats.total,
          avgRating: data.stats.avgRating,
          approvedTestimonials: data.stats.approvedTestimonials,
          maxHomepageTestimonials: data.stats.maxHomepageTestimonials,
          newContactInquiries: data.stats.newContactInquiries,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, category, typeFilter); }, [category, typeFilter]);

  const remove = (id: string) => {
    Alert.alert("Delete submission?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteFeedback(id);
            load(page, category, typeFilter);
            toast.success("Deleted");
          } catch {
            toast.error("Failed to delete");
          }
        },
      },
    ]);
  };

  const toggleHomepage = async (item: Feedback) => {
    setTogglingId(item._id);
    try {
      await api.toggleTestimonialApproval(item._id, !item.approvedForHomepage);
      load(page, category, typeFilter);
      toast.success(item.approvedForHomepage ? "Removed from homepage" : "Approved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setTogglingId(null);
    }
  };

  const setContactStatus = async (id: string, status: ContactStatus) => {
    setStatusUpdatingId(id);
    try {
      await api.updateContactStatus(id, status);
      load(page, category, typeFilter);
      toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <Screen title="Feedback & Contact">
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
        {stats.newContactInquiries} new contact inquiry{stats.newContactInquiries === 1 ? "" : "ies"}
      </Text>

      <SelectDropdown
        label="Type"
        value={typeFilter}
        options={[
          { id: "all", label: "All types" },
          { id: "feedback", label: "Student feedback" },
          { id: "testimonial", label: "Testimonials" },
          { id: "contact", label: "Contact Us" },
        ]}
        onChange={(v) => setTypeFilter(v as TypeFilter)}
      />

      {typeFilter !== "contact" && (
        <SelectDropdown
          label="Category"
          value={category || "all"}
          options={[
            { id: "all", label: "All categories" },
            ...FEEDBACK_CATEGORIES.map((c) => ({ id: c.value, label: c.label })),
          ]}
          onChange={(v) => setCategory(v === "all" ? "" : (v as FeedbackCategory))}
        />
      )}

      <View style={styles.statsRow}>
        <View style={{ flex: 1 }}><StatCard title="Total" value={stats.total} /></View>
        <View style={{ flex: 1 }}><StatCard title="New contacts" value={stats.newContactInquiries} /></View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : items.length === 0 ? (
        <Card style={{ alignItems: "center", paddingVertical: 40, marginTop: 16 }}>
          <Ionicons name="chatbox-outline" size={40} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>No submissions yet</Text>
        </Card>
      ) : (
        items.map((f) => (
          <Card key={f._id} style={{ marginTop: 12 }}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.badges}>
                  {f.isContactInquiry ? (
                    <Text style={[styles.badge, { backgroundColor: colors.primaryLight, color: colors.accent }]}>
                      Contact Us
                    </Text>
                  ) : f.isTestimonial ? (
                    <Text style={[styles.badge, { backgroundColor: colors.primaryLight, color: colors.accent }]}>
                      Testimonial
                    </Text>
                  ) : (
                    <Text style={[styles.badge, { backgroundColor: colors.primaryLight, color: colors.accent }]}>
                      {getCategoryLabel(f.category)}
                    </Text>
                  )}
                  {!f.isTestimonial && !f.isContactInquiry && (
                    <Text style={[styles.badge, { backgroundColor: colors.surface, color: colors.muted }]}>
                      Anonymous
                    </Text>
                  )}
                  {f.contact?.status && (
                    <Text style={[styles.badge, { backgroundColor: colors.surface, color: STATUS_COLOR[f.contact.status] }]}>
                      {STATUS_LABEL[f.contact.status]}
                    </Text>
                  )}
                </View>

                {f.isContactInquiry && f.contact && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{f.contact.name}</Text>
                    <Pressable onPress={() => Linking.openURL(`mailto:${f.contact!.email}`)}>
                      <Text style={{ color: colors.accent, fontSize: 13, marginTop: 4 }}>{f.contact.email}</Text>
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL(`tel:${f.contact!.phone}`)}>
                      <Text style={{ color: colors.accent, fontSize: 13, marginTop: 2 }}>{f.contact.phone}</Text>
                    </Pressable>
                  </View>
                )}

                {f.isTestimonial && f.student && (
                  <Text style={{ color: colors.text, fontWeight: "600", marginTop: 6 }}>{f.student.name}</Text>
                )}

                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{formatDateTime(f.createdAt)}</Text>
                {f.subject ? <Text style={{ color: colors.text, fontWeight: "600", marginTop: 6 }}>{f.subject}</Text> : null}
                {f.rating ? (
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons key={n} name={n <= f.rating! ? "star" : "star-outline"} size={14} color="#fbbf24" />
                    ))}
                  </View>
                ) : null}
              </View>
              <Pressable onPress={() => remove(f._id)}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </View>

            <Text style={{ color: colors.text, fontSize: 14, marginTop: 10, lineHeight: 20 }}>{f.message}</Text>

            {f.isContactInquiry && f.contact && (
              <View style={styles.actionRow}>
                {f.contact.status !== "contacted" && (
                  <Pressable
                    onPress={() => setContactStatus(f._id, "contacted")}
                    disabled={statusUpdatingId === f._id}
                    style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 12 }}>Mark contacted</Text>
                  </Pressable>
                )}
                {f.contact.status !== "resolved" && (
                  <Pressable
                    onPress={() => setContactStatus(f._id, "resolved")}
                    disabled={statusUpdatingId === f._id}
                    style={[styles.actionBtn, { backgroundColor: "#f0fdf4" }]}
                  >
                    <Text style={{ color: "#16a34a", fontWeight: "600", fontSize: 12 }}>Resolved</Text>
                  </Pressable>
                )}
              </View>
            )}

            {f.isTestimonial && (
              <Pressable
                onPress={() => toggleHomepage(f)}
                disabled={togglingId === f._id}
                style={[
                  styles.actionBtn,
                  {
                    marginTop: 10,
                    backgroundColor: f.approvedForHomepage ? "#f0fdf4" : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: f.approvedForHomepage ? "#16a34a" : colors.text, fontWeight: "600", fontSize: 12 }}>
                  {togglingId === f._id ? "Updating…" : f.approvedForHomepage ? "Remove from site" : "Show on homepage"}
                </Text>
              </Pressable>
            )}
          </Card>
        ))
      )}

      {pages > 1 && (
        <View style={styles.pagination}>
          <Pressable disabled={page <= 1} onPress={() => load(page - 1, category, typeFilter)} style={{ opacity: page <= 1 ? 0.4 : 1 }}>
            <Text style={{ color: colors.accent }}>Previous</Text>
          </Pressable>
          <Text style={{ color: colors.muted }}>{page}/{pages}</Text>
          <Pressable disabled={page >= pages} onPress={() => load(page + 1, category, typeFilter)} style={{ opacity: page >= pages ? 0.4 : 1 }}>
            <Text style={{ color: colors.accent }}>Next</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { fontSize: 11, fontWeight: "600", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: "hidden" },
  stars: { flexDirection: "row", gap: 2, marginTop: 4 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  actionBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 16, marginBottom: 24 },
});