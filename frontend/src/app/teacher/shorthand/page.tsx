"use client";

import { useEffect, useState, FormEvent } from "react";
import { Mic, Upload, Trash2, Play } from "lucide-react";
import { toast } from "sonner";
import { api, ShorthandDictation } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function TeacherShorthandPage() {
  const [dictations, setDictations] = useState<ShorthandDictation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    transcript: "",
    targetWpm: 80,
    durationSeconds: 120,
    audioUrl: "",
  });

  const loadDictations = () => {
    api.getDictations()
      .then(setDictations)
      .catch(() => toast.error("Failed to load dictations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDictations(); }, []);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadAudio(file);
      setForm((f) => ({ ...f, audioUrl: url }));
      toast.success("Audio uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.audioUrl) {
      toast.error("Please upload an audio file");
      return;
    }
    try {
      await api.createDictation(form);
      toast.success("Dictation created!");
      setForm({ title: "", transcript: "", targetWpm: 80, durationSeconds: 120, audioUrl: "" });
      setShowForm(false);
      loadDictations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create dictation");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteDictation(deleteId);
      toast.success("Dictation removed");
      loadDictations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Shorthand Dictations</h3>
          <p className="text-sm text-muted">Upload audio dictations for students to practice</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {showForm ? "Cancel" : "Upload Dictation"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-default bg-card p-6">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Dictation title"
            className="input-field w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
            required
          />
          <textarea
            value={form.transcript}
            onChange={(e) => setForm({ ...form, transcript: e.target.value })}
            placeholder="Full transcript (used for AI evaluation)"
            className="input-field h-32 w-full rounded-xl border p-4 outline-none focus:border-primary"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted">Target WPM</label>
              <input
                type="number"
                value={form.targetWpm}
                onChange={(e) => setForm({ ...form, targetWpm: Number(e.target.value) })}
                className="input-field mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
                min={40}
                max={200}
              />
            </div>
            <div>
              <label className="text-sm text-muted">Duration (seconds)</label>
              <input
                type="number"
                value={form.durationSeconds}
                onChange={(e) => setForm({ ...form, durationSeconds: Number(e.target.value) })}
                className="input-field mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
                min={30}
              />
            </div>
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-default p-6 transition hover:bg-surface">
              <Upload className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">{uploading ? "Uploading..." : "Upload Audio File"}</p>
                <p className="text-sm text-muted">MP3, WAV, or M4A via Cloudinary</p>
              </div>
              <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" disabled={uploading} />
            </label>
            {form.audioUrl && (
              <audio controls src={form.audioUrl} className="mt-3 w-full" />
            )}
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            Create Dictation
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {dictations.length ? dictations.map((d) => (
            <div key={d._id} className="rounded-2xl border border-default bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary-light p-3 text-primary">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{d.title}</h4>
                    <p className="text-sm text-muted">{d.targetWpm} WPM · {d.durationSeconds}s</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(d._id)}
                  className="rounded-lg p-2 text-danger hover:bg-danger-light"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <audio controls src={d.audioUrl} className="mt-4 w-full" />
              <p className="mt-2 text-xs text-muted">
                {d.batch?.name || "All batches"} · {new Date(d.createdAt).toLocaleDateString()}
              </p>
            </div>
          )) : (
            <p className="col-span-2 text-center text-muted">No dictations yet. Upload your first one!</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate dictation?"
        message="Students will no longer see this dictation."
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}