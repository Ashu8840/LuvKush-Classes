"use client";

import { AnnouncementsFeed } from "@/components/announcements/AnnouncementsFeed";

export default function AdminAnnouncementsPage() {
  return <AnnouncementsFeed canPost role="admin" />;
}