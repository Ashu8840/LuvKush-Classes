"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Trash2, Star, MessageSquare, Filter, Globe, Quote, User,
  Mail, Phone, MapPin, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { api, ContactStatus, Feedback, FeedbackCategory } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FEEDBACK_CATEGORIES, getCategoryLabel } from "@/lib/feedback";
import { formatDateTime } from "@/lib/utils";
import { Card, StatCard } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type TypeFilter = "" | "feedback" | "testimonial" | "contact";

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New",
  contacted: "Contacted",
  resolved: "Resolved",
};

const STATUS_CLASS: Record<ContactStatus, string> = {
  new: "bg-warning-light text-warning",
  contacted: "bg-primary-light text-accent",
  resolved: "bg-success-light text-success",
};

function StudentAvatar({ name, avatar }: { name: string; avatar?: string }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-default bg-primary-light">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
          {initials}
        </div>
      )}
    </div>
  );
}

function AdminStudentFeedbackContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as TypeFilter) || "";
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    ["feedback", "testimonial", "contact"].includes(initialType) ? initialType : ""
  );
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    avgRating: null as number | null,
    byCategory: {} as Record<string, number>,
    approvedTestimonials: 0,
    maxHomepageTestimonials: 6,
    newContactInquiries: 0,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const load = (p = page, cat = category, type = typeFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "6" });
    if (cat) params.set("category", cat);
    if (type) params.set("type", type);
    api
      .getAdminFeedback(params.toString())
      .then((data) => {
        setItems(data.feedback);
        setPage(data.pagination.page);
        setPages(data.pagination.pages);
        setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, category, typeFilter); }, [category, typeFilter]);

  const remove = async () => {
    if (!deleteId) return;
    try {
      await api.deleteFeedback(deleteId);
      load(page, category, typeFilter);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleHomepage = async (item: Feedback) => {
    setTogglingId(item._id);
    try {
      await api.toggleTestimonialApproval(item._id, !item.approvedForHomepage);
      load(page, category, typeFilter);
      toast.success(item.approvedForHomepage ? "Removed from homepage" : "Approved for homepage");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setTogglingId(null);
    }
  };

  const setContactStatus = async (id: string, status: ContactStatus) => {
    setStatusUpdatingId(id);
    try {
      await api.updateContactStatus(id, status);
      load(page, category, typeFilter);
      toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Feedback, Testimonials &amp; Contact</h3>
          <p className="text-sm text-muted">
            Student feedback, homepage testimonials, and public contact form inquiries
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="min-w-[160px]"
          >
            <option value="">All types</option>
            <option value="feedback">Student feedback</option>
            <option value="testimonial">Testimonials</option>
            <option value="contact">Contact Us</option>
          </Select>
          {typeFilter !== "contact" && (
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory | "")}
              className="min-w-[180px]"
            >
              <option value="">All categories</option>
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total" value={stats.total} icon={<MessageSquare className="h-5 w-5" />} />
        <StatCard title="Avg rating" value={stats.avgRating ?? "—"} icon={<Star className="h-5 w-5" />} />
        <StatCard
          title="New contacts"
          value={stats.newContactInquiries}
          icon={<Mail className="h-5 w-5" />}
        />
        <StatCard
          title="Homepage"
          value={`${stats.approvedTestimonials}/${stats.maxHomepageTestimonials}`}
          icon={<Globe className="h-5 w-5" />}
        />
        <StatCard title="This page" value={items.length} icon={<Filter className="h-5 w-5" />} />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="py-16 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted opacity-40" />
          <p className="mt-4 text-muted">No submissions yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((f) => (
            <Card key={f._id} className="relative">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-1 gap-3">
                  {f.isContactInquiry && f.contact ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                  ) : f.isTestimonial && f.student ? (
                    <StudentAvatar name={f.student.name} avatar={f.student.avatar} />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                      <User className="h-5 w-5 text-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {f.isContactInquiry ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-accent">
                          <MapPin className="h-3 w-3" />
                          Contact Us
                        </span>
                      ) : f.isTestimonial ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-accent">
                          <Quote className="h-3 w-3" />
                          Testimonial
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium capitalize text-accent">
                          {getCategoryLabel(f.category)}
                        </span>
                      )}
                      <span className="text-xs text-muted">{formatDateTime(f.createdAt)}</span>
                      {!f.isTestimonial && !f.isContactInquiry && (
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">Anonymous</span>
                      )}
                      {f.approvedForHomepage && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2.5 py-0.5 text-xs font-medium text-success">
                          <Globe className="h-3 w-3" />
                          On homepage
                        </span>
                      )}
                      {f.contact?.status && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[f.contact.status]}`}>
                          {STATUS_LABEL[f.contact.status]}
                        </span>
                      )}
                    </div>

                    {f.isContactInquiry && f.contact && (
                      <div className="mt-2 space-y-1">
                        <p className="font-semibold text-foreground">{f.contact.name}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <a href={`mailto:${f.contact.email}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                            <Mail className="h-3.5 w-3.5" />
                            {f.contact.email}
                          </a>
                          <a href={`tel:${f.contact.phone}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                            <Phone className="h-3.5 w-3.5" />
                            {f.contact.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {f.isTestimonial && f.student && (
                      <p className="font-medium text-foreground">{f.student.name}</p>
                    )}
                    {f.subject && <p className="font-medium text-foreground">{f.subject}</p>}
                    {f.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < f.rating! ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {f.isContactInquiry && f.contact && (
                    <>
                      {f.contact.status !== "contacted" && (
                        <button
                          onClick={() => setContactStatus(f._id, "contacted")}
                          disabled={statusUpdatingId === f._id}
                          className="rounded-lg border border-default px-3 py-2 text-xs font-medium text-foreground hover:bg-surface"
                        >
                          Mark contacted
                        </button>
                      )}
                      {f.contact.status !== "resolved" && (
                        <button
                          onClick={() => setContactStatus(f._id, "resolved")}
                          disabled={statusUpdatingId === f._id}
                          className="inline-flex items-center gap-1 rounded-lg bg-success-light px-3 py-2 text-xs font-medium text-success hover:opacity-80"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolved
                        </button>
                      )}
                    </>
                  )}
                  {f.isTestimonial && (
                    <button
                      onClick={() => toggleHomepage(f)}
                      disabled={togglingId === f._id}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                        f.approvedForHomepage
                          ? "bg-success-light text-success hover:opacity-80"
                          : "border border-default text-foreground hover:bg-surface"
                      }`}
                    >
                      {togglingId === f._id ? "…" : f.approvedForHomepage ? "Remove from site" : "Show on homepage"}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(f._id)}
                    className="rounded-lg p-2 text-danger transition hover:bg-danger-light"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{f.message}</p>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1, category, typeFilter)}
            className="rounded-xl border border-default px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center text-sm text-muted">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => load(page + 1, category, typeFilter)}
            className="rounded-xl border border-default px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete submission?"
        message="Remove this entry permanently?"
        confirmLabel="Delete"
        onConfirm={remove}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

export default function AdminStudentFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      }
    >
      <AdminStudentFeedbackContent />
    </Suspense>
  );
}