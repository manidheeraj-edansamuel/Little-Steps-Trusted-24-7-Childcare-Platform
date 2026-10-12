"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

type Booking = {
  id: string;
  childName: string;
  ageGroup: string;
  planType: string;
  quantity: number;
  startDate: string;
  endDate: string | null;
  totalPrice: number;
  status: string;
  notes: string | null;
  createdAt: string;
  center: { id: string; name: string; city: string };
};

type Subscription = {
  id: string;
  childName: string;
  ageGroup: string;
  planType: string;
  pricePerPeriod: number;
  status: string;
  startDate: string;
  nextBillingDate: string;
  center: { id: string; name: string; city: string };
};

export default function ParentDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [bRes, sRes] = await Promise.all([
      fetch("/api/bookings"),
      fetch("/api/subscriptions"),
    ]);
    if (bRes.status === 401 || sRes.status === 401) {
      window.location.href = "/login";
      return;
    }
    const bData = await bRes.json();
    const sData = await sRes.json();
    setBookings(bData.bookings ?? []);
    setSubs(sData.subscriptions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(id: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    load();
  }

  async function setSubStatus(id: string, status: string) {
    await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My bookings</h1>
          <p className="mt-1 text-slate-600">
            Track and manage your childcare booking requests.
          </p>
        </div>
        <Link
          href="/centers"
          className="rounded-lg bg-rose-500 px-4 py-2 font-medium text-white hover:bg-rose-600"
        >
          Book childcare
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">You have no bookings yet.</p>
          <Link href="/centers" className="mt-2 inline-block text-rose-600 hover:underline">
            Find a center →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/centers/${b.center.id}`}
                    className="font-semibold text-slate-900 hover:text-rose-600"
                  >
                    {b.center.name}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {b.center.city} · {b.childName} ({b.ageGroup.toLowerCase()})
                  </p>
                  <p className="text-sm text-slate-500">
                    {b.planType.toLowerCase()} × {b.quantity} · starts{" "}
                    {new Date(b.startDate).toLocaleDateString()}
                    {b.endDate && ` → ${new Date(b.endDate).toLocaleDateString()}`}
                  </p>
                  {b.notes && (
                    <p className="mt-1 text-sm text-slate-600">“{b.notes}”</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={b.status} />
                  <span className="text-lg font-bold text-slate-900">
                    ₹{b.totalPrice}
                  </span>
                  {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                    <button
                      onClick={() => cancel(b.id)}
                      className="text-sm text-rose-600 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">My subscriptions</h2>
          <Link href="/centers" className="text-sm text-rose-600 hover:underline">
            + New subscription
          </Link>
        </div>
        <p className="mt-1 text-slate-600">
          Recurring care plans. Pause, resume or cancel anytime.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : subs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">You have no subscriptions yet.</p>
          <Link href="/centers" className="mt-2 inline-block text-rose-600 hover:underline">
            Find a center →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/centers/${s.center.id}`}
                    className="font-semibold text-slate-900 hover:text-rose-600"
                  >
                    {s.center.name}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {s.center.city} · {s.childName} ({s.ageGroup.toLowerCase()})
                  </p>
                  <p className="text-sm text-slate-500">
                    {s.planType.toLowerCase()} plan · next billing{" "}
                    {new Date(s.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={s.status} />
                  <span className="text-lg font-bold text-slate-900">
                    ₹{s.pricePerPeriod}
                    <span className="text-xs font-normal text-slate-500">
                      {" "}
                      / {s.planType === "MONTHLY" ? "mo" : "day"}
                    </span>
                  </span>
                  {s.status !== "CANCELLED" && (
                    <div className="flex gap-3">
                      {s.status === "ACTIVE" ? (
                        <button
                          onClick={() => setSubStatus(s.id, "PAUSED")}
                          className="text-sm text-slate-600 hover:underline"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => setSubStatus(s.id, "ACTIVE")}
                          className="text-sm text-emerald-600 hover:underline"
                        >
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => setSubStatus(s.id, "CANCELLED")}
                        className="text-sm text-rose-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
