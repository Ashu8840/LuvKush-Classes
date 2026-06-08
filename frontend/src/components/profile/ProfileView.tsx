"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera, Lock, User, Mail, Phone, Calendar, MapPin, GraduationCap,
  Users, IndianRupee, Award, Flame, Star, BookOpen,
} from "lucide-react";
import { api, StudentProfile, TeacherProfile, User as AuthUser } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function maskAadhaar(value?: string) {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "—";
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-default bg-surface/50 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        {icon}
        {label}
        <Lock className="ml-auto h-3 w-3 opacity-50" />
      </div>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export function ProfileView({ role }: { role: "student" | "teacher" }) {
  const { user, setUserAvatar } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<StudentProfile | TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .getMe()
      .then((data) => setProfile(data.profile))
      .catch(() => setError("Could not load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const { url } = await api.uploadAvatar(file);
      const { user: updated } = await api.updateProfile({ avatar: url });
      setUserAvatar(updated.avatar || url);
      setSuccess("Profile photo updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const authUser = user as AuthUser | null;
  const studentProfile = role === "student" ? (profile as StudentProfile | null) : null;
  const teacherProfile = role === "teacher" ? (profile as TeacherProfile | null) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-r from-primary/20 via-primary-light to-transparent px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-primary-light shadow-lg">
                {authUser?.avatar ? (
                  <Image
                    src={authUser.avatar}
                    alt={authUser.name}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {getInitials(authUser?.name || "?")}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-60"
                aria-label="Change profile photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground">{authUser?.name}</h1>
              <p className="mt-1 capitalize text-muted">{role}</p>
              <p className="mt-2 text-sm text-muted">{authUser?.email}</p>
              {uploading && <p className="mt-3 text-sm text-accent">Uploading photo…</p>}
              {success && <p className="mt-3 text-sm text-accent">{success}</p>}
              {error && <p className="mt-3 text-sm text-danger">{error}</p>}
              <p className="mt-4 text-xs text-muted">
                Only your profile photo can be changed. Institute records are managed by admin.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Account Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Full Name" value={authUser?.name} icon={<User className="h-3.5 w-3.5" />} />
          <ReadOnlyField label="Email" value={authUser?.email} icon={<Mail className="h-3.5 w-3.5" />} />
          <ReadOnlyField label="Phone" value={authUser?.phone} icon={<Phone className="h-3.5 w-3.5" />} />
          <ReadOnlyField
            label="Member Since"
            value={authUser?.createdAt ? formatDate(authUser.createdAt) : "—"}
            icon={<Calendar className="h-3.5 w-3.5" />}
          />
        </div>
      </section>

      {role === "student" && studentProfile && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Academic Records</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Course" value={studentProfile.course?.name} icon={<BookOpen className="h-3.5 w-3.5" />} />
              <ReadOnlyField label="Batch" value={studentProfile.batch?.name} icon={<Users className="h-3.5 w-3.5" />} />
              <ReadOnlyField label="Assigned Teacher" value={studentProfile.teacher?.name} icon={<GraduationCap className="h-3.5 w-3.5" />} />
              <ReadOnlyField
                label="Admission Date"
                value={studentProfile.admissionDate ? formatDate(studentProfile.admissionDate) : "—"}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <ReadOnlyField label="Attendance" value={`${studentProfile.attendancePercent ?? 0}%`} />
              <ReadOnlyField label="Performance Score" value={studentProfile.performanceScore ?? 0} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Fee Status</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField
                label="Fees Status"
                value={<span className="capitalize">{studentProfile.feesStatus || "—"}</span>}
                icon={<IndianRupee className="h-3.5 w-3.5" />}
              />
              <ReadOnlyField
                label="Paid / Total"
                value={`${formatCurrency(studentProfile.paidFees ?? 0)} / ${formatCurrency(studentProfile.totalFees ?? 0)}`}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Personal & Parent Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField
                label="Date of Birth"
                value={studentProfile.dateOfBirth ? formatDate(studentProfile.dateOfBirth) : "—"}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <ReadOnlyField label="Address" value={studentProfile.address} icon={<MapPin className="h-3.5 w-3.5" />} />
              <ReadOnlyField label="Parent Name" value={studentProfile.parentName} />
              <ReadOnlyField label="Parent Phone" value={studentProfile.parentPhone} icon={<Phone className="h-3.5 w-3.5" />} />
              <ReadOnlyField label="Aadhaar" value={maskAadhaar(studentProfile.aadhaarNumber)} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Progress & Achievements</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ReadOnlyField label="Level" value={studentProfile.level ?? 1} icon={<Star className="h-3.5 w-3.5" />} />
              <ReadOnlyField label="XP" value={studentProfile.xp ?? 0} />
              <ReadOnlyField label="Streak" value={`${studentProfile.streak ?? 0} days`} icon={<Flame className="h-3.5 w-3.5" />} />
              <ReadOnlyField
                label="Badges"
                value={
                  studentProfile.badges?.length
                    ? studentProfile.badges.join(", ")
                    : "No badges yet"
                }
                icon={<Award className="h-3.5 w-3.5" />}
              />
            </div>
          </section>
        </>
      )}

      {role === "teacher" && teacherProfile && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Professional Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Qualification" value={teacherProfile.qualification} icon={<GraduationCap className="h-3.5 w-3.5" />} />
              <ReadOnlyField label="Experience" value={teacherProfile.experience} />
              <ReadOnlyField
                label="Joining Date"
                value={teacherProfile.joiningDate ? formatDate(teacherProfile.joiningDate) : "—"}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <ReadOnlyField label="Rating" value={`${teacherProfile.rating ?? 5} / 5`} icon={<Star className="h-3.5 w-3.5" />} />
              <ReadOnlyField label="Performance Score" value={teacherProfile.performanceScore ?? 0} />
              <ReadOnlyField
                label="Subjects"
                value={teacherProfile.subjects?.length ? teacherProfile.subjects.join(", ") : "—"}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Assigned Batches</h2>
            {teacherProfile.batches?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {teacherProfile.batches.map((batch) => (
                  <ReadOnlyField
                    key={batch._id}
                    label={batch.name}
                    value={[batch.timing, batch.type].filter(Boolean).join(" · ") || "—"}
                    icon={<Users className="h-3.5 w-3.5" />}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <p className="text-sm text-muted">No batches assigned yet.</p>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}