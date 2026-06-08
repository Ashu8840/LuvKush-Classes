"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { api, LibraryItem } from "@/lib/api";
import { parseLibraryResponse } from "@/lib/paginate";
import { Pagination } from "@/components/ui/pagination";
import { MaterialCard, MaterialViewerModal } from "@/components/library/MaterialViewer";

export default function StudentCoursesPage() {
  const [modules, setModules] = useState<LibraryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [viewerItem, setViewerItem] = useState<LibraryItem | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ visibility: "course", page: String(page), limit: "6" });
    api.getLibrary(params.toString()).then((data) => {
      const parsed = parseLibraryResponse(data);
      setModules(parsed.items);
      setPages(parsed.pagination.pages);
    }).catch(() => {});
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-default bg-gradient-to-br from-accent/10 via-card to-primary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
            <GraduationCap className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">My Learning Modules</h3>
            <p className="mt-1 text-sm text-muted">
              Course materials from your teacher — open and read without leaving the app
            </p>
          </div>
        </div>
      </div>

      {modules.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-default p-12 text-center text-muted">
          No learning modules from your teacher yet
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((item) => (
            <MaterialCard key={item._id} item={item} onOpen={setViewerItem} />
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <MaterialViewerModal
        item={viewerItem}
        open={!!viewerItem}
        onClose={() => setViewerItem(null)}
      />
    </div>
  );
}