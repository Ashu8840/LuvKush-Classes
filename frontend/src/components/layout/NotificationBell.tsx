"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
};

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = () => {
    api.getNotifications().then((data) => {
      setNotifications(data.notifications as Notification[]);
      setUnread(data.unreadCount as number);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const dismiss = async (n: Notification) => {
    await api.dismissNotification(n._id);
    setNotifications((prev) => prev.filter((item) => item._id !== n._id));
    setUnread((c) => Math.max(0, c - (n.isRead ? 0 : 1)));
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const clearAll = async () => {
    await api.markAllNotificationsRead();
    setNotifications([]);
    setUnread(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-xl border border-default p-2.5 text-foreground transition hover:bg-primary-light"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-default bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-default px-4 py-3">
              <span className="font-semibold text-foreground">Notifications</span>
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-accent hover:underline">
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => dismiss(n)}
                    className={`w-full border-b border-default px-4 py-3 text-left transition hover:bg-primary-light ${
                      !n.isRead ? "bg-primary-light/60" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted">{n.message}</p>
                    {n.type === "announcement" && user && (
                      <p className="mt-1 text-xs text-accent">Tap to view announcements</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}