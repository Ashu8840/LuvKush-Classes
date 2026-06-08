"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Calendar,
  IndianRupee,
  FileText,
  BookOpen,
  Video,
  Mail,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Stats = {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  todayAttendance: number;
  upcomingExams: number;
  feesCollected: number;
  pendingFees: number;
  pendingFeesCount?: number;
  liveClasses: number;
  courseEnrollments: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueData, setRevenueData] = useState<{ _id: number; revenue: number }[]>([]);
  const [newContacts, setNewContacts] = useState(0);

  useEffect(() => {
    api.adminDashboard().then((data) => {
      setStats(data.stats as Stats);
      setRevenueData((data.revenueData as { _id: number; revenue: number }[]) || []);
    }).catch(() => {});
    api.getAdminFeedback("type=contact&limit=1").then((d) => {
      setNewContacts(d.stats.newContactInquiries);
    }).catch(() => {});
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = revenueData.map((d) => ({
    month: months[d._id - 1] || `M${d._id}`,
    revenue: d.revenue,
  }));

  return (
    <div className="space-y-8">
      {newContacts > 0 && (
        <Link
          href="/admin/student-feedback?type=contact"
          className="flex items-center justify-between gap-4 rounded-2xl border border-warning/30 bg-warning-light p-5 transition hover:opacity-90"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-card p-2.5">
              <Mail className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {newContacts} new contact inquir{newContacts === 1 ? "y" : "ies"}
              </p>
              <p className="text-sm text-muted">Visitors submitted the Contact Us form — review and respond</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
            View <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={stats?.totalStudents ?? "—"} icon={<Users className="h-6 w-6" />} />
        <StatCard title="Active Students" value={stats?.activeStudents ?? "—"} icon={<Users className="h-6 w-6" />} trend="Currently enrolled" />
        <StatCard title="Total Teachers" value={stats?.totalTeachers ?? "—"} icon={<GraduationCap className="h-6 w-6" />} />
        <StatCard title="Today's Attendance" value={stats?.todayAttendance ?? "—"} icon={<Calendar className="h-6 w-6" />} />
        <StatCard title="Fees Collected" value={stats ? formatCurrency(stats.feesCollected) : "—"} icon={<IndianRupee className="h-6 w-6" />} />
        <StatCard
          title="Pending Fees"
          value={stats ? formatCurrency(stats.pendingFees) : "—"}
          trend={stats?.pendingFeesCount ? `${stats.pendingFeesCount} unpaid record(s)` : "Amount to collect"}
          icon={<IndianRupee className="h-6 w-6" />}
        />
        <StatCard title="Upcoming Exams" value={stats?.upcomingExams ?? "—"} icon={<FileText className="h-6 w-6" />} />
        <StatCard title="Course Enrollments" value={stats?.courseEnrollments ?? "—"} icon={<BookOpen className="h-6 w-6" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length ? chartData : [{ month: "No data", revenue: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Add Student", href: "/admin/students" },
              { label: "Add Teacher", href: "/admin/teachers" },
              { label: "Create Course", href: "/admin/courses" },
              { label: "Manage Fees", href: "/admin/fees" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="rounded-xl border border-default px-4 py-3 text-sm font-medium text-foreground transition hover:bg-primary-light"
              >
                {action.label}
              </a>
            ))}
          </div>
          <a href="/admin/database" className="mt-4 block rounded-xl border border-default px-4 py-3 text-sm font-medium transition hover:bg-primary-light">
            View Records Database →
          </a>
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-success-light p-4">
            <Video className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">Live Classes</p>
              <p className="text-xs text-muted">{stats?.liveClasses ?? 0} classes running now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}