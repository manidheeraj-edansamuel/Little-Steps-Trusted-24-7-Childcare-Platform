"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const svg = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-5 w-5",
} as const;

const Icons = {
  search: (
    <svg {...svg}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  video: (
    <svg {...svg}>
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
    </svg>
  ),
  home: (
    <svg {...svg}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  bell: (
    <svg {...svg}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  user: (
    <svg {...svg}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

type Tab = { href: string; label: string; glyph: React.ReactNode; badge?: number };

export default function MobileTabBar() {
  const [role, setRole] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!role) return;
    fetch("/api/notifications?unread=true")
      .then((r) => r.json())
      .then((d) => setUnread(d.unreadCount ?? 0))
      .catch(() => setUnread(0));
  }, [role]);

  if (!ready) return null;

  const home =
    role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/provider" : "/dashboard";

  const tabs: Tab[] = [
    { href: "/centers", label: "Find", glyph: Icons.search },
    ...(role === "PARENT"
      ? [{ href: "/live", label: "Live", glyph: Icons.video }]
      : []),
    ...(role
      ? [
          { href: home, label: "Home", glyph: Icons.home },
          { href: "/notifications", label: "Alerts", glyph: Icons.bell, badge: unread },
        ]
      : [{ href: "/login", label: "Log in", glyph: Icons.user }]),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-flow-col border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
            pathname === tab.href ? "text-rose-600" : "text-slate-500"
          }`}
        >
          {tab.glyph}
          {tab.label}
          {tab.badge ? (
            <span className="absolute right-[20%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {tab.badge > 9 ? "9+" : tab.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
