"use client";

import { AnnouncementsFeed } from "@/components/announcements/AnnouncementsFeed";

export default function StudentAnnouncementsPage() {
  return <AnnouncementsFeed canPost={false} role="student" />;
}