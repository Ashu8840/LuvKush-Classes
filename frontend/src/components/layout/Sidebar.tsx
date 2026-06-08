"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  IndianRupee, FileText, BarChart3, Video, Keyboard, Mic, Bot, Award, LogOut, Database,
  Trophy, TrendingUp, ChevronRight, Megaphone, MessageSquareHeart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import { UserRole } from "@/lib/api";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/admin/students", label: "Students", icon: <Users className="h-5 w-5" /> },
  { href: "/admin/teachers", label: "Teachers", icon: <GraduationCap className="h-5 w-5" /> },
  { href: "/admin/courses", label: "Courses", icon: <BookOpen className="h-5 w-5" /> },
  { href: "/admin/batches", label: "Batches", icon: <Calendar className="h-5 w-5" /> },
  { href: "/admin/attendance", label: "Attendance Reports", icon: <Calendar className="h-5 w-5" /> },
  { href: "/admin/fees", label: "Fees", icon: <IndianRupee className="h-5 w-5" /> },
  { href: "/admin/exams", label: "Exams", icon: <FileText className="h-5 w-5" /> },
  { href: "/admin/certifications", label: "Certifications", icon: <Award className="h-5 w-5" /> },
  { href: "/admin/typing-library", label: "Typing Library", icon: <Keyboard className="h-5 w-5" /> },
  { href: "/admin/announcements", label: "Announcements", icon: <Megaphone className="h-5 w-5" /> },
  { href: "/admin/student-feedback", label: "Feedback & Contact", icon: <MessageSquareHeart className="h-5 w-5" /> },
  { href: "/admin/reports", label: "Reports", icon: <BarChart3 className="h-5 w-5" /> },
  { href: "/admin/database", label: "Database", icon: <Database className="h-5 w-5" /> },
];

const teacherNav: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/teacher/students", label: "Students", icon: <Users className="h-5 w-5" /> },
  { href: "/teacher/attendance", label: "Attendance", icon: <Calendar className="h-5 w-5" /> },
  { href: "/teacher/classes", label: "Live Classes", icon: <Video className="h-5 w-5" /> },
  { href: "/teacher/exams", label: "Exams", icon: <FileText className="h-5 w-5" /> },
  { href: "/teacher/shorthand", label: "Shorthand", icon: <Mic className="h-5 w-5" /> },
  { href: "/teacher/typing-library", label: "Typing Library", icon: <Keyboard className="h-5 w-5" /> },
  { href: "/teacher/announcements", label: "Announcements", icon: <Megaphone className="h-5 w-5" /> },
  { href: "/teacher/materials", label: "Library (Public)", icon: <BookOpen className="h-5 w-5" /> },
  { href: "/teacher/learning-modules", label: "Learning Modules", icon: <GraduationCap className="h-5 w-5" /> },
];

const studentNav: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/student/courses", label: "Learning Modules", icon: <BookOpen className="h-5 w-5" /> },
  { href: "/student/announcements", label: "Announcements", icon: <Megaphone className="h-5 w-5" /> },
  { href: "/student/typing", label: "Typing Practice", icon: <Keyboard className="h-5 w-5" /> },
  { href: "/student/shorthand", label: "Shorthand", icon: <Mic className="h-5 w-5" /> },
  { href: "/student/live-classes", label: "Live Classes", icon: <Video className="h-5 w-5" /> },
  { href: "/student/exams", label: "Exams", icon: <FileText className="h-5 w-5" /> },
  { href: "/student/analytics", label: "Analytics", icon: <TrendingUp className="h-5 w-5" /> },
  { href: "/student/leaderboard", label: "Leaderboard", icon: <Trophy className="h-5 w-5" /> },
  { href: "/student/fees", label: "Fees", icon: <IndianRupee className="h-5 w-5" /> },
  { href: "/student/library", label: "Library", icon: <BookOpen className="h-5 w-5" /> },
  { href: "/student/certificates", label: "Certificates", icon: <Award className="h-5 w-5" /> },
  { href: "/student/ai-coach", label: "AI Coach", icon: <Bot className="h-5 w-5" /> },
  { href: "/student/feedback", label: "Feedback", icon: <MessageSquareHeart className="h-5 w-5" /> },
];

const parentNav: NavItem[] = [
  { href: "/parent", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/parent/attendance", label: "Attendance", icon: <Calendar className="h-5 w-5" /> },
  { href: "/parent/fees", label: "Fees", icon: <IndianRupee className="h-5 w-5" /> },
  { href: "/parent/progress", label: "Progress", icon: <TrendingUp className="h-5 w-5" /> },
  { href: "/parent/certificates", label: "Certificates", icon: <Award className="h-5 w-5" /> },
];

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  admin: adminNav,
  teacher: teacherNav,
  student: studentNav,
  parent: parentNav,
};

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

const PROFILE_PATHS: Partial<Record<UserRole, string>> = {
  admin: "/admin/profile",
  student: "/student/profile",
  teacher: "/teacher/profile",
};

export function Sidebar({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const nav = NAV_BY_ROLE[role];
  const profilePath = PROFILE_PATHS[role];

  return (
    <aside className="flex h-full w-full flex-col border-r border-default bg-card shadow-xl lg:shadow-none">
      <div className="overflow-hidden border-b border-default bg-card px-3 pb-0 pt-3">
        <BrandLogo size="md" framed className="mx-auto w-full" />
        <p className="-mt-10 mb-1 text-center text-xs font-bold capitalize tracking-wide text-foreground">
          {role} Panel
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4 pt-[5px]">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-primary-light text-accent font-semibold"
                  : "text-muted hover:bg-primary-light hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-default p-3">
        {profilePath ? (
          <Link
            href={profilePath}
            onClick={onNavigate}
            className={cn(
              "mb-2.5 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-primary-light",
              pathname === profilePath && "bg-primary-light"
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-default bg-primary-light">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">{getInitials(user?.name || "?")}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
              <p className="text-xs font-medium text-accent">View Profile</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        ) : (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-default bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:border-muted hover:bg-surface active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4 text-muted" />
          Log out
        </button>
      </div>
    </aside>
  );
}