"use client";

import { useEffect, useState } from "react";
import { api, StudentProfile, User } from "@/lib/api";
import { paginateSlice } from "@/lib/paginate";
import { Pagination } from "@/components/ui/pagination";
import { StudentIdCard } from "@/components/teacher/StudentIdCard";
import { StudentReportModal } from "@/components/teacher/StudentReportModal";

type Student = StudentProfile & { user?: User & { _id?: string } };

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    api.teacherDashboard().then((data) => {
      setStudents((data.students as Student[]) || []);
    }).catch(() => {});
  }, []);

  const paged = paginateSlice(students, page);

  const openReport = (student: Student) => {
    const id = student.user?._id || (student.user as { id?: string })?.id;
    if (!id) return;
    setSelectedId(id);
    setSelectedName(student.user?.name || "Student");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">My Students</h3>
        <p className="text-sm text-muted">Tap a student card to view their full report card</p>
      </div>

      {paged.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-default p-12 text-center text-muted">
          No students assigned yet
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.items.map((s) => (
            <StudentIdCard
              key={s.user?._id || s._id}
              student={s}
              onClick={() => openReport(s)}
            />
          ))}
        </div>
      )}

      <Pagination page={paged.page} pages={paged.pages} onPageChange={setPage} />

      <StudentReportModal
        studentId={selectedId}
        studentName={selectedName}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}