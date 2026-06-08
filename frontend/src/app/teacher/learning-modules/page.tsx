"use client";

import { FormEvent, useEffect, useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, LibraryItem } from "@/lib/api";
import { parseLibraryResponse } from "@/lib/paginate";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Select } from "@/components/ui/input";
import { MaterialCard, MaterialViewerModal } from "@/components/library/MaterialViewer";

type Batch = { _id: string; name: string };

export default function TeacherLearningModulesPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewerItem, setViewerItem] = useState<LibraryItem | null>(null);

  const load = (p = page) => {
    const params = new URLSearchParams({ visibility: "course", page: String(p), limit: "6" });
    api.getLibrary(params.toString()).then((data) => {
      const parsed = parseLibraryResponse(data);
      setItems(parsed.items);
      setPages(parsed.pagination.pages);
    }).catch(() => toast.error("Failed to load modules"));
  };

  useEffect(() => { load(page); }, [page]);
  useEffect(() => {
    api.teacherDashboard().then((d) => setBatches((d.batches as Batch[]) || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const form = new FormData(e.currentTarget);
    try {
      const uploaded = await api.uploadFile(file, "materials");
      await api.addLibraryItem({
        title: form.get("title"),
        type: form.get("type"),
        category: form.get("category"),
        url: uploaded.url,
        visibility: "course",
        batch: form.get("batch") || undefined,
        tags: (form.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Learning module added for your students");
      setShowModal(false);
      setFile(null);
      load(1);
      setPage(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await api.deleteLibraryItem(deleteId);
      toast.success("Module deleted");
      load(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="rounded-2xl border border-default bg-gradient-to-br from-accent/10 via-card to-primary/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
              <GraduationCap className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Learning Modules</h3>
              <p className="text-sm text-muted">Only your enrolled students can access these — read in-app</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Module
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-default p-12 text-center text-muted">
          No learning modules yet. Add PDFs, videos, or notes for your students.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MaterialCard
              key={item._id}
              item={item}
              onOpen={setViewerItem}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <MaterialViewerModal item={viewerItem} open={!!viewerItem} onClose={() => setViewerItem(null)} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Learning Module">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="title" label="Title" required />
          <Select name="type" label="Type" required>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="note">Note</option>
            <option value="paper">Previous Year Paper</option>
          </Select>
          <Select name="category" label="Category" required>
            <option value="shorthand">Shorthand</option>
            <option value="typing">Typing</option>
            <option value="computer">Computer</option>
            <option value="ccc">CCC</option>
            <option value="general">General</option>
          </Select>
          <Select name="batch" label="Batch (optional)">
            <option value="">All your students</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
          <Input name="tags" label="Tags (comma separated)" />
          <div>
            <label className="text-sm font-medium">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1.5 w-full text-sm" required />
          </div>
          <button type="submit" disabled={uploading || !file} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground disabled:opacity-60">
            {uploading ? "Uploading..." : "Add for My Students"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete module?"
        message="Only your enrolled students will lose access to this module."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={remove}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}