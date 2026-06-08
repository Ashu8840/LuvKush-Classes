import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api, ParentChild } from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { Screen, Card, Badge, Loading, getStatusBadgeVariant } from "../../components/ui";
import { ChildSelector } from "../../components/parent/ChildSelector";
import { useTheme } from "../../contexts/ThemeContext";

type AttendanceRecord = { _id: string; date: string; status: string; batch?: { name: string } };

export default function ParentAttendanceScreen() {
  const { colors } = useTheme();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
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
    api.getChildAttendance(selectedId)
      .then((data) => setRecords(data as AttendanceRecord[]))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const present = records.filter((r) => ["present", "late"].includes(r.status)).length;
  const percent = records.length ? Math.round((present / records.length) * 100) : 0;

  return (
    <Screen title="Child Attendance">
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? <Loading /> : (
        <>
          <Card>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Attendance Rate</Text>
            <Text style={{ color: colors.accent, fontSize: 32, fontWeight: "700", marginTop: 4 }}>{percent}%</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{present} present out of {records.length} days</Text>
          </Card>

          {records.length ? records.map((r) => (
            <Card key={r._id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{formatDate(r.date)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>{r.batch?.name || "—"}</Text>
                </View>
                <Badge label={r.status} variant={getStatusBadgeVariant(r.status)} />
              </View>
            </Card>
          )) : (
            <Text style={{ color: colors.muted, textAlign: "center" }}>No attendance records</Text>
          )}
        </>
      )}
    </Screen>
  );
}