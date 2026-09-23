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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .finally(() => setLoading(false));
  }, []);

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
            className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
          >
            Find Childcare
          </Link>

          {loading ? null : user ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                Dashboard
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
