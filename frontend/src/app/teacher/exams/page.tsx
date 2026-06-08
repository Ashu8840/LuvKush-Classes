"use client";

import { ExamsManager } from "@/components/exams/ExamsManager";

export default function TeacherExamsPage() {
  return (
    <ExamsManager
      canDelete={false}
      title="Examinations"
      subtitle="Create and manage exams for your batches — same tools as admin (Groq AI, evaluate, timed exams)"
    />
  );
}