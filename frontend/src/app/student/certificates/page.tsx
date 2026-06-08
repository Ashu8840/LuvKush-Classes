"use client";

import { useEffect, useState } from "react";
import {
  Award, BookOpen, Play, FileText, Download, CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  api, CertificationProgram, Certificate, CertificationExam, CertificationResult,
} from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";

function youtubeEmbed(url?: string) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([^&\s?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function CertificatesPage() {
  const [tab, setTab] = useState<"earn" | "mine">("earn");
  const [programs, setPrograms] = useState<CertificationProgram[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selected, setSelected] = useState<CertificationProgram | null>(null);
  const [exam, setExam] = useState<CertificationExam | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<CertificationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewCert, setViewCert] = useState<Certificate | null>(null);
  const [verifyId, setVerifyId] = useState("");
  const [verified, setVerified] = useState<Certificate | null>(null);

  const load = () => {
    api.getCertificationPrograms().then(setPrograms).catch(() => {});
    api.getCertificates().then(setCertificates).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openProgram = async (p: CertificationProgram) => {
    try {
      const full = await api.getCertificationProgram(p._id);
      setSelected(full);
      setExam(null);
      setResult(null);
      setAnswers({});
    } catch {
      toast.error("Failed to load program");
    }
  };

  const startExam = async () => {
    if (!selected) return;
    try {
      const data = await api.startCertificationExam(selected._id);
      setExam(data);
      setResult(null);
      setAnswers({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cannot start assessment");
    }
  };

  const submitExam = async () => {
    if (!selected || !exam) return;
    const unanswered = exam.questions.filter((q) => !answers[q.questionIndex]?.trim());
    if (unanswered.length) {
      return toast.error("Please answer all questions");
    }
    setSubmitting(true);
    try {
      const res = await api.submitCertificationExam(
        selected._id,
        exam.attemptId,
        exam.questions.map((q) => ({ questionIndex: q.questionIndex, answer: answers[q.questionIndex] }))
      );
      setResult(res);
      setExam(null);
      if (res.passed) {
        toast.success("Congratulations! Certificate earned!");
        load();
      } else {
        toast.error(`Score ${res.percentage}% — need ${res.passingPercent}% to pass`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCert = (cert: Certificate) => {
    window.open(api.getCertificateRenderUrl(cert.certificateId), "_blank");
  };

  const printCert = () => {
    window.print();
  };

  const handleVerify = async () => {
    if (!verifyId.trim()) return;
    try {
      setVerified(await api.verifyCertificate(verifyId.trim()));
    } catch {
      setVerified(null);
      toast.error("Certificate not found");
    }
  };

  const embed = youtubeEmbed(selected?.youtubeUrl);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Certificates</h3>
        <p className="text-sm text-muted">Complete study materials, pass the assessment (65%+), and earn your certificate</p>
      </div>

      <div className="flex gap-2">
        {(["earn", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium capitalize ${tab === t ? "bg-primary text-primary-foreground" : "border border-default"}`}
          >
            {t === "earn" ? "Earn Certificate" : `My Certificates (${certificates.length})`}
          </button>
        ))}
      </div>

      {tab === "earn" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.length === 0 ? (
            <p className="text-muted col-span-full rounded-2xl border border-dashed p-12 text-center">No certification programs available yet</p>
          ) : programs.map((p) => {
            const earned = certificates.some((c) => c.program?._id === p._id || c.program?.title === p.title);
            return (
              <button
                key={p._id}
                onClick={() => openProgram(p)}
                className="group rounded-2xl border border-default bg-card p-5 text-left transition hover:border-accent/50 hover:shadow-lg"
              >
                <Award className="h-8 w-8 text-amber-500" />
                <h4 className="mt-3 font-semibold group-hover:text-accent">{p.title}</h4>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{p.description || "Certification program"}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  {p.pdfUrl && <span className="rounded-full bg-surface px-2 py-0.5">PDF</span>}
                  {p.youtubeUrl && <span className="rounded-full bg-surface px-2 py-0.5">Video</span>}
                  <span className="rounded-full bg-surface px-2 py-0.5">Pass {p.passingPercent}%</span>
                </div>
                {earned && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Earned
                  </span>
                )}
                <ChevronRight className="mt-2 h-4 w-4 text-accent opacity-0 transition group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <p className="text-muted rounded-2xl border border-dashed p-12 text-center">No certificates yet — complete a program to earn one!</p>
          ) : certificates.map((cert) => (
            <div key={cert._id} className="rounded-2xl border-2 border-amber-300/50 bg-gradient-to-br from-amber-50/50 to-card p-6 dark:from-amber-950/20">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium uppercase text-amber-700">{cert.type} Certificate</span>
                  </div>
                  <h4 className="mt-2 text-xl font-bold">{cert.program?.title || cert.title || cert.course?.name}</h4>
                  <p className="text-sm text-muted">Issued {new Date(cert.issuedAt).toLocaleDateString("en-IN")} · Score {cert.percentage ?? cert.score}%</p>
                  <p className="mt-2 font-mono text-xs text-muted">{cert.certificateId}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewCert(cert)} className="rounded-xl border border-default px-4 py-2 text-sm font-medium hover:bg-surface">View</button>
                  <button onClick={() => downloadCert(cert)} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    <Download className="h-4 w-4" /> Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Program study + exam modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setExam(null); setResult(null); }} title={selected?.title || "Program"} className="max-w-3xl">
        {selected && !exam && !result && (
          <div className="max-h-[75vh] space-y-6 overflow-y-auto">
            {selected.description && <p className="text-sm text-muted">{selected.description}</p>}

            {selected.hasCertificate && (
              <div className="rounded-xl bg-success-light p-4 text-success">
                <CheckCircle2 className="mb-1 inline h-5 w-5" /> You already earned this certificate!
              </div>
            )}

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4" /> Study Materials</h4>

              {embed && (
                <div className="aspect-video overflow-hidden rounded-xl border border-default">
                  <iframe src={embed} title="Course video" className="h-full w-full" allowFullScreen />
                </div>
              )}

              {selected.pdfUrl && (
                <div className="rounded-xl border border-default bg-surface p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-rose-500" /> Course PDF
                  </div>
                  <a href={selected.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
                    Open PDF in new tab
                  </a>
                  {selected.pdfUrl.includes(".pdf") && (
                    <div className="mt-4 max-h-64 overflow-auto">
                      <iframe src={selected.pdfUrl} title="PDF" className="h-64 w-full rounded-lg" />
                    </div>
                  )}
                </div>
              )}

              {!selected.pdfUrl && !embed && (
                <p className="text-sm text-muted">No study materials attached — proceed to assessment when ready.</p>
              )}
            </div>

            {!selected.hasCertificate && (
              <div className="rounded-xl border border-default bg-surface p-4">
                <p className="text-sm text-muted">
                  Assessment: <strong>{selected.questionsPerExam}</strong> questions · Pass mark: <strong>{selected.passingPercent}%</strong>
                </p>
                {selected.latestAttempt && !selected.latestAttempt.passed && (
                  <p className="mt-2 text-sm text-warning">Last attempt: {selected.latestAttempt.percentage}% — try again!</p>
                )}
                <button onClick={startExam} className="mt-4 w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90">
                  Start Assessment
                </button>
              </div>
            )}
          </div>
        )}

        {exam && (
          <div className="max-h-[75vh] space-y-4 overflow-y-auto">
            <p className="text-sm text-muted">{exam.totalQuestions} questions · Need {exam.passingPercent}% to pass</p>
            {exam.questions.map((q, i) => (
              <div key={q.questionIndex} className="rounded-xl border border-default p-4">
                <p className="font-medium">{i + 1}. {q.question}</p>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition ${answers[q.questionIndex] === opt ? "border-accent bg-primary-light" : "border-default hover:bg-surface"}`}>
                      <input
                        type="radio"
                        name={`q-${q.questionIndex}`}
                        checked={answers[q.questionIndex] === opt}
                        onChange={() => setAnswers((a) => ({ ...a, [q.questionIndex]: opt }))}
                        className="accent-primary"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={submitExam} disabled={submitting} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-6 text-center">
            {result.passed ? (
              <>
                <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
                <h4 className="text-2xl font-bold text-success">Congratulations!</h4>
                <p className="text-muted">You scored {result.percentage}% and earned your certificate</p>
                {result.certificate && (
                  <div className="flex justify-center gap-3">
                    <button onClick={() => setViewCert(result.certificate)} className="rounded-xl border border-default px-5 py-2.5 text-sm font-medium">View Certificate</button>
                    <button onClick={() => result.certificate && downloadCert(result.certificate)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                      <Download className="h-4 w-4" /> Download
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <XCircle className="mx-auto h-16 w-16 text-danger" />
                <h4 className="text-xl font-bold">Not quite there</h4>
                <p className="text-muted">Score: {result.percentage}% — You need {result.passingPercent}% to pass</p>
                <button onClick={startExam} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">Try Again</button>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Certificate view modal */}
      <Modal open={!!viewCert} onClose={() => setViewCert(null)} title="Your Certificate" className="max-w-4xl">
        {viewCert && (
          <div className="space-y-4">
            <CertificateTemplate cert={viewCert} />
            <div className="flex justify-center gap-3 print:hidden">
              <button onClick={printCert} className="rounded-xl border border-default px-5 py-2.5 text-sm font-medium">Print / Save as PDF</button>
              <button onClick={() => downloadCert(viewCert)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                <Download className="h-4 w-4" /> Download HTML
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="rounded-2xl border border-default bg-card p-6">
        <h4 className="font-semibold">Verify Certificate</h4>
        <p className="mt-1 text-sm text-muted">Enter certificate ID to verify authenticity</p>
        <div className="mt-4 flex gap-3">
          <input value={verifyId} onChange={(e) => setVerifyId(e.target.value)} placeholder="LKC-..." className="input-field flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <button onClick={handleVerify} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Verify</button>
        </div>
        {verified && (
          <div className="mt-4 rounded-xl bg-success-light p-4">
            <p className="font-medium text-success">Valid Certificate</p>
            <p className="text-sm">{verified.student?.name} — {verified.program?.title || verified.title}</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-print, #certificate-print * { visibility: visible; }
          #certificate-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}