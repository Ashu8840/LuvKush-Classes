"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, Pagination as PaginationMeta } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Course = {
  _id: string;
  name: string;
  category: string;
  level?: string;
  fee: number;
  duration?: string;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryMode, setCategoryMode] = useState("existing");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 6, total: 0, pages: 1 });

  const load = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    api.getCourses(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setCourses(data as Course[]);
        setPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setCourses(data.courses as Course[]);
        setPagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load courses"));
    api.getCourseCategories().then(setCategories).catch(() => {});
  };

  useEffect(() => { load(page); }, [page]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const category =
      categoryMode === "new"
        ? newCategory.trim().toLowerCase()
        : selectedCategory || (form.get("category") as string);

    if (!category) {
      toast.error("Please select or enter a category");
      setLoading(false);
      return;
    }

    try {
      await api.createCourse({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        category,
        level: form.get("level"),
        fee: Number(form.get("fee")) || 0,
        duration: form.get("duration"),
      });
      setShowModal(false);
      setCategoryMode("existing");
      setNewCategory("");
      load(1);
      setPage(1);
      toast.success("Course created");
    } catch {
      toast.error("Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  const removeCourse = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCourse(deleteTarget._id);
      load(page);
      toast.success("Course deleted");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Management</h3>
        <button onClick={() => setShowModal(true)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Create Course
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div key={course._id} className="relative rounded-2xl border border-default bg-card p-6">
            <button
              type="button"
              onClick={() => setDeleteTarget(course)}
              className="absolute right-4 top-4 rounded-lg p-2 text-danger transition hover:bg-danger-light"
              aria-label={`Delete ${course.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <span className="badge-primary rounded-full px-3 py-1 text-xs font-medium capitalize">{course.category}</span>
            <h4 className="mt-3 pr-8 text-lg font-semibold">{course.name}</h4>
            <p className="mt-1 text-sm text-muted">{course.level}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>{formatCurrency(course.fee)}</span>
              <span className="text-muted">{course.duration}</span>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Course">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" label="Course Name" required />
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCategoryMode("existing")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${categoryMode === "existing" ? "bg-primary text-primary-foreground" : "border border-default"}`}>
                Existing
              </button>
              <button type="button" onClick={() => setCategoryMode("new")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${categoryMode === "new" ? "bg-primary text-primary-foreground" : "border border-default"}`}>
                New category
              </button>
            </div>
            {categoryMode === "existing" ? (
              <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} required>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            ) : (
              <Input
                label="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. stenography, data-entry"
                required
              />
            )}
          </div>
          <Input name="level" label="Level" placeholder="e.g. 80 WPM" />
          <Input name="fee" label="Fee (₹)" type="number" required />
          <Input name="duration" label="Duration" placeholder="e.g. 3 months" />
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {loading ? "Creating..." : "Create Course"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete course?"
        message={deleteTarget ? `Delete "${deleteTarget.name}"?\n\nThis course will be permanently removed. Linked batches and enrollments will be unassigned. This cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={removeCourse}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}