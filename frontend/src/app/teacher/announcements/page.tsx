"use client";

import { AnnouncementsFeed } from "@/components/announcements/AnnouncementsFeed";

export default function TeacherAnnouncementsPage() {
  return <AnnouncementsFeed canPost={false} role="teacher" />;
}