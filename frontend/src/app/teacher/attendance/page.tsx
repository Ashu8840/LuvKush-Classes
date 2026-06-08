"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Users } from "lucide-react";
import { toast } from "sonner";
import { api, StudentProfile, User } from "@/lib/api";

type Student = StudentProfile & { user: User & { _id: string } };

export default function TeacherAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batchId, setBatchId] = useState("");
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [markedCount, setMarkedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMarkList = useCallback(async (bid?: string) => {
    setLoading(true);
    try {
      const data = await api.getAttendanceMarkList(bid);
      setStudents(data.students as Student[]);
      setMarkedCount(data.markedCount);
      setTotalStudents(data.totalStudents);
      const initial: Record<string, string> = {};
      (data.students as Student[]).forEach((s) => {
        initial[s.user._id] = "present";
      });
      setStatuses(initial);
    } catch {
      toast.error("Failed to load attendance list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.teacherDashboard().then((data) => {
      const batches = (data.batches as { _id: string }[]) || [];
      const bid = batches[0]?._id || "";
      setBatchId(bid);
      loadMarkList(bid);
    }).catch(() => setLoading(false));
  }, [loadMarkList]);

  const handleSave = async () => {
    if (!batchId || students.length === 0) return;
    setSaving(true);
    try {
      await api.markBulkAttendance({
        batchId,
        date: new Date().toISOString(),
        records: students.map((s) => ({
          studentId: s.user._id,
          status: statuses[s.user._id] || "present",
        })),
      });
      toast.success(`Attendance saved for ${students.length} student(s)`);
      await loadMarkList(batchId);
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Mark Today&apos;s Attendance</h3>
          <p className="text-sm text-muted">
            Students marked today won&apos;t appear until tomorrow
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 rounded-2xl border border-default bg-card p-4">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-accent" />
          <span className="text-muted">Pending today:</span>
          <span className="font-semibold">{students.length}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-muted">Already marked:</span>
          <span className="font-semibold">{markedCount} / {totalStudents}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted">Loading...</p>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success opacity-60" />
          <p className="mt-4 font-medium text-foreground">All students marked for today!</p>
          <p className="mt-1 text-sm text-muted">They will appear again tomorrow for marking.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <div key={s.user._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-default bg-card p-4">
              <span className="font-medium">{s.user.name}</span>
              <div className="flex flex-wrap gap-2">
                {["present", "absent", "late", "leave"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatuses((prev) => ({ ...prev, [s.user._id]: status }))}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                      statuses[s.user._id] === status
                        ? status === "present" ? "bg-success text-white"
                          : status === "absent" ? "bg-danger text-white"
                          : status === "late" ? "bg-warning text-white"
                          : "bg-primary text-primary-foreground"
                        : "border border-default"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}