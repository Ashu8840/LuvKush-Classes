import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api, Fee, ParentChild } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Screen, Card, Badge, Loading, getStatusBadgeVariant } from "../../components/ui";
import { ChildSelector } from "../../components/parent/ChildSelector";
import { useTheme } from "../../contexts/ThemeContext";

export default function ParentFeesScreen() {
  const { colors } = useTheme();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [fees, setFees] = useState<Fee[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
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
    api.getChildFees(selectedId)
      .then(({ fees: f, summary: s }) => { setFees(f); setSummary(s); })
      .catch(() => { setFees([]); setSummary({}); })
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <Screen title="Child Fees">
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? <Loading /> : (
        <>
          <Card>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Overall Status</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 4, textTransform: "capitalize" }}>
              {(summary.feesStatus as string) || "—"}
            </Text>
            {summary.totalFees ? (
              <Text style={{ color: colors.text, marginTop: 8 }}>
                Paid: {formatCurrency((summary.paidFees as number) || 0)} / {formatCurrency(summary.totalFees as number)}
              </Text>
            ) : null}
          </Card>

          {fees.length ? fees.map((f) => (
            <Card key={f._id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{formatCurrency(f.amount)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    Paid: {formatCurrency(f.paidAmount)} · Due {formatDate(f.dueDate)}
                  </Text>
                </View>
                <Badge label={f.status} variant={getStatusBadgeVariant(f.status)} />
              </View>
            </Card>
          )) : (
            <Text style={{ color: colors.muted, textAlign: "center" }}>No fee records</Text>
          )}
        </>
      )}
    </Screen>
  );
}