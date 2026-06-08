"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, Pagination as PaginationMeta } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Profile = {
  _id: string;
  user: { _id: string; name: string; email: string; phone?: string; isActive: boolean };
  qualification?: string;
  experience?: string;
  salary?: number;
  subjects?: string[];
  joiningDate?: string;
  batches?: { name: string; timing?: string }[];
};

type Batch = { _id: string; name: string };

export default function AdminTeachersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });

  const loadList = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    if (search) params.set("search", search);
    api.adminTeachers(params.toString()).then((data) => {
      setProfiles((data.profiles as Profile[]) || []);
      if (data.pagination) setPagination(data.pagination as PaginationMeta);
    }).catch(() => toast.error("Failed to load teachers"));
  };

  useEffect(() => { loadList(page); }, [page, search]);
  useEffect(() => {
    api.getBatches().then((d) => setBatches((Array.isArray(d) ? d : d.batches) as Batch[])).catch(() => {});
  }, []);

  const toggleBatch = (id: string) => {
    setSelectedBatches((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.createTeacher({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        phone: form.get("phone"),
        qualification: form.get("qualification"),
        experience: form.get("experience"),
        salary: Number(form.get("salary")) || 0,
        joiningDate: form.get("joiningDate") || undefined,
        subjects: form.get("subjects"),
        batches: selectedBatches,
      });
      setShowModal(false);
      setSelectedBatches([]);
      loadList(1);
      setPage(1);
      toast.success("Teacher created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Teacher Management</h3>
        <button onClick={() => setShowModal(true)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Add Teacher
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search teachers..."
        className="input-field w-full max-w-md rounded-xl border px-4 py-2.5 text-sm"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <div key={p._id} className="rounded-2xl border border-default bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{p.user?.name}</h4>
                <p className="text-sm text-muted">{p.user?.email}</p>
                {p.user?.phone && <p className="text-xs text-muted">{p.user.phone}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.user?.isActive ? "badge-success" : "badge-danger"}`}>
                {p.user?.isActive ? "Active" : "Blocked"}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted">Qualification:</span> {p.qualification || "—"}</p>
              <p><span className="text-muted">Experience:</span> {p.experience || "—"}</p>
              <p><span className="text-muted">Subjects:</span> {p.subjects?.join(", ") || "—"}</p>
              <p><span className="text-muted">Batches:</span> {p.batches?.map((b) => b.name).join(", ") || "—"}</p>
              <p><span className="text-muted">Salary:</span> {p.salary ? formatCurrency(p.salary) : "—"}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirm({
                  title: p.user.isActive ? "Block teacher?" : "Activate teacher?",
                  message: p.user.isActive ? `Block ${p.user.name}?` : `Activate ${p.user.name}?`,
                  action: async () => {
                    try {
                      await api.updateTeacher(p.user._id, { isActive: !p.user.isActive });
                      loadList(page);
                      toast.success("Teacher updated");
                    } catch { toast.error("Update failed"); }
                  },
                })}
                className="rounded-lg border border-default px-3 py-1.5 text-xs font-medium hover:bg-primary-light"
              >
                {p.user.isActive ? "Block" : "Activate"}
              </button>
              <button
                onClick={() => setConfirm({
                  title: "Archive teacher?",
                  message: `Archive ${p.user.name}? Records are permanently saved in the Database.`,
                  action: async () => {
                    try {
                      await api.archiveTeacher(p.user._id);
                      loadList(page);
                      toast.success("Teacher archived");
                    } catch { toast.error("Archive failed"); }
                  },
                })}
                className="rounded-lg bg-danger-light px-3 py-1.5 text-xs font-medium text-danger"
              >
                Archive
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Teacher" className="max-w-lg">
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <Input name="name" label="Full Name" required />
          <Input name="email" label="Email" type="email" required />
          <Input name="phone" label="Phone" />
          <Input name="password" label="Password" type="password" required minLength={6} />
          <Input name="qualification" label="Qualification" placeholder="e.g. MA, Diploma in Stenography" />
          <Input name="experience" label="Experience" placeholder="e.g. 5 years" />
          <Input name="subjects" label="Subjects" placeholder="Shorthand, Typing, CCC (comma separated)" />
          <Input name="salary" label="Salary (₹)" type="number" />
          <Input name="joiningDate" label="Joining Date" type="date" />
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Assigned Batches</label>
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-default p-3">
              {batches.length === 0 ? (
                <p className="text-xs text-muted">No batches yet — create batches first</p>
              ) : batches.map((b) => (
                <label key={b._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedBatches.includes(b._id)} onChange={() => toggleBatch(b._id)} />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {loading ? "Creating..." : "Create Teacher"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} title={confirm?.title || ""} message={confirm?.message || ""} confirmLabel="Confirm" variant="primary" onConfirm={() => confirm?.action()} onClose={() => setConfirm(null)} />
    </div>
  );
}