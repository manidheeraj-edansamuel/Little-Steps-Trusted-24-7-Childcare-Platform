"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  id: string;
  name: string;
  email: string;
  role: "PARENT" | "PROVIDER" | "ADMIN";
  approved: string;
} | null;

export default function Nav() {
  const [user, setUser] = useState<Me>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications?unread=true")
      .then((r) => r.json())
      .then((d) => setUnread(d.unreadCount ?? 0))
      .catch(() => setUnread(0));
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Full page load so the nav and any dashboards re-read the session cookie.
    window.location.href = "/";
  }

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "PROVIDER"
      ? "/provider"
      : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500 text-white">
            LS
          </span>
          <span>Little Steps</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/centers"
            className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 sm:block"
          >
            Find Childcare
          </Link>

          {loading ? null : user ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 sm:block"
              >
                Dashboard
              </Link>
              {user?.role === "PARENT" && (
                <Link
                  href="/live"
                  className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 sm:block"
                >
                  Live view
                </Link>
              )}
              <Link
                href="/notifications"
                className="relative hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block"
                aria-label="Notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <span className="hidden px-2 text-slate-400 sm:inline">
                {user.name.split(" ")[0]} · {user.role.toLowerCase()}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-rose-500 px-3 py-2 font-medium text-white hover:bg-rose-600"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
