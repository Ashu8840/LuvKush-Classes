"use client";

import { use } from "react";
import Link from "next/link";
import { LiveClassRoom } from "@/components/live/LiveClassRoom";

export default function StudentClassRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-4">
      <Link href="/student/live-classes" className="text-sm text-accent hover:underline">← Back to live classes</Link>
      <LiveClassRoom classId={id} isTeacher={false} />
    </div>
  );
}