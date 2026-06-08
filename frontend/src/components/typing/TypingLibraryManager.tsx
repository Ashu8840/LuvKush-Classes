"use client";

import { useEffect, useState, FormEvent } from "react";
import { Bot, Keyboard, Plus, Sparkles, Trash2, BookOpen, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { api, TypingPassage } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

type FormState = {
  title: string;
  content: string;
  language: "english" | "hindi";
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  isAiGenerated?: boolean;
};

const PAGE_SIZE = 6;

const emptyForm: FormState = {
  title: "",
  content: "",
  language: "english",
  difficulty: "intermediate",
  category: "general",
  isAiGenerated: false,
};

function LibraryModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-default bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-default px-5 py-4">
          <h4 className="text-lg font-semibold">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-default transition hover:bg-danger-light hover:text-danger"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function TypingLibraryManager() {
  const [passages, setPassages] = useState<TypingPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<"add" | "ai" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterLang, setFilterLang] = useState<"" | "english" | "hindi">("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [aiForm, setAiForm] = useState({
    language: "english" as "english" | "hindi",
    topic: "",
    difficulty: "intermediate" as "beginner" | "intermediate" | "advanced",
    targetWords: 1200,
  });

  const loadPassages = () => {
    setLoading(true);
    api
      .getTypingPassages(filterLang ? { language: filterLang } : undefined)
      .then(setPassages)
      .catch(() => toast.error("Failed to load typing passages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPassages();
    setPage(1);
  }, [filterLang]);

  const totalPages = Math.max(1, Math.ceil(passages.length / PAGE_SIZE));
  const paginatedPassages = passages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeModal]);

  const closeModal = () => setActiveModal(null);

  const openAddModal = () => {
    setActiveModal("add");
  };

  const openAiModal = () => {
    setActiveModal("ai");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const words = countWords(form.content);
    if (words < 100) {
      toast.error("Content must have at least 100 words");
      return;
    }
    setSaving(true);
    try {
      await api.createTypingPassage({ ...form, isAiGenerated: form.isAiGenerated || false });
      toast.success("Passage added to Typing Library!");
      setForm(emptyForm);
      closeModal();
      loadPassages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save passage");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const generated = await api.generateTypingPassage(aiForm);
      setForm({
        title: generated.title,
        content: generated.content,
        language: aiForm.language,
        difficulty: aiForm.difficulty,
        category: aiForm.topic || "general",
        isAiGenerated: true,
      });
      closeModal();
      setActiveModal("add");
      toast.success(`AI generated ${generated.wordCount} words — review and save`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteTypingPassage(deleteId);
      toast.success("Passage removed");
      loadPassages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const formWordCount = countWords(form.content);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            Typing Library
          </h3>
          <p className="text-sm text-muted">
            Manage practice passages (1000–2000 words) for English & Hindi typing drills
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openAiModal}
            className="inline-flex items-center gap-2 rounded-xl border border-default px-4 py-2.5 text-sm font-medium transition hover:bg-primary-light"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Generate with AI
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              openAddModal();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Passage
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["", "english", "hindi"] as const).map((lang) => (
          <button
            key={lang || "all"}
            type="button"
            onClick={() => setFilterLang(lang)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              filterLang === lang ? "bg-primary text-primary-foreground" : "border border-default"
            }`}
          >
            {lang || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : passages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default p-12 text-center">
          <Keyboard className="mx-auto mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">No passages yet. Add manually or generate with AI.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedPassages.map((p) => (
              <div
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-muted">
                    {p.language} · {p.difficulty} · {p.wordCount} words · {p.category}
                    {p.isAiGenerated && " · AI generated"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{p.content.slice(0, 120)}...</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteId(p._id)}
                  className="rounded-lg border border-default p-2 text-danger transition hover:bg-danger-light"
                  title="Remove passage"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-sm text-muted">
                Page {page} of {totalPages} · {passages.length} passages
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-default px-3 py-2 text-sm font-medium disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium ${
                      page === n ? "bg-primary text-primary-foreground" : "border border-default"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-default px-3 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeModal === "ai" && (
        <LibraryModal title="Generate with AI (Groq)" onClose={closeModal}>
          <form onSubmit={handleGenerate} className="space-y-4">
            <p className="flex items-center gap-2 text-sm text-muted">
              <Bot className="h-4 w-4 text-primary" />
              AI will create a 1000–2000 word passage for typing practice
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={aiForm.language}
                onChange={(e) => setAiForm({ ...aiForm, language: e.target.value as "english" | "hindi" })}
                className="input-field rounded-xl border px-4 py-3 outline-none focus:border-primary"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
              <select
                value={aiForm.difficulty}
                onChange={(e) =>
                  setAiForm({ ...aiForm, difficulty: e.target.value as "beginner" | "intermediate" | "advanced" })
                }
                className="input-field rounded-xl border px-4 py-3 outline-none focus:border-primary"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <input
              value={aiForm.topic}
              onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
              placeholder="Topic e.g. technology, nature, daily routine..."
              className="input-field w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
            />
            <div>
              <label className="mb-1 block text-xs text-muted">Target words: {aiForm.targetWords}</label>
              <input
                type="range"
                min={1000}
                max={2000}
                step={100}
                value={aiForm.targetWords}
                onChange={(e) => setAiForm({ ...aiForm, targetWords: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <button
              type="submit"
              disabled={generating}
              className="w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate Passage"}
            </button>
          </form>
        </LibraryModal>
      )}

      {activeModal === "add" && (
        <LibraryModal title="Add Passage" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Passage title"
              className="input-field w-full rounded-xl border px-4 py-3 outline-none focus:border-primary"
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as "english" | "hindi" })}
                className="input-field rounded-xl border px-4 py-3 outline-none focus:border-primary"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value as "beginner" | "intermediate" | "advanced" })
                }
                className="input-field rounded-xl border px-4 py-3 outline-none focus:border-primary"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Category"
                className="input-field rounded-xl border px-4 py-3 outline-none focus:border-primary"
              />
            </div>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Paste typing passage content (aim for 1000–2000 words)..."
              rows={12}
              className="input-field w-full rounded-xl border px-4 py-3 font-mono text-sm outline-none focus:border-primary"
              required
            />
            <p className={`text-sm ${formWordCount >= 1000 && formWordCount <= 2000 ? "text-success" : "text-muted"}`}>
              Word count: {formWordCount}{" "}
              {formWordCount >= 1000 && formWordCount <= 2000 ? "✓ ideal range" : "(recommended: 1000–2000)"}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save to Library"}
            </button>
          </form>
        </LibraryModal>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Remove passage?"
        message="Remove this passage from the Typing Library?"
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}