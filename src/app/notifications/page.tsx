"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setItems(data.notifications ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-slate-600">
            Updates about your bookings, subscriptions and account.
          </p>
        </div>
        <button
          onClick={markAll}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Mark all read
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && markOne(n.id)}
              className={`block w-full rounded-2xl border p-5 text-left shadow-sm transition ${
                n.read
                  ? "border-slate-200 bg-white"
                  : "border-rose-200 bg-rose-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {!n.read && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-medium text-white">
                      New
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-slate-500">
        <Link href="/centers" className="text-rose-600 hover:underline">
          Browse childcare centers →
        </Link>
      </p>
    </div>
  );
}
