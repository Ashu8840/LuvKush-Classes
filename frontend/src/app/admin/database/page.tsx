"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, Pagination as PaginationMeta } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

type User = { _id: string; name: string; email: string; role: string; archivedAt?: string };
type StudentProfile = {
  user: User;
  course?: { name: string };
  performanceScore: number;
  attendancePercent: number;
};
type TeacherProfile = { user: User; qualification?: string; experience?: string };
type DeleteTarget = { user: User; role: "student" | "teacher" };

export default function AdminDatabasePage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const load = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    if (search) params.set("search", search);
    if (tab !== "all") params.set("role", tab);
    api.adminDatabase(params.toString()).then((d) => {
      setStudentProfiles((d.studentProfiles as StudentProfile[]) || []);
      setTeacherProfiles((d.teacherProfiles as TeacherProfile[]) || []);
      if (d.pagination) setPagination(d.pagination as PaginationMeta);
    }).catch(() => toast.error("Failed to load database"));
  };

  useEffect(() => { setPage(1); }, [search, tab]);
  useEffect(() => { load(page); }, [page, search, tab]);

  const openRecord = async (userId: string) => {
    setSelected(userId);
    try {
      setRecord(await api.getPersonRecord(userId));
    } catch { setRecord(null); }
  };

  const removeRecord = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteArchivedRecord(deleteTarget.user._id);
      if (selected === deleteTarget.user._id) {
        setSelected(null);
        setRecord(null);
      }
      load(page);
      toast.success("Record deleted permanently");
    } catch {
      toast.error("Failed to delete record");
    }
  };

  const user = record?.user as User | undefined;
  const profile = record?.profile as Record<string, unknown> | undefined;
  const certificates = (record?.certificates as { type: string; course?: { name: string }; certificateId: string; score?: number }[]) || [];
  const fees = (record?.fees as { amount: number; paidAmount: number; status: string }[]) || [];
  const attendance = (record?.attendance as { date: string; status: string }[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Records Database</h3>
        <p className="mt-1 text-sm text-muted">
          Permanent archive of passed students and former teachers. Scores, certificates, fees and attendance are preserved forever.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input-field flex-1 min-w-[200px] rounded-xl border px-4 py-2.5 text-sm"
        />
        {["all", "student", "teacher"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium capitalize ${tab === t ? "bg-primary text-primary-foreground" : "border border-default"}`}
          >
            {t === "all" ? "All" : `${t}s`}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(tab === "all" || tab === "student") && studentProfiles.map((p) => (
          <div
            key={p.user._id}
            role="button"
            tabIndex={0}
            onClick={() => openRecord(p.user._id)}
            onKeyDown={(e) => e.key === "Enter" && openRecord(p.user._id)}
            className="rounded-2xl border border-default bg-card p-6 text-left transition hover:border-primary/40"
          >
            <div className="flex justify-between gap-2">
              <span className="font-semibold">{p.user.name}</span>
              <div className="flex items-center gap-2">
                <span className="badge-primary rounded-full px-2 py-0.5 text-xs">Student</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ user: p.user, role: "student" }); }}
                  className="rounded-lg p-1.5 text-danger transition hover:bg-danger-light"
                  aria-label={`Delete ${p.user.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted">{p.user.email}</p>
            <p className="mt-2 text-xs text-muted">Archived: {p.user.archivedAt ? formatDate(p.user.archivedAt) : "—"}</p>
            <p className="mt-1 text-sm">{p.course?.name} · Score {p.performanceScore} · {p.attendancePercent}% attendance</p>
          </div>
        ))}
        {(tab === "all" || tab === "teacher") && teacherProfiles.map((p) => (
          <div
            key={p.user._id}
            role="button"
            tabIndex={0}
            onClick={() => openRecord(p.user._id)}
            onKeyDown={(e) => e.key === "Enter" && openRecord(p.user._id)}
            className="rounded-2xl border border-default bg-card p-6 text-left transition hover:border-primary/40"
          >
            <div className="flex justify-between gap-2">
              <span className="font-semibold">{p.user.name}</span>
              <div className="flex items-center gap-2">
                <span className="badge-warning rounded-full px-2 py-0.5 text-xs">Teacher</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ user: p.user, role: "teacher" }); }}
                  className="rounded-lg p-1.5 text-danger transition hover:bg-danger-light"
                  aria-label={`Delete ${p.user.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted">{p.user.email}</p>
            <p className="mt-2 text-sm">{p.qualification} · {p.experience}</p>
          </div>
        ))}
      </div>

      {studentProfiles.length === 0 && teacherProfiles.length === 0 && (
        <p className="text-center text-muted">No archived records yet. Archive students or teachers from their management pages.</p>
      )}

      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <Modal open={!!selected} onClose={() => { setSelected(null); setRecord(null); }} title={user?.name || "Full Record"}>
        {user && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted">{user.email} · {user.role}</p>
              <button
                type="button"
                onClick={() => setDeleteTarget({ user, role: user.role as "student" | "teacher" })}
                className="flex items-center gap-1.5 rounded-lg bg-danger-light px-3 py-1.5 text-xs font-medium text-danger hover:opacity-90"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete record
              </button>
            </div>
            {profile && (
              <p>Performance: {(profile as { performanceScore?: number }).performanceScore ?? "—"} · Attendance: {(profile as { attendancePercent?: number }).attendancePercent ?? "—"}%</p>
            )}
            {certificates.length > 0 && (
              <div>
                <p className="font-semibold">Certificates</p>
                {certificates.map((c, i) => (
                  <p key={i} className="text-muted">{c.type} — {c.course?.name} · {c.certificateId}{c.score ? ` · Score ${c.score}` : ""}</p>
                ))}
              </div>
            )}
            {fees.length > 0 && (
              <div>
                <p className="font-semibold">Fee History</p>
                {fees.slice(0, 8).map((f, i) => (
                  <p key={i} className="text-muted">{formatCurrency(f.amount)} — {f.status} (paid {formatCurrency(f.paidAmount)})</p>
                ))}
              </div>
            )}
            {attendance.length > 0 && (
              <div>
                <p className="font-semibold">Attendance ({attendance.length} records)</p>
                {attendance.slice(0, 8).map((a, i) => (
                  <p key={i} className="text-muted">{formatDate(a.date)} — {a.status}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete record permanently?"
        message={deleteTarget ? `Delete "${deleteTarget.user.name}" (${deleteTarget.role}) from the database?\n\nAll archived data will be permanently removed. This cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={removeRecord}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}