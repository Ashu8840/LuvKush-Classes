"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { api, AttendanceRecord, AttendanceStats, Pagination } from "@/lib/api";
import { Pagination as Pager } from "@/components/ui/pagination";
import { Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/card";

type Batch = { _id: string; name: string };

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
};

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [fromDate, setFromDate] = useState(weekAgo());
  const [toDate, setToDate] = useState(today());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 6, total: 0, pages: 1 });
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
      const list = (Array.isArray(d) ? d : d.batches) as Batch[];
      setBatches(list);
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
      await api.exportAttendance(params.toString());
      toast.success("Attendance report exported as Excel (CSV)");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Attendance Reports</h3>
          <p className="text-sm text-muted">
            View attendance marked by teachers per batch. Admins cannot mark attendance — teachers handle that in their panel.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl border border-default px-5 py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select label="Batch" value={batchId} onChange={(e) => setBatchId(e.target.value)} className="min-w-[200px]">
          <option value="">All batches</option>
          {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </Select>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field rounded-xl border px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field rounded-xl border px-4 py-2.5 text-sm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total records" value={stats.total} icon={<UserCheck className="h-5 w-5" />} />
        <StatCard title="Present" value={stats.present} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard title="Absent" value={stats.absent} icon={<XCircle className="h-5 w-5" />} />
        <StatCard title="Late" value={stats.late} icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Leave" value={stats.leave} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-default">
        <table className="w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Batch</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Marked By</th>
              <th className="px-6 py-4">Method</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted">
                  No attendance records for this filter. Teachers mark attendance daily from their panel.
                </td>
              </tr>
            ) : records.map((r) => (
              <tr key={r._id} className="border-t border-default">
                <td className="px-6 py-4">{r.student?.name || "—"}</td>
                <td className="px-6 py-4">{r.batch?.name || "—"}</td>
                <td className="px-6 py-4">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 capitalize">{r.status}</td>
                <td className="px-6 py-4">{r.markedBy?.name || "—"}</td>
                <td className="px-6 py-4 capitalize">{r.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager page={page} pages={pagination.pages} onPageChange={setPage} />
    </div>
  );
}