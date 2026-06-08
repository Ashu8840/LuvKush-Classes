"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2, Award } from "lucide-react";
import { toast } from "sonner";
import { api, CertificationProgram, CertificationQuestion } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const emptyQuestion = (): CertificationQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
});

export default function AdminCertificationsPage() {
  const [programs, setPrograms] = useState<CertificationProgram[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CertificationProgram | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    pdfUrl: "",
    youtubeUrl: "",
    questionsPerExam: 10,
    passingPercent: 65,
    isActive: true,
    questions: [emptyQuestion()] as CertificationQuestion[],
  });

  const load = () => {
    api.getCertificationPrograms().then(setPrograms).catch(() => toast.error("Failed to load"));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      pdfUrl: "",
      youtubeUrl: "",
      questionsPerExam: 10,
      passingPercent: 65,
      isActive: true,
      questions: [emptyQuestion()],
    });
    setShowModal(true);
  };

  const openEdit = (p: CertificationProgram) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description || "",
      pdfUrl: p.pdfUrl || "",
      youtubeUrl: p.youtubeUrl || "",
      questionsPerExam: p.questionsPerExam,
      passingPercent: p.passingPercent,
      isActive: p.isActive,
      questions: p.questions?.length ? p.questions.map((q) => ({
        ...q,
        options: [...q.options, "", "", ""].slice(0, 4),
      })) : [emptyQuestion()],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const questions = form.questions
      .filter((q) => q.question.trim() && (q.correctAnswer || "").trim())
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.filter((o) => o.trim()),
        correctAnswer: (q.correctAnswer || "").trim(),
      }));

    if (!form.title.trim()) return toast.error("Title is required");
    if (!questions.length) return toast.error("Add at least one question");
    if (form.questionsPerExam > questions.length) {
      return toast.error(`Questions per exam cannot exceed ${questions.length}`);
    }

    setSaving(true);
    try {
      const payload = { ...form, questions };
      if (editing) {
        await api.updateCertificationProgram(editing._id, payload);
        toast.success("Program updated");
      } else {
        await api.createCertificationProgram(payload);
        toast.success("Certification program created");
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await api.deleteCertificationProgram(deleteId);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const updateQuestion = (idx: number, patch: Partial<CertificationQuestion>) => {
    setForm((f) => {
      const questions = [...f.questions];
      questions[idx] = { ...questions[idx], ...patch };
      return { ...f, questions };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Certification Programs</h3>
          <p className="text-sm text-muted">Create courses with PDF, YouTube & assessment — students need 65%+ to earn certificate</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> New Program
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((p) => (
          <div key={p._id} className="rounded-2xl border border-default bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Award className="mt-1 h-5 w-5 text-amber-500" />
                <div>
                  <h4 className="font-semibold">{p.title}</h4>
                  <p className="text-xs text-muted">{p.questions?.length || 0} questions · {p.questionsPerExam} per exam · Pass {p.passingPercent}%</p>
                  {p.pdfUrl && <p className="mt-1 text-xs text-accent">PDF linked</p>}
                  {p.youtubeUrl && <p className="text-xs text-accent">YouTube linked</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-sm text-accent hover:underline">Edit</button>
                <button onClick={() => setDeleteId(p._id)} className="text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs ${p.isActive ? "bg-success-light text-success" : "bg-surface text-muted"}`}>
              {p.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Program" : "New Certification Program"} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
          <Input label="Program Title" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-default px-4 py-2 text-sm" />
          </div>
          <Input label="PDF URL" name="pdf" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} placeholder="https://..." />
          <Input label="YouTube Video URL" name="yt" value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Questions per exam" name="qpe" type="number" min={1} value={String(form.questionsPerExam)} onChange={(e) => setForm({ ...form, questionsPerExam: parseInt(e.target.value) || 1 })} />
            <Input label="Passing %" name="pass" type="number" min={1} max={100} value={String(form.passingPercent)} onChange={(e) => setForm({ ...form, passingPercent: parseInt(e.target.value) || 65 })} />
          </div>

          <div className="space-y-4 border-t border-default pt-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Question Bank</p>
              <button type="button" onClick={() => setForm({ ...form, questions: [...form.questions, emptyQuestion()] })} className="text-sm text-accent">+ Add Question</button>
            </div>
            {form.questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-default bg-surface p-4 space-y-2">
                <Input label={`Question ${qi + 1}`} value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} />
                {q.options.map((opt, oi) => (
                  <Input key={oi} label={`Option ${oi + 1}`} value={opt} onChange={(e) => {
                    const options = [...q.options];
                    options[oi] = e.target.value;
                    updateQuestion(qi, { options });
                  }} />
                ))}
                <Input label="Correct answer (must match an option)" value={q.correctAnswer} onChange={(e) => updateQuestion(qi, { correctAnswer: e.target.value })} />
                {form.questions.length > 1 && (
                  <button type="button" onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== qi) })} className="text-xs text-danger">Remove question</button>
                )}
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active (visible to students)
          </label>

          <button type="submit" disabled={saving} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground disabled:opacity-60">
            {saving ? "Saving..." : editing ? "Update Program" : "Create Program"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete program?" message="Students will no longer access this certification." confirmLabel="Delete" variant="danger" onConfirm={remove} onClose={() => setDeleteId(null)} />
    </div>
  );
}