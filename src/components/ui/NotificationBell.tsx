"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getNotifications, markAsRead } from "@/actions/notifications";

interface Notification {
  id: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch { /* ignore */ }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenDropdown = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      try {
        const result = await getNotifications();
        if (result && "notifications" in result && result.notifications) {
          setNotifications((result.notifications as unknown) as Notification[]);
        }
      } catch { /* ignore */ }
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpenDropdown}
        className="relative p-2 rounded-full hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <svg className="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-raised rounded-xl shadow-xl border border-border z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-text text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium bg-primary-light text-primary px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                No notifications yet
              </div>
            ) : (
              <ul>
                {notifications.slice(0, 8).map((n) => (
                  <li
                    key={n.id}
                    onClick={() => !n.read && handleNotificationClick(n.id)}
                    className={`px-4 py-3 hover:bg-surface cursor-pointer transition-colors border-b border-border-light last:border-0 ${
                      !n.read ? "bg-primary-light/30" : ""
                    }`}
                  >
                    <div className="flex gap-2.5">
                      {!n.read && (
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.read ? "font-medium text-text" : "text-text-muted"}`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-text-light mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-2 border-t border-border text-center">
            <Link
              href="/notifications"
              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors inline-block py-1"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
