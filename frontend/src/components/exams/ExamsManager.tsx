"use client";

import { useEffect, useState, FormEvent } from "react";
import { Plus, Trash2, Pencil, ClipboardList, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, Exam, ExamQuestion, ExamEvaluationRoster, Pagination as PaginationMeta } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/lib/utils";

const QUESTION_TYPES = ["mcq", "typing", "shorthand"] as const;
const EXAM_TYPES = ["mock", "weekly", "monthly", "final"] as const;

const emptyQuestion = (): ExamQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 1,
});

const emptyForm = () => ({
  title: "",
  type: "weekly" as typeof EXAM_TYPES[number],
  questionType: "mcq" as typeof QUESTION_TYPES[number],
  scheduledAt: "",
  duration: 60,
  isPublished: true,
  isTimed: true,
  batch: "",
  course: "",
  questions: [emptyQuestion()],
});

type Batch = { _id: string; name: string };
type Course = { _id: string; name: string };

export function ExamsManager({ canDelete = true, pageSize = 5, title = "Examination Module", subtitle = "Timed exams, MCQ/typing/shorthand — evaluate student performance" }: {
  canDelete?: boolean;
  pageSize?: number;
  title?: string;
  subtitle?: string;
}) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [evaluateList, setEvaluateList] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [evalExam, setEvalExam] = useState<Exam | null>(null);
  const [roster, setRoster] = useState<ExamEvaluationRoster[]>([]);
  const [evalStats, setEvalStats] = useState({ total: 0, present: 0, absent: 0, inProgress: 0 });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState("intermediate");
  const [aiLoading, setAiLoading] = useState(false);

  const loadExams = (p = page) => {
    const params = new URLSearchParams({ page: String(p), limit: String(pageSize) });
    api.getExams(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setExams(data);
        setPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setExams(data.exams);
        setPagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load exams"));
  };

  useEffect(() => { loadExams(page); }, [page]);
  useEffect(() => {
    api.getBatches().then((d) => setBatches((Array.isArray(d) ? d : d.batches) as Batch[])).catch(() => {});
    api.getCourses().then((d) => setCourses((Array.isArray(d) ? d : d.courses) as Course[])).catch(() => {});
  }, []);

  const generateWithGroq = async () => {
    if (!aiTopic.trim()) {
      toast.error("Enter a topic for AI question generation");
      return;
    }
    setAiLoading(true);
    try {
      const courseName = courses.find((c) => c._id === form.course)?.name;
      const res = await api.generateExamQuestions({
        topic: aiTopic.trim(),
        count: aiCount,
        questionType: form.questionType,
        difficulty: aiDifficulty,
        courseName,
      });
      const generated = res.questions.map((q) => ({
        ...q,
        options: q.options || (form.questionType === "mcq" ? ["", "", "", ""] : undefined),
      }));
      setForm((f) => ({
        ...f,
        questions: f.questions.length === 1 && !f.questions[0].question
          ? generated
          : [...f.questions, ...generated],
      }));
      toast.success(`Generated ${generated.length} questions with Groq AI`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (exam: Exam) => {
    setEditId(exam._id);
    setForm({
      title: exam.title,
      type: exam.type as typeof EXAM_TYPES[number],
      questionType: exam.questionType as typeof QUESTION_TYPES[number],
      scheduledAt: exam.scheduledAt ? new Date(exam.scheduledAt).toISOString().slice(0, 16) : "",
      duration: exam.duration,
      isPublished: exam.isPublished ?? true,
      isTimed: exam.isTimed !== false,
      batch: (exam.batch as { _id?: string })?._id || "",
      course: (exam.course as { _id?: string })?._id || "",
      questions: exam.questions?.length ? exam.questions.map((q) => ({
        ...q,
        options: q.options || ["", "", "", ""],
      })) : [emptyQuestion()],
    });
    setShowModal(true);
  };

  const addQuestion = () => setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
  const removeQuestion = (index: number) => setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== index) }));

  const updateQuestion = (index: number, field: keyof ExamQuestion, value: string | number | string[]) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      type: form.type,
      questionType: form.questionType,
      scheduledAt: form.scheduledAt,
      duration: form.duration,
      isPublished: form.isPublished,
      isTimed: form.isTimed,
      batch: form.batch || undefined,
      course: form.course || undefined,
      totalMarks: form.questions.reduce((s, q) => s + (q.marks || 1), 0),
      questions: form.questions.map((q) =>
        form.questionType === "mcq" ? q : { ...q, options: undefined }
      ),
    };
    try {
      if (editId) {
        await api.updateExam(editId, payload);
        toast.success("Exam updated");
      } else {
        await api.createExam(payload);
        toast.success("Exam created");
      }
      setShowModal(false);
      setForm(emptyForm());
      setEditId(null);
      loadExams(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save exam");
    }
  };

  const openEvaluation = async (exam: Exam) => {
    try {
      const data = await api.getExamEvaluation(exam._id);
      setEvalExam(data.exam);
      setRoster(data.roster);
      setEvalStats(data.stats);
      setShowEvaluate(true);
      setEvaluateList(false);
    } catch {
      toast.error("Failed to load evaluation");
    }
  };

  const rosterBadge = (status: string) => {
    if (status === "present") return "badge-success";
    if (status === "in_progress") return "badge-warning";
    return "badge-danger";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEvaluateList(true)} className="inline-flex items-center gap-2 rounded-xl border border-default px-5 py-2.5 text-sm font-medium hover:bg-surface">
            <ClipboardList className="h-4 w-4" /> Evaluate
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Create Exam
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {exams.length === 0 ? (
          <p className="text-muted">No exams created yet</p>
        ) : exams.map((exam) => (
          <div key={exam._id} className="rounded-2xl border border-default bg-card p-6">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold">{exam.title}</h4>
              <div className="flex gap-1">
                <button onClick={() => openEvaluation(exam)} className="rounded-lg p-2 text-accent hover:bg-primary-light" title="Evaluate">
                  <ClipboardList className="h-4 w-4" />
                </button>
                <button onClick={() => openEdit(exam)} className="rounded-lg p-2 hover:bg-surface" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                {canDelete && (
                  <button onClick={() => setDeleteId(exam._id)} className="rounded-lg p-2 text-danger hover:bg-danger-light" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge-primary rounded-full px-3 py-1 text-xs capitalize">{exam.type}</span>
              <span className="badge-info rounded-full px-3 py-1 text-xs capitalize">{exam.questionType}</span>
              {exam.isPublished && <span className="badge-success rounded-full px-3 py-1 text-xs">Published</span>}
              {exam.isTimed !== false && <span className="badge-warning rounded-full px-3 py-1 text-xs">Timed</span>}
            </div>
            <p className="mt-3 text-sm text-muted">
              {formatDateTime(exam.scheduledAt)} · {exam.duration} min · {exam.questions?.length || 0} questions · {exam.totalMarks} marks
            </p>
            {exam.batch && <p className="mt-1 text-xs text-muted">Batch: {(exam.batch as { name?: string }).name}</p>}
          </div>
        ))}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Exam" : "Create Exam"} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Exam title" className="input-field w-full rounded-xl border px-4 py-3 outline-none" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
              <option value="">All courses</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Select value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}>
              <option value="">All batches</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} className="input-field rounded-xl border px-4 py-3">
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value as typeof form.questionType })} className="input-field rounded-xl border px-4 py-3">
              {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input-field rounded-xl border px-4 py-3" required />
            <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} placeholder="Duration (min)" className="input-field rounded-xl border px-4 py-3" min={5} />
            <label className="flex items-center gap-2 rounded-xl border border-default px-4 py-3">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              <span className="text-sm">Publish</span>
            </label>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-default px-4 py-3">
            <input type="checkbox" checked={form.isTimed} onChange={(e) => setForm({ ...form, isTimed: e.target.checked })} />
            <span className="text-sm">Timed exam — opens at scheduled time, auto-closes after duration</span>
          </label>
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary-light p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Sparkles className="h-4 w-4" /> Generate with Groq AI
            </div>
            <input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Topic e.g. Pitman shorthand abbreviations, 80 WPM typing passage"
              className="input-field w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <select value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} className="input-field rounded-lg border px-3 py-2 text-sm">
                {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} questions</option>)}
              </select>
              <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} className="input-field rounded-lg border px-3 py-2 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                type="button"
                onClick={generateWithGroq}
                disabled={aiLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {aiLoading ? "Generating..." : "Generate Questions"}
              </button>
            </div>
            <p className="text-xs text-muted">Uses {form.questionType} format — review and edit before saving.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Questions ({form.questions.length})</h4>
              <button type="button" onClick={addQuestion} className="text-sm text-accent hover:underline">+ Add manually</button>
            </div>
            {form.questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-default p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Q{qi + 1}</span>
                  {form.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qi)} className="text-danger"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
                <textarea value={q.question} onChange={(e) => updateQuestion(qi, "question", e.target.value)} placeholder="Question or passage" className="input-field mt-2 w-full rounded-lg border p-3" required />
                {form.questionType === "mcq" ? (
                  <div className="mt-2 space-y-2">
                    {q.options?.map((opt, oi) => (
                      <input key={oi} value={opt} onChange={(e) => { const opts = [...(q.options || [])]; opts[oi] = e.target.value; updateQuestion(qi, "options", opts); }} placeholder={`Option ${oi + 1}`} className="input-field w-full rounded-lg border px-3 py-2" />
                    ))}
                    <input value={q.correctAnswer} onChange={(e) => updateQuestion(qi, "correctAnswer", e.target.value)} placeholder="Correct answer" className="input-field w-full rounded-lg border px-3 py-2" required />
                  </div>
                ) : (
                  <input value={q.correctAnswer} onChange={(e) => updateQuestion(qi, "correctAnswer", e.target.value)} placeholder="Expected typed text" className="input-field mt-2 w-full rounded-lg border px-3 py-2" required />
                )}
                <input type="number" value={q.marks} onChange={(e) => updateQuestion(qi, "marks", Number(e.target.value))} placeholder="Marks" className="input-field mt-2 w-24 rounded-lg border px-3 py-2" min={1} />
              </div>
            ))}
          </div>
          <button type="submit" className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90">
            {editId ? "Save Changes" : "Create Exam"}
          </button>
        </form>
      </Modal>

      <Modal open={evaluateList} onClose={() => setEvaluateList(false)} title="Evaluate Exams" className="max-w-lg">
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {exams.map((exam) => (
            <button
              key={exam._id}
              onClick={() => openEvaluation(exam)}
              className="flex w-full items-center justify-between rounded-xl border border-default p-4 text-left hover:bg-surface"
            >
              <div>
                <p className="font-medium">{exam.title}</p>
                <p className="text-xs text-muted">{formatDateTime(exam.scheduledAt)} · {(exam.batch as { name?: string })?.name || "All batches"}</p>
              </div>
              <ClipboardList className="h-4 w-4 text-accent" />
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={showEvaluate} onClose={() => setShowEvaluate(false)} title={evalExam ? `Evaluate: ${evalExam.title}` : "Evaluation"} className="max-w-2xl">
        {evalExam && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div className="rounded-xl bg-surface p-3"><p className="text-muted">Total</p><p className="font-bold">{evalStats.total}</p></div>
              <div className="rounded-xl bg-surface p-3"><p className="text-muted">Present</p><p className="font-bold text-success">{evalStats.present}</p></div>
              <div className="rounded-xl bg-surface p-3"><p className="text-muted">Absent</p><p className="font-bold text-danger">{evalStats.absent}</p></div>
              <div className="rounded-xl bg-surface p-3"><p className="text-muted">In Progress</p><p className="font-bold">{evalStats.inProgress}</p></div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-default">
              <table className="w-full text-left text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">WPM</th>
                    <th className="px-4 py-3">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <tr key={r.student._id} className="border-t border-default">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.student.name}</p>
                        <p className="text-xs text-muted">{r.student.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${rosterBadge(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">{r.score != null ? `${r.score}/${evalExam.totalMarks}` : "—"}</td>
                      <td className="px-4 py-3">{r.wpm ?? "—"}</td>
                      <td className="px-4 py-3">{r.rank ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {canDelete && (
        <ConfirmDialog
          open={!!deleteId}
          title="Delete exam?"
          message="This will permanently delete the exam and all student attempts."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            if (!deleteId) return;
            try {
              await api.deleteExam(deleteId);
              loadExams(page);
              toast.success("Exam deleted");
            } catch {
              toast.error("Failed to delete exam");
            }
          }}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}