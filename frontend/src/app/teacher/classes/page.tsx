"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Video, Plus, Radio, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, LiveClassSession } from "@/lib/api";
import { paginateSlice } from "@/lib/paginate";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

type Batch = { _id: string; name: string };

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<LiveClassSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    batchId: "",
    scheduledAt: "",
    duration: "60",
    waitingRoomEnabled: true,
  });

  const load = () => {
    api.getLiveClasses().then(setClasses).catch(() => toast.error("Failed to load classes"));
  };

  useEffect(() => {
    load();
    api.teacherDashboard().then((d) => setBatches((d.batches as Batch[]) || [])).catch(() => {});
  }, []);

  const schedule = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.scheduleLiveClass({
        title: form.title,
        description: form.description,
        batchId: form.batchId || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: Number(form.duration) || 60,
        waitingRoomEnabled: form.waitingRoomEnabled,
      });
      toast.success("Class scheduled");
      setShowSchedule(false);
      setForm({ title: "", description: "", batchId: "", scheduledAt: "", duration: "60", waitingRoomEnabled: true });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule");
    }
  };

  const goLive = async (id: string) => {
    try {
      await api.goLiveClass(id);
      toast.success("Class is now live");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to go live");
    }
  };

  const deleteClass = async () => {
    if (!deleteId) return;
    try {
      await api.deleteLiveClass(deleteId);
      toast.success("Class deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const liveNow = classes.filter((c) => c.status === "live");
  const scheduled = classes.filter((c) => c.status === "scheduled");
  const ended = classes.filter((c) => c.status === "ended");
  const scheduledPage = paginateSlice(scheduled, page);
  const endedPage = paginateSlice(ended, page);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Live Classes</h3>
          <p className="text-sm text-muted">Schedule like Meet/Zoom — admit students, chat, hand raise, screen share via video</p>
        </div>
        <button onClick={() => setShowSchedule(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Schedule Class
        </button>
      </div>

      {liveNow.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-success">Live Now</h4>
          {liveNow.map((c) => (
            <div key={c._id} className="rounded-2xl border-2 border-success bg-success-light p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold">{c.title}</p>
                  <p className="text-sm text-muted">{c.batch?.name} · {c.participantCount || 0} in class · {c.waitingCount || 0} waiting</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/teacher/classes/${c._id}`} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    Enter Room
                  </Link>
                  <button onClick={() => setDeleteId(c._id)} className="rounded-xl border border-danger px-4 py-2 text-sm text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {scheduledPage.items.map((c) => (
          <div key={c._id} className="rounded-2xl border border-default bg-card p-5">
            <div className="flex items-start gap-2">
              <Video className="h-5 w-5 text-muted" />
              <div className="flex-1">
                <h4 className="font-semibold">{c.title}</h4>
                <p className="text-sm text-muted">{formatDateTime(c.scheduledAt)} · {c.duration} min</p>
                <p className="text-xs text-muted">{c.batch?.name || "All batches"}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => goLive(c._id)} className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                <Radio className="h-3 w-3" /> Go Live
              </button>
              <Link href={`/teacher/classes/${c._id}`} className="rounded-xl border border-default px-4 py-2 text-xs font-medium">
                Open
              </Link>
              <button onClick={() => setDeleteId(c._id)} className="rounded-xl border border-danger px-4 py-2 text-xs text-danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {scheduled.length > 0 && <Pagination page={scheduledPage.page} pages={scheduledPage.pages} onPageChange={setPage} />}

      {endedPage.items.length > 0 && (
        <div>
          <h4 className="mb-3 font-semibold text-muted">Recent ended</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {endedPage.items.map((c) => (
              <div key={c._id} className="rounded-xl border border-default bg-card p-4 opacity-70">
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted capitalize">{c.status} · {formatDateTime(c.scheduledAt)}</p>
                <button onClick={() => setDeleteId(c._id)} className="mt-2 text-xs text-danger hover:underline">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Live Class">
        <form onSubmit={schedule} className="space-y-4">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Class title" className="input-field w-full rounded-xl border px-4 py-3" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="input-field w-full rounded-xl border p-3" rows={2} />
          <Select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
            <option value="">All batches</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
          <input required type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input-field w-full rounded-xl border px-4 py-3" />
          <input type="number" min={15} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration (min)" className="input-field w-full rounded-xl border px-4 py-3" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.waitingRoomEnabled} onChange={(e) => setForm({ ...form, waitingRoomEnabled: e.target.checked })} />
            Enable waiting room (admit students before they join video)
          </label>
          <button type="submit" className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground">Schedule</button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete live class?"
        message="This permanently removes the scheduled or ended class."
        confirmLabel="Delete"
        onConfirm={deleteClass}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}