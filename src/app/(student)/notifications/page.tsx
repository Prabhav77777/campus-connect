"use client";

import { useState, useEffect } from "react";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await getNotifications();
      if (result && "notifications" in result) {
        setNotifications(result.notifications || []);
      } else if (Array.isArray(result)) {
        setNotifications(result);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const content = (
              <div
                className={`bg-surface-raised rounded-xl p-4 border transition-colors cursor-pointer ${
                  n.read
                    ? "border-border-light opacity-70"
                    : "border-l-4 border-l-primary border-border-light shadow-sm"
                }`}
                onClick={() => !n.read && handleMarkRead(n.id)}
              >
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-text-light mt-1">
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
