import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, PublicTestimonial } from "../../lib/api";
import { useTheme } from "../../contexts/ThemeContext";

function Avatar({ name, avatar, colors }: { name: string; avatar?: string; colors: { primary: string; primaryLight: string } }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { borderColor: colors.primary + "55", backgroundColor: colors.primaryLight }]}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatarImg} />
      ) : (
        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>{initials}</Text>
      )}
    </View>
  );
}

export function TestimonialsCarousel() {
  const { colors } = useTheme();
  const [items, setItems] = useState<PublicTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api
      .getPublicTestimonials()
      .then((data) => setItems(data.testimonials))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />;
  }

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
          Testimonials will appear here once approved by admin.
        </Text>
      </View>
    );
  }

  const item = items[index];

  return (
    <View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary + "33"} style={styles.quoteIcon} />
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons
              key={n}
              name={n <= item.rating ? "star" : "star-outline"}
              size={16}
              color="#fbbf24"
            />
          ))}
        </View>
        <Text style={[styles.message, { color: colors.text }]}>&ldquo;{item.message}&rdquo;</Text>
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Avatar name={item.student.name} avatar={item.student.avatar} colors={colors} />
          <View>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14 }}>{item.student.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Student</Text>
          </View>
        </View>
      </View>

      {items.length > 1 && (
        <View style={styles.controls}>
          <Pressable
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index <= 0}
            style={[styles.navBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: index <= 0 ? 0.4 : 1 }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.dots}>
            {items.map((_, i) => (
              <Pressable key={i} onPress={() => setIndex(i)}>
                <View
                  style={{
                    width: i === index ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === index ? colors.primary : colors.muted + "66",
                  }}
                />
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            disabled={index >= items.length - 1}
            style={[styles.navBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: index >= items.length - 1 ? 0.4 : 1 }]}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 20, position: "relative" },
  quoteIcon: { position: "absolute", right: 16, top: 16 },
  stars: { flexDirection: "row", gap: 2, marginBottom: 12 },
  message: { fontSize: 14, lineHeight: 22 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16 },
  navBtn: { borderWidth: 1, borderRadius: 20, padding: 8 },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  empty: { borderRadius: 16, borderWidth: 1, borderStyle: "dashed", padding: 28 },
});