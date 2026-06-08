"use client";

import { ExamsManager } from "@/components/exams/ExamsManager";

export default function AdminExamsPage() {
  return <ExamsManager pageSize={6} canDelete />;
}