"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, X, Eye, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { api, Fee, Payment, Pagination } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";

type Student = { user: { _id: string; name: string } };

type Tab = "records" | "approvals";

export default function AdminFeesPage() {
  const [tab, setTab] = useState<Tab>("records");
  const [fees, setFees] = useState<Fee[]>([]);
  const [feePagination, setFeePagination] = useState<Pagination>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [pending, setPending] = useState<Payment[]>([]);
  const [approvalPagination, setApprovalPagination] = useState<Pagination>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportTarget, setExportTarget] = useState<"fees" | "approvals">("fees");
  const [loading, setLoading] = useState(false);
  const [reviewPayment, setReviewPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [feePage, setFeePage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  const loadFees = (page = feePage) => {
    const params = new URLSearchParams({ page: String(page), limit: "6" });
    if (statusFilter) params.set("status", statusFilter);
    api.getFees(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setFees(data);
        setFeePagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setFees(data.fees);
        setFeePagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load fees"));
  };

  const loadApprovals = (page = approvalPage) => {
    const params = new URLSearchParams({ page: String(page), limit: "6" });
    api.getPendingPayments(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setPending(data);
        setApprovalPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setPending(data.payments);
        setApprovalPagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load approvals"));
  };

  const load = () => {
    loadFees();
    loadApprovals();
    api.adminStudents().then((data) => setStudents((data.profiles as Student[]) || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadFees(feePage); }, [feePage, statusFilter]);
  useEffect(() => { loadApprovals(approvalPage); }, [approvalPage]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.createFee({
        student: form.get("student"),
        amount: Number(form.get("amount")),
        dueDate: form.get("dueDate"),
        remarks: form.get("remarks"),
      });
      setShowModal(false);
      loadFees(1);
      setFeePage(1);
      toast.success("Fee record created — student can pay via UPI");
    } catch {
      toast.error("Failed to create fee");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    try {
      await api.approvePayment(paymentId);
      toast.success("Payment verified — screenshot removed from storage");
      setReviewPayment(null);
      loadApprovals(approvalPage);
      loadFees(feePage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    }
  };

  const handleReject = async () => {
    if (!reviewPayment) return;
    try {
      await api.rejectPayment(reviewPayment._id, rejectReason || "UTR could not be verified");
      toast.success("Payment rejected — student can resubmit");
      setReviewPayment(null);
      setRejectReason("");
      loadApprovals(approvalPage);
      loadFees(feePage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed");
    }
  };

  const handleManualPay = async (feeId: string, amount: number) => {
    try {
      await api.recordPayment(feeId, { paidAmount: amount, paymentMethod: "cash", receiptNumber: `RCP-${Date.now()}` });
      loadFees(feePage);
      toast.success("Cash payment recorded");
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const runExport = async () => {
    if (!exportFrom || !exportTo) {
      toast.error("Select from and to dates");
      return;
    }
    try {
      if (exportTarget === "fees") {
        await api.exportFees(exportFrom, exportTo);
      } else {
        await api.exportPayments(exportFrom, exportTo);
      }
      setShowExport(false);
      toast.success("Excel file downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  const statusBadge = (status: string) => {
    if (status === "paid" || status === "approved") return "badge-success";
    if (status === "rejected") return "badge-danger";
    return "badge-warning";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Fees Management</h3>
          <p className="text-sm text-muted">Generate fees, verify UPI proofs with screenshot & UTR, export records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setExportTarget("fees"); setShowExport(true); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-default px-4 py-2.5 text-sm font-medium hover:bg-surface"
          >
            <Download className="h-4 w-4" /> Export Fees
          </button>
          <button onClick={() => setShowModal(true)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Generate Fee Record
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-default">
        <button
          onClick={() => setTab("records")}
          className={`px-4 py-2 text-sm font-medium ${tab === "records" ? "border-b-2 border-primary text-primary" : "text-muted"}`}
        >
          Fee Records
        </button>
        <button
          onClick={() => setTab("approvals")}
          className={`relative px-4 py-2 text-sm font-medium ${tab === "approvals" ? "border-b-2 border-primary text-primary" : "text-muted"}`}
        >
          Approvals
          {approvalPagination.total > 0 && (
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">{approvalPagination.total}</span>
          )}
        </button>
      </div>

      {tab === "records" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setFeePage(1); }} className="w-40">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-default">
            <table className="w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f._id} className="border-t border-default">
                    <td className="px-6 py-4">{typeof f.student === "object" ? f.student?.name : "—"}</td>
                    <td className="px-6 py-4">{formatCurrency(f.amount)}</td>
                    <td className="px-6 py-4">{formatCurrency(f.paidAmount)}</td>
                    <td className="px-6 py-4">{new Date(f.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusBadge(f.status)}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {f.status !== "paid" && (
                        <button onClick={() => handleManualPay(f._id, f.amount - f.paidAmount)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
                          Record Cash
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {feePagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button disabled={feePage <= 1} onClick={() => setFeePage((p) => p - 1)} className="text-sm text-accent disabled:opacity-40">Previous</button>
              <span className="text-sm text-muted">{feePage} / {feePagination.pages}</span>
              <button disabled={feePage >= feePagination.pages} onClick={() => setFeePage((p) => p + 1)} className="text-sm text-accent disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {tab === "approvals" && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { setExportTarget("approvals"); setShowExport(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-default px-4 py-2 text-sm font-medium hover:bg-surface"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export Approvals
            </button>
          </div>

          {pending.length === 0 ? (
            <p className="rounded-xl border border-default bg-card p-8 text-center text-muted">No pending payment proofs</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pending.map((p) => (
                <div key={p._id} className="rounded-2xl border border-primary/25 bg-primary-light p-5">
                  <p className="font-semibold">{p.student?.name}</p>
                  <p className="text-lg font-bold">{formatCurrency(p.amount)}</p>
                  <p className="font-mono text-sm">UTR: <span className="font-bold">{p.utr}</span></p>
                  <p className="text-xs text-muted">{new Date(p.createdAt).toLocaleString()}</p>
                  <span className="mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize badge-warning">pending</span>
                  <button
                    onClick={() => { setReviewPayment(p); setRejectReason(""); }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Eye className="h-4 w-4" /> Review & Verify
                  </button>
                </div>
              ))}
            </div>
          )}

          {approvalPagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button disabled={approvalPage <= 1} onClick={() => setApprovalPage((p) => p - 1)} className="text-sm text-accent disabled:opacity-40">Previous</button>
              <span className="text-sm text-muted">{approvalPage} / {approvalPagination.pages}</span>
              <button disabled={approvalPage >= approvalPagination.pages} onClick={() => setApprovalPage((p) => p + 1)} className="text-sm text-accent disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Generate Fee Record">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select name="student" label="Student" required>
            <option value="">Select Student</option>
            {students.map((s) => <option key={s.user._id} value={s.user._id}>{s.user.name}</option>)}
          </Select>
          <Input name="amount" label="Amount (₹)" type="number" required />
          <Input name="dueDate" label="Due Date" type="date" required />
          <Input name="remarks" label="Remarks (optional)" placeholder="e.g. Q2 tuition, exam fee" />
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {loading ? "Creating..." : "Generate Fee"}
          </button>
        </form>
      </Modal>

      <Modal open={showExport} onClose={() => setShowExport(false)} title={exportTarget === "fees" ? "Export Fee Records" : "Export Payment Approvals"}>
        <div className="space-y-4">
          <Input label="From Date" type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} required />
          <Input label="To Date" type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} required />
          <button onClick={runExport} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90">
            Download Excel (CSV)
          </button>
        </div>
      </Modal>

      <Modal open={!!reviewPayment} onClose={() => setReviewPayment(null)} title="Verify Payment" className="max-w-lg">
        {reviewPayment && (
          <div className="space-y-4">
            <div className="rounded-xl bg-surface p-4">
              <p className="font-semibold">{reviewPayment.student?.name}</p>
              <p className="text-sm text-muted">{reviewPayment.student?.email}</p>
              <p className="mt-2 text-xl font-bold">{formatCurrency(reviewPayment.amount)}</p>
              <p className="mt-2 font-mono text-sm">
                12-digit UTR: <span className="text-lg font-bold text-foreground">{reviewPayment.utr}</span>
              </p>
              <p className="text-xs text-muted">Submitted: {new Date(reviewPayment.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Payment Screenshot</p>
              {reviewPayment.screenshotUrl ? (
                <a href={reviewPayment.screenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img src={reviewPayment.screenshotUrl} alt="Payment proof" className="max-h-80 w-full rounded-xl border border-default object-contain bg-surface" />
                </a>
              ) : (
                <p className="rounded-xl border border-dashed border-default p-6 text-center text-sm text-muted">No screenshot uploaded</p>
              )}
            </div>
            <Input label="Rejection reason (if rejecting)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="UTR could not be verified" />
            <div className="flex gap-3">
              <button onClick={() => handleApprove(reviewPayment._id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-success py-3 text-sm font-medium text-white hover:opacity-90">
                <Check className="h-4 w-4" /> Verify & Approve
              </button>
              <button onClick={handleReject} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-danger py-3 text-sm font-medium text-white hover:opacity-90">
                <X className="h-4 w-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}