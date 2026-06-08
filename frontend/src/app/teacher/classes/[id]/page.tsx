"use client";

import { use } from "react";
import Link from "next/link";
import { LiveClassRoom } from "@/components/live/LiveClassRoom";

export default function TeacherClassRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-4">
      <Link href="/teacher/classes" className="text-sm text-accent hover:underline">← Back to classes</Link>
      <LiveClassRoom classId={id} isTeacher onEnd={() => { window.location.href = "/teacher/classes"; }} />
    </div>
  );
}