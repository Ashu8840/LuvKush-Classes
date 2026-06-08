"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, Pagination as PaginationMeta } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserManagementCard } from "@/components/admin/UserManagementCard";

type Profile = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    isActive: boolean;
    recoverablePassword?: string;
  };
  feesStatus: string;
  totalFees: number;
  paidFees: number;
  attendancePercent: number;
  performanceScore: number;
  course?: { name: string };
  batch?: { name: string };
};

type Course = { _id: string; name: string };
type Batch = { _id: string; name: string; course?: { _id: string } };

export default function AdminStudentsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });

  const loadList = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    if (search) params.set("search", search);
    api.adminStudents(params.toString()).then((data) => {
      setProfiles((data.profiles as Profile[]) || []);
      if (data.pagination) setPagination(data.pagination as PaginationMeta);
    }).catch(() => toast.error("Failed to load students"));
  };

  useEffect(() => { loadList(page); }, [page, search]);
  useEffect(() => {
    api.getCourses().then((d) => setCourses((Array.isArray(d) ? d : d.courses) as Course[])).catch(() => {});
    api.getBatches().then((d) => setBatches((Array.isArray(d) ? d : d.batches) as Batch[])).catch(() => {});
  }, []);

  const filteredBatches = selectedCourse
    ? batches.filter((b) => b.course?._id === selectedCourse || !b.course)
    : batches;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.createStudent({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        phone: form.get("phone"),
        parentName: form.get("parentName"),
        parentPhone: form.get("parentPhone"),
        dateOfBirth: form.get("dateOfBirth") || undefined,
        address: form.get("address"),
        course: form.get("course") || undefined,
        batch: form.get("batch") || undefined,
        totalFees: Number(form.get("totalFees")) || 0,
      });
      setShowModal(false);
      setSelectedCourse("");
      loadList(1);
      setPage(1);
      toast.success("Student created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Student Management</h3>
        <button onClick={() => setShowModal(true)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Add Student
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search students..."
        className="input-field w-full max-w-md rounded-xl border px-4 py-2.5 text-sm"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <UserManagementCard
            key={p._id}
            user={p.user}
            actions={
              <>
                <button
                  onClick={() => setConfirm({
                    title: p.user.isActive ? "Block student?" : "Activate student?",
                    message: p.user.isActive
                      ? `${p.user.name} cannot login until reactivated.`
                      : `Allow ${p.user.name} to login again?`,
                    action: async () => {
                      try {
                        await api.updateStudent(p.user._id, { isActive: !p.user.isActive });
                        loadList(page);
                        toast.success(p.user.isActive ? "Student blocked" : "Student activated");
                      } catch { toast.error("Update failed"); }
                    },
                  })}
                  className="rounded-lg border border-default px-3 py-1.5 text-xs font-medium hover:bg-primary-light"
                >
                  {p.user.isActive ? "Block" : "Activate"}
                </button>
                <button
                  onClick={() => setConfirm({
                    title: "Archive student?",
                    message: `Archive ${p.user.name}?\n\nThey will be removed from active students but ALL records are permanently saved in the Database.`,
                    action: async () => {
                      try {
                        await api.archiveStudent(p.user._id);
                        loadList(page);
                        toast.success("Student archived");
                      } catch { toast.error("Archive failed"); }
                    },
                  })}
                  className="rounded-lg bg-danger-light px-3 py-1.5 text-xs font-medium text-danger hover:opacity-90"
                >
                  Archive
                </button>
              </>
            }
          >
            <p><span className="text-muted">Course:</span> {p.course?.name || "—"}</p>
            <p><span className="text-muted">Batch:</span> {p.batch?.name || "—"}</p>
            <p>
              <span className="text-muted">Fees:</span>{" "}
              <span className="capitalize">{p.feesStatus}</span>
              {" — "}
              {formatCurrency(p.paidFees)} / {formatCurrency(p.totalFees)}
            </p>
            <p><span className="text-muted">Attendance:</span> {p.attendancePercent}%</p>
            <p><span className="text-muted">Performance:</span> {p.performanceScore}</p>
          </UserManagementCard>
        ))}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Student" className="max-w-lg">
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <Input name="name" label="Full Name" required />
          <Input name="email" label="Email" type="email" required />
          <Input name="phone" label="Phone" />
          <Input name="password" label="Password" type="password" required minLength={6} />
          <Select name="course" label="Course" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">Select course (optional)</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select name="batch" label="Batch">
            <option value="">Select batch (optional)</option>
            {filteredBatches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
          <Input name="parentName" label="Parent Name" />
          <Input name="parentPhone" label="Parent Phone" />
          <Input name="dateOfBirth" label="Date of Birth" type="date" />
          <Input name="address" label="Address" />
          <Input name="totalFees" label="Total Fees (₹)" type="number" />
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {loading ? "Creating..." : "Create Student"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        confirmLabel="Confirm"
        variant="primary"
        onConfirm={() => confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}