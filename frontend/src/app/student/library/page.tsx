"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { api, LibraryItem } from "@/lib/api";
import { parseLibraryResponse } from "@/lib/paginate";
import { Pagination } from "@/components/ui/pagination";
import { MaterialCard, MaterialViewerModal } from "@/components/library/MaterialViewer";

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [viewerItem, setViewerItem] = useState<LibraryItem | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ visibility: "public", page: String(page), limit: "6" });
    if (search) params.set("search", search);
    if (filter) params.set("category", filter);
    api.getLibrary(params.toString()).then((data) => {
      const parsed = parseLibraryResponse(data);
      setItems(parsed.items);
      setPages(parsed.pagination.pages);
    }).catch(() => {});
  }, [search, filter, page]);

  useEffect(() => { setPage(1); }, [search, filter]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-default bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <BookOpen className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Digital Library</h3>
            <p className="mt-1 text-sm text-muted">
              Browse public study materials — read PDFs and notes right inside the app
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="input-field w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        {["", "shorthand", "typing", "ccc", "computer"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium capitalize transition ${
              filter === cat ? "bg-primary text-primary-foreground shadow-sm" : "border border-default text-foreground hover:bg-surface"
            }`}
          >
            {cat || "All"}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-default p-12 text-center text-muted">
          No materials found
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
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