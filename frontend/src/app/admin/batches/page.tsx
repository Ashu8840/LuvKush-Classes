"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, Pagination as PaginationMeta } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Batch = {
  _id: string;
  name: string;
  type: string;
  timing: string;
  strength: number;
  course?: { _id: string; name: string };
  teacher?: { _id: string; name: string };
  students?: { name: string }[];
};

type Course = { _id: string; name: string };
type Teacher = { user: { _id: string; name: string } };

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [formCourses, setFormCourses] = useState<Course[]>([]);
  const [formTeachers, setFormTeachers] = useState<Teacher[]>([]);

  const load = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    api.getBatches(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setBatches(data as Batch[]);
        setPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setBatches(data.batches as Batch[]);
        setPagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load batches"));
  };

  useEffect(() => { load(page); }, [page]);
  useEffect(() => {
    api.getCourses().then((d) => setFormCourses((Array.isArray(d) ? d : d.courses) as Course[])).catch(() => {});
    api.adminTeachers().then((d) => setFormTeachers((d.profiles as Teacher[]) || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.createBatch({
        name: form.get("name"),
        type: form.get("type"),
        timing: form.get("timing"),
        strength: Number(form.get("strength")) || 30,
        course: form.get("course") || undefined,
        teacher: form.get("teacher") || undefined,
      });
      setShowModal(false);
      load(1);
      setPage(1);
      toast.success("Batch created");
    } catch {
      toast.error("Failed to create batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Batch Management</h3>
          <p className="text-sm text-muted">Assign course, teacher, timing and student capacity per batch</p>
        </div>
        <button onClick={() => setShowModal(true)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Create Batch
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {batches.map((batch) => (
          <div key={batch._id} className="rounded-2xl border border-default bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{batch.name}</h4>
                <p className="text-sm capitalize text-muted">{batch.type} batch · {batch.timing}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-success rounded-full px-3 py-1 text-xs font-medium">
                  {batch.students?.length || 0}/{batch.strength}
                </span>
                <button onClick={() => setDeleteTarget(batch)} className="rounded-lg p-2 text-danger hover:bg-danger-light">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <p><span className="text-muted">Course:</span> {batch.course?.name || "—"}</p>
              <p><span className="text-muted">Teacher:</span> {batch.teacher?.name || "—"}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Batch">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" label="Batch Name" placeholder="e.g. Morning Batch A" required />
          <Select name="type" label="Batch Type" required>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="weekend">Weekend</option>
          </Select>
          <Input name="timing" label="Timing" placeholder="e.g. 8:00 AM – 11:00 AM" required />
          <Input name="strength" label="Max Students" type="number" defaultValue={30} min={1} required />
          <Select name="course" label="Course">
            <option value="">Select course</option>
            {formCourses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select name="teacher" label="Assigned Teacher">
            <option value="">Select teacher</option>
            {formTeachers.map((t) => <option key={t.user._id} value={t.user._id}>{t.user.name}</option>)}
          </Select>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {loading ? "Creating..." : "Create Batch"}
          </button>
        </form>
      </Modal>

      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete batch?"
        message={`Delete "${deleteTarget?.name}"? Students will be unassigned from this batch.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await api.deleteBatch(deleteTarget._id);
            load(page);
            toast.success("Batch deleted");
          } catch {
            toast.error("Failed to delete batch");
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}