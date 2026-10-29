"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  approved: string;
  createdAt: string;
  _count: { centers: number; bookings: number };
};

type AdminCenter = {
  id: string;
  name: string;
  city: string;
  approved: string;
  open24x7: boolean;
  provider: { id: string; name: string; email: string };
};

type Stats = {
  totalUsers: number;
  totalParents: number;
  totalProviders: number;
  pendingProviders: number;
  totalCenters: number;
  pendingCenters: number;
  totalBookings: number;
  totalCollected: number;
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [centers, setCenters] = useState<AdminCenter[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "centers">("users");
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (res.status === 403) {
      setDenied(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
    setCenters(data.centers ?? []);
    setStats(data.stats ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(body: object) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (denied)
    return (
      <div className="text-center">
        <p className="text-slate-600">Admin access only.</p>
        <Link href="/" className="mt-2 inline-block text-rose-600 hover:underline">
          ← Home
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin console</h1>
        <p className="mt-1 text-slate-600">
          Approve users and centers, and monitor platform activity.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Users" value={stats.totalUsers} sub={`${stats.totalParents} parents · ${stats.totalProviders} providers`} />
          <Stat label="Pending providers" value={stats.pendingProviders} />
          <Stat label="Centers" value={stats.totalCenters} sub={`${stats.pendingCenters} pending`} />
          <Stat label="Bookings" value={stats.totalBookings} />
          <Stat label="Collected" value={`₹${stats.totalCollected}`} sub="successful payments" />
        </div>
      )}

      <div className="flex flex-wrap gap-x-2 border-b border-slate-200">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Users ({users.length})
        </TabButton>
        <TabButton active={tab === "centers"} onClick={() => setTab("centers")}>
          Centers ({centers.length})
        </TabButton>
      </div>

      {tab === "users" ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {u.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.approved} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          decide({ userId: u.id, status: "APPROVED" })
                        }
                        className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          decide({ userId: u.id, status: "REJECTED" })
                        }
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {centers.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <Link
                  href={`/centers/${c.id}`}
                  className="font-semibold text-slate-900 hover:text-rose-600"
                >
                  {c.name}
                </Link>
                <p className="text-sm text-slate-500">
                  {c.city}
                  {c.open24x7 ? " · 24×7" : ""} · by {c.provider.name} (
                  {c.provider.email})
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={c.approved} />
                <button
                  onClick={() => decide({ centerId: c.id, status: "APPROVED" })}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide({ centerId: c.id, status: "REJECTED" })}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
        active
          ? "border-rose-500 text-rose-600"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
