"use client";

import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { api, ParentChild } from "@/lib/api";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

type Certificate = {
  _id: string;
  title: string;
  certificateId: string;
  issuedAt: string;
  course?: { name: string; category?: string };
};

export default function ParentCertificatesPage() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
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
    api.getChildCertificates(selectedId)
      .then((data) => setCertificates(data as Certificate[]))
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <ChildSelector children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.length ? certificates.map((c) => (
            <div key={c._id} className="rounded-2xl border border-default bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary-light p-3 text-primary">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">{c.title}</h4>
                  <p className="text-sm text-muted">{c.course?.name}</p>
                  <p className="mt-2 text-xs text-muted">ID: {c.certificateId}</p>
                  <p className="text-xs text-muted">Issued: {formatDate(c.issuedAt)}</p>
                </div>
              </div>
            </div>
          )) : <p className="text-muted">No certificates issued yet</p>}
        </div>
      )}
    </div>
  );
}