"use client";

import { useEffect, useState } from "react";
import { api, ParentChild } from "@/lib/api";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

type AttendanceRecord = {
  _id: string;
  date: string;
  status: string;
  batch?: { name: string };
};

export default function ParentAttendancePage() {
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
    <div className="space-y-6">
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="rounded-2xl border border-default bg-card p-6">
            <p className="text-sm text-muted">Attendance Rate</p>
            <p className="text-3xl font-bold text-primary">{percent}%</p>
            <p className="text-sm text-muted">{present} present out of {records.length} days</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-default">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default bg-surface">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Batch</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length ? records.map((r) => (
                  <tr key={r._id} className="border-b border-default last:border-0">
                    <td className="px-4 py-3">{formatDate(r.date)}</td>
                    <td className="px-4 py-3">{r.batch?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                        r.status === "present" ? "badge-success" : r.status === "late" ? "badge-warning" : "badge-danger"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">No attendance records</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}