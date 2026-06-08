"use client";

import { useEffect, useState } from "react";
import { IndianRupee, History, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { api, Fee, Payment } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { UpiPaymentModal } from "@/components/payments/UpiPaymentModal";

export default function StudentFeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payFee, setPayFee] = useState<Fee | null>(null);

  const loadData = async () => {
    try {
      const [f, p] = await Promise.all([api.getFees(), api.getPaymentHistory()]);
      setFees(Array.isArray(f) ? f : f.fees);
      setPayments(p);
      if (p.some((pay) => pay.status === "approved")) {
        // no auto confetti on load
      }
    } catch {
      toast.error("Failed to load fee data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSuccess = () => {
    loadData();
  };

  const statusBadge = (status: string) => {
    if (status === "approved" || status === "paid") return "badge-success";
    if (status === "pending") return "badge-warning";
    if (status === "rejected") return "badge-danger";
    return "badge-warning";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-default bg-primary-light p-6">
        <div className="flex items-center gap-3">
          <IndianRupee className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Fee Payment via UPI</h3>
            <p className="text-sm text-muted">Pay with GPay, PhonePe, or Paytm — then submit your 12-digit UTR</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Pending Fees</h4>
        {fees.filter((f) => f.status !== "paid").length ? fees.filter((f) => f.status !== "paid").map((f) => {
          const hasPendingProof = payments.some((p) => p.fee?._id === f._id && p.status === "pending");
          return (
            <div key={f._id} className="flex flex-col gap-4 rounded-2xl border border-default bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xl font-bold">{formatCurrency(f.amount)}</p>
                <p className="text-sm text-muted">
                  Paid: {formatCurrency(f.paidAmount)} · Remaining: {formatCurrency(f.amount - f.paidAmount)}
                </p>
                <p className="text-sm text-muted">Due: {formatDate(f.dueDate)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusBadge(f.status)}`}>
                  {f.status}
                </span>
                {hasPendingProof ? (
                  <span className="badge-warning rounded-xl px-4 py-2 text-xs font-medium">
                    Verification pending
                  </span>
                ) : (
                  <button
                    onClick={() => setPayFee(f)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Smartphone className="h-4 w-4" />
                    Pay via UPI
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <p className="rounded-xl border border-default bg-card p-6 text-center text-muted">
            All fees paid! Great job staying on track.
          </p>
        )}
      </div>

      {fees.filter((f) => f.status === "paid").length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold">Paid Fees</h4>
          {fees.filter((f) => f.status === "paid").map((f) => (
            <div key={f._id} className="flex items-center justify-between rounded-2xl border border-default bg-card p-6">
              <div>
                <p className="font-medium">{formatCurrency(f.amount)}</p>
                <p className="text-sm text-muted">Due: {formatDate(f.dueDate)}</p>
              </div>
              <span className="badge-success rounded-full px-3 py-1 text-xs font-medium">paid</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h4 className="flex items-center gap-2 font-semibold">
          <History className="h-5 w-5" /> Payment History
        </h4>
        {payments.length ? (
          <div className="overflow-x-auto rounded-2xl border border-default">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default bg-surface">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">UTR</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-default last:border-0">
                    <td className="px-4 py-3">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.utr}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadge(p.status)}`}>
                        {p.status}
                      </span>
                      {p.status === "rejected" && p.rejectionReason && (
                        <p className="mt-1 text-xs text-danger">{p.rejectionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">No payment history yet</p>
        )}
      </div>

      {payFee && (
        <UpiPaymentModal
          fee={payFee}
          open={!!payFee}
          onClose={() => setPayFee(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}