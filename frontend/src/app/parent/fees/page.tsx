"use client";

import { useEffect, useState } from "react";
import { api, Fee, ParentChild } from "@/lib/api";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ParentFeesPage() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [fees, setFees] = useState<Fee[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getParentChildren().then((data) => {
      setChildren(data);
      if (data.length) setSelectedId(data[0].student._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api.getChildFees(selectedId)
      .then(({ fees: f, summary: s }) => {
        setFees(f);
        setSummary(s);
      })
      .catch(() => { setFees([]); setSummary({}); })
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="rounded-2xl border border-default bg-card p-6">
            <p className="text-sm text-muted">Overall Status</p>
            <p className="text-2xl font-bold capitalize">{(summary.feesStatus as string) || "—"}</p>
            {summary.totalFees ? (
              <p className="mt-2 text-sm">
                Paid: {formatCurrency((summary.paidFees as number) || 0)} / {formatCurrency(summary.totalFees as number)}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            {fees.length ? fees.map((f) => (
              <div key={f._id} className="flex items-center justify-between rounded-2xl border border-default bg-card p-6">
                <div>
                  <p className="font-medium">{formatCurrency(f.amount)}</p>
                  <p className="text-sm text-muted">
                    Paid: {formatCurrency(f.paidAmount)} · Due: {formatDate(f.dueDate)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  f.status === "paid" ? "badge-success" : "badge-warning"
                }`}>
                  {f.status}
                </span>
              </div>
            )) : <p className="text-muted">No fee records</p>}
          </div>
        </>
      )}
    </div>
  );
}