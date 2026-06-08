"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ThemeSelector } from "./ThemeSelector";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";


const PAGE_TITLES: Record<string, string> = {
  "/admin": "Admin Dashboard",
  "/admin/students": "Student Management",
  "/admin/teachers": "Teacher Management",
  "/admin/courses": "Course Management",
  "/admin/batches": "Batch Management",
  "/admin/attendance": "Attendance Reports",
  "/admin/fees": "Fees Management",
  "/admin/exams": "Examinations",
  "/admin/typing-library": "Typing Library",
  "/admin/announcements": "Announcements",
  "/admin/student-feedback": "Feedback & Contact",
  "/admin/reports": "Reports",
  "/admin/database": "Records Database",
  "/teacher": "Teacher Dashboard",
  "/teacher/students": "My Students",
  "/teacher/attendance": "Attendance",
  "/teacher/classes": "Live Classes",
  "/teacher/exams": "Exams",
  "/teacher/shorthand": "Shorthand Dictations",
  "/teacher/typing-library": "Typing Library",
  "/teacher/announcements": "Announcements",
  "/teacher/materials": "Study Materials",
  "/teacher/profile": "My Profile",
  "/student": "Student Dashboard",
  "/student/courses": "My Courses",
  "/student/announcements": "Announcements",
  "/student/typing": "Typing Practice",
  "/student/shorthand": "Shorthand Practice",
  "/student/live-classes": "Live Classes",
  "/student/exams": "Exam Portal",
  "/student/analytics": "Performance Analytics",
  "/student/leaderboard": "Leaderboard",
  "/student/fees": "Fee Payment",
  "/student/library": "Digital Library",
  "/student/certificates": "Certificates",
  "/student/ai-coach": "AI Coach",
  "/student/feedback": "Feedback",
  "/student/profile": "My Profile",
  "/parent": "Parent Dashboard",
  "/parent/attendance": "Child Attendance",
  "/parent/fees": "Fee Status",
  "/parent/progress": "Academic Progress",
  "/parent/certificates": "Certificates",
};

export function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole;
}) {
  const { user, loading, getDashboardPath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const title =
    PAGE_TITLES[pathname] ||
    (pathname.includes("/student/exams/") && pathname.includes("/results")
      ? "Exam Results"
      : pathname.includes("/student/exams/")
        ? "Take Exam"
        : "Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== role) {
      router.push(getDashboardPath(user.role));
    }
  }, [user, loading, role, router, getDashboardPath]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-surface">
        <BrandLogo size="lg" framed priority />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== role) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar role={role} onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:ml-64">
        <header className="z-30 flex shrink-0 items-center justify-between border-b border-default bg-card px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-xl border border-default p-2 text-foreground transition hover:bg-primary-light lg:hidden"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeSelector />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 text-foreground sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}