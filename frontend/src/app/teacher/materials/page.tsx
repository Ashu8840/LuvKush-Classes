"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, LibraryItem } from "@/lib/api";
import { parseLibraryResponse } from "@/lib/paginate";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Select } from "@/components/ui/input";
import { MaterialCard, MaterialViewerModal } from "@/components/library/MaterialViewer";

export default function TeacherMaterialsPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewerItem, setViewerItem] = useState<LibraryItem | null>(null);

  const load = (p = page) => {
    const params = new URLSearchParams({ visibility: "public", page: String(p), limit: "6" });
    api.getLibrary(params.toString()).then((data) => {
      const parsed = parseLibraryResponse(data);
      setItems(parsed.items);
      setPages(parsed.pagination.pages);
    }).catch(() => toast.error("Failed to load library"));
  };

  useEffect(() => { load(page); }, [page]);

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
        visibility: "public",
        tags: (form.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Shared to public library for all students");
      setShowModal(false);
      setFile(null);
      load(1);
      setPage(1);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await api.deleteLibraryItem(deleteId);
      toast.success("Removed from public library");
      load(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="rounded-2xl border border-default bg-gradient-to-br from-primary/10 via-card to-accent/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Public Library</h3>
              <p className="text-sm text-muted">Materials here are free for all students — open and preview in-app</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Material
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-default p-12 text-center text-muted">
          No public materials yet. Use &quot;Add Material&quot; to share with all students.
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add to Public Library">
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
          <Input name="tags" label="Tags (comma separated)" />
          <div>
            <label className="text-sm font-medium">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1.5 w-full text-sm" required />
          </div>
          <button type="submit" disabled={uploading || !file} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground disabled:opacity-60">
            {uploading ? "Uploading..." : "Share with All Students"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Remove from library?"
        message="This material will no longer be visible in the public library."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={remove}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}