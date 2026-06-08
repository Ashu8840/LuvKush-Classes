import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, ParentChild } from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { Screen, Card, Loading } from "../../components/ui";
import { ChildSelector } from "../../components/parent/ChildSelector";
import { useTheme } from "../../contexts/ThemeContext";

type Certificate = {
  _id: string;
  title: string;
  certificateId: string;
  issuedAt: string;
  course?: { name: string };
};

export default function ParentCertificatesScreen() {
  const { colors } = useTheme();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getParentChildren().then((data) => {
      setChildren(data);
      if (data.length) setSelectedId(data[0].student._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api.getChildCertificates(selectedId)
      .then((data) => setCertificates(data as Certificate[]))
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <Screen title="Certificates">
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? <Loading /> : certificates.length ? certificates.map((c) => (
        <Card key={c._id}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12 }}>
              <Ionicons name="ribbon" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{c.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{c.course?.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>ID: {c.certificateId}</Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>Issued: {formatDate(c.issuedAt)}</Text>
            </View>
          </View>
        </Card>
      )) : (
        <Text style={{ color: colors.muted, textAlign: "center" }}>No certificates issued yet</Text>
      )}
    </Screen>
  );
}