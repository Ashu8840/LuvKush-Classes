import { useEffect, useState } from "react";
import { Text, View, Share } from "react-native";
import { api, AttendanceRecord, AttendanceStats, Pagination as PaginationMeta } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { formatDate } from "../../lib/utils";
import { Screen, Card, Badge, Button, Input, StatCard, Pagination } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";

type Batch = { _id: string; name: string };

const today = () => new Date().toISOString().split("T")[0];
const weekAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
};

export default function AdminAttendanceScreen() {
  const { colors } = useTheme();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [fromDate, setFromDate] = useState(weekAgo());
  const [toDate, setToDate] = useState(today());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [stats, setStats] = useState<AttendanceStats>({ total: 0, present: 0, absent: 0, late: 0, leave: 0 });
  const [exporting, setExporting] = useState(false);

  const loadReport = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    if (batchId) params.set("batchId", batchId);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    api.getAttendance(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setRecords(data);
        setPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
        setStats({
          total: data.length,
          present: data.filter((r) => r.status === "present").length,
          absent: data.filter((r) => r.status === "absent").length,
          late: data.filter((r) => r.status === "late").length,
          leave: data.filter((r) => r.status === "leave").length,
        });
      } else {
        setRecords(data.records);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    }).catch(() => toast.error("Failed to load attendance report"));
  };

  useEffect(() => {
    api.getBatches().then((d) => {
      setBatches((Array.isArray(d) ? d : d.batches) as Batch[]);
    }).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [batchId, fromDate, toDate]);
  useEffect(() => { loadReport(page); }, [page, batchId, fromDate, toDate]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (batchId) params.set("batchId", batchId);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      const csv = await api.exportAttendanceCsv(params.toString());
      await Share.share({ message: csv, title: `attendance-${fromDate}-to-${toDate}.csv` });
      toast.success("Export ready — share or save as Excel (CSV)");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const statusVariant = (status: string): "success" | "warning" | "danger" | "primary" => {
    if (status === "present") return "success";
    if (status === "absent") return "danger";
    if (status === "late") return "warning";
    return "primary";
  };

  return (
    <Screen
      title="Attendance Reports"
      action={<Button label={exporting ? "Exporting..." : "Export"} onPress={handleExport} small disabled={exporting} />}
    >
      <Text style={{ color: colors.muted, fontSize: 13 }}>
        Teachers mark attendance per batch. This view is read-only — export reports as Excel (CSV) when needed.
      </Text>

      <SelectDropdown
        label="Batch"
        value={batchId}
        options={[{ id: "", label: "All batches" }, ...batches.map((b) => ({ id: b._id, label: b.name }))]}
        onChange={setBatchId}
      />
      <Input label="From (YYYY-MM-DD)" value={fromDate} onChangeText={setFromDate} />
      <Input label="To (YYYY-MM-DD)" value={toDate} onChangeText={setToDate} />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <View style={{ flex: 1, minWidth: "46%" }}><StatCard title="Total" value={stats.total} /></View>
        <View style={{ flex: 1, minWidth: "46%" }}><StatCard title="Present" value={stats.present} /></View>
        <View style={{ flex: 1, minWidth: "46%" }}><StatCard title="Absent" value={stats.absent} /></View>
        <View style={{ flex: 1, minWidth: "46%" }}><StatCard title="Late" value={stats.late} /></View>
      </View>

      {records.length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 24 }}>
          No attendance records for this filter.
        </Text>
      ) : (
        records.map((r) => (
          <Card key={r._id}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{r.student?.name || "—"}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {r.batch?.name || "—"} · {formatDate(r.date)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
              Marked by: {r.markedBy?.name || "—"} · {r.method}
            </Text>
            <View style={{ marginTop: 8 }}>
              <Badge label={r.status} variant={statusVariant(r.status)} />
            </View>
          </Card>
        ))
      )}

      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />
    </Screen>
  );
}