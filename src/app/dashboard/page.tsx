"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import Recommendations from "@/components/Recommendations";

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

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  txnRef: string;
  paidAt: string | null;
  createdAt: string;
  booking: { id: string; childName: string; center: { name: string } } | null;
  subscription: { id: string; childName: string; planType: string; center: { name: string } } | null;
};

type PayTarget =
  | { kind: "booking"; id: string; amount: number; label: string }
  | { kind: "subscription"; id: string; amount: number; label: string };

const METHODS = [
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "NET_BANKING", label: "Net banking" },
];

export default function ParentDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const [payMethod, setPayMethod] = useState("CARD");
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const [bRes, sRes, pRes] = await Promise.all([
      fetch("/api/bookings"),
      fetch("/api/subscriptions"),
      fetch("/api/payments"),
    ]);
    if (bRes.status === 401 || sRes.status === 401 || pRes.status === 401) {
      window.location.href = "/login";
      return;
    }
    const bData = await bRes.json();
    const sData = await sRes.json();
    const pData = await pRes.json();
    setBookings(bData.bookings ?? []);
    setSubs(sData.subscriptions ?? []);
    setPayments(pData.payments ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmPay() {
    if (!payTarget) return;
    setPayMsg(null);
    setPayBusy(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: payMethod,
        bookingId: payTarget.kind === "booking" ? payTarget.id : undefined,
        subscriptionId: payTarget.kind === "subscription" ? payTarget.id : undefined,
      }),
    });
    const data = await res.json();
    setPayBusy(false);
    if (!res.ok) {
      setPayMsg({ type: "err", text: data.error ?? "Payment failed" });
      return;
    }
    setPayMsg({
      type: "ok",
      text: `Payment successful — ₹${payTarget.amount} (${data.payment.txnRef}).`,
    });
    setPayTarget(null);
    load();
  }

  const paidBookingIds = new Set(
    payments.filter((p) => p.status === "SUCCESS" && p.booking).map((p) => p.booking!.id)
  );

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

      <Recommendations />

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
                  {b.status === "CONFIRMED" &&
                    (paidBookingIds.has(b.id) ? (
                      <span className="text-sm font-medium text-emerald-600">Paid</span>
                    ) : (
                      <button
                        onClick={() =>
                          setPayTarget({
                            kind: "booking",
                            id: b.id,
                            amount: b.totalPrice,
                            label: `${b.childName} · ${b.center.name}`,
                          })
                        }
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                      >
                        Pay now
                      </button>
                    ))}
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
                  {s.status === "ACTIVE" && (
                    <button
                      onClick={() =>
                        setPayTarget({
                          kind: "subscription",
                          id: s.id,
                          amount: s.pricePerPeriod,
                          label: `${s.childName} · ${s.center.name} (${s.planType.toLowerCase()})`,
                        })
                      }
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                    >
                      Pay next period
                    </button>
                  )}
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

      {payTarget && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Checkout</p>
              <p className="text-sm text-slate-600">
                {payTarget.label} — ₹{payTarget.amount}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                onClick={confirmPay}
                disabled={payBusy}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {payBusy ? "Processing…" : "Confirm & pay"}
              </button>
              <button
                onClick={() => {
                  setPayTarget(null);
                  setPayMsg(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
          {payMsg && (
            <div
              className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                payMsg.type === "ok"
                  ? "bg-white text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {payMsg.text}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-xl font-bold text-slate-900">Payments & receipts</h2>
        <p className="mt-1 text-slate-600">
          Every transaction with its reference and status.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">No payments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {p.booking
                      ? `Booking · ${p.booking.childName}`
                      : p.subscription
                      ? `Subscription · ${p.subscription.childName}`
                      : "Payment"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {p.booking?.center.name ?? p.subscription?.center.name ?? ""} ·{" "}
                    {p.method.replace("_", " ").toLowerCase()}
                  </p>
                  <p className="text-xs text-slate-400">
                    {p.txnRef} · {new Date(p.paidAt ?? p.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={p.status} />
                  <span className="text-lg font-bold text-slate-900">₹{p.amount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
