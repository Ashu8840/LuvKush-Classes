"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Radio } from "lucide-react";
import { api, LiveClassSession } from "@/lib/api";
import { paginateSlice } from "@/lib/paginate";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/utils";

export default function StudentLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClassSession[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.getLiveClasses().then(setClasses).catch(() => {});
  }, []);

  const live = classes.filter((c) => c.status === "live");
  const upcoming = classes.filter((c) => c.status === "scheduled");
  const upcomingPage = paginateSlice(upcoming, page);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Live Classes</h3>
        <p className="text-sm text-muted">Join your teacher&apos;s live sessions — video, chat, and hand raise</p>
      </div>

      {live.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-success">Happening Now</h4>
          {live.map((c) => (
            <Link key={c._id} href={`/student/live-classes/${c._id}`} className="block rounded-2xl border-2 border-success bg-success-light p-5 transition hover:opacity-90">
              <div className="flex items-center gap-3">
                <Radio className="h-5 w-5 text-danger animate-pulse" />
                <div>
                  <p className="font-bold">{c.title}</p>
                  <p className="text-sm text-muted">{c.teacher.name} · {c.batch?.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {upcomingPage.items.map((c) => (
          <Link key={c._id} href={`/student/live-classes/${c._id}`} className="rounded-2xl border border-default bg-card p-5 transition hover:bg-surface">
            <Video className="h-5 w-5 text-muted" />
            <h4 className="mt-2 font-semibold">{c.title}</h4>
            <p className="text-sm text-muted">{c.teacher.name}</p>
            <p className="text-xs text-muted">{formatDateTime(c.scheduledAt)} · {c.duration} min</p>
          </Link>
        ))}
      </div>

      {upcoming.length > 0 && <Pagination page={upcomingPage.page} pages={upcomingPage.pages} onPageChange={setPage} />}

      {classes.length === 0 && (
        <p className="text-center text-muted py-12">No live classes scheduled for your batch yet</p>
      )}
    </div>
  );
}