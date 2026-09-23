"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Caregiver = {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  experienceYears: number;
  verified: boolean;
  certifications: string[];
};

type Center = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  open24x7: boolean;
  operatingHours: string | null;
  capacity: number;
  ageGroups: string[];
  priceHourly: number;
  priceDaily: number;
  priceMonthly: number;
  certifications: string[];
  safetyNotes: string | null;
  caregivers: Caregiver[];
  provider: { name: string };
};

const AGE_LABEL: Record<string, string> = {
  INFANT: "Infant (0–1)",
  TODDLER: "Toddler (1–3)",
  PRESCHOOL: "Preschool (3–5)",
};

export default function CenterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    childName: "",
    ageGroup: "TODDLER",
    planType: "DAILY",
    quantity: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    notes: "",
  });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/centers/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setCenter(d.center);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        centerId: id,
        childName: form.childName,
        ageGroup: form.ageGroup,
        planType: form.planType,
        quantity: form.quantity,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        notes: form.notes,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.status === 401) {
      router.push(`/login`);
      return;
    }
    if (!res.ok) return setMsg({ type: "err", text: data.error ?? "Booking failed" });
    setMsg({
      type: "ok",
      text: "Booking request sent! The center will confirm shortly. Track it in your dashboard.",
    });
    setForm((f) => ({ ...f, childName: "", notes: "" }));
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (notFound || !center)
    return (
      <div className="text-center">
        <p className="text-slate-600">Center not found.</p>
        <Link href="/centers" className="mt-2 inline-block text-rose-600 hover:underline">
          ← Back to search
        </Link>
      </div>
    );

  const unitPrice =
    form.planType === "HOURLY"
      ? center.priceHourly
      : form.planType === "MONTHLY"
      ? center.priceMonthly
      : center.priceDaily;
  const total = unitPrice * (Number(form.quantity) || 1);

  return (
    <div className="space-y-6">
      <Link href="/centers" className="text-sm text-rose-600 hover:underline">
        ← Back to search
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{center.name}</h1>
                <p className="mt-1 text-slate-500">
                  {center.address}, {center.city}
                </p>
                <p className="text-sm text-slate-500">by {center.provider.name}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {center.open24x7 && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    Open 24×7
                  </span>
                )}
                <span className="text-sm text-slate-500">
                  Capacity: {center.capacity}
                </span>
              </div>
            </div>

            {center.description && (
              <p className="mt-4 text-slate-700">{center.description}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {center.ageGroups.map((a) => (
                <span
                  key={a}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                >
                  {AGE_LABEL[a] ?? a}
                </span>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                ["Hourly", center.priceHourly],
                ["Daily", center.priceDaily],
                ["Monthly", center.priceMonthly],
              ].map(([label, price]) => (
                <div key={label as string} className="rounded-xl bg-slate-50 p-3">
                  <div className="text-lg font-bold text-slate-900">
                    ₹{price as number}
                  </div>
                  <div className="text-xs text-slate-500">per {label}</div>
                </div>
              ))}
            </div>

            {center.operatingHours && (
              <p className="mt-4 text-sm text-slate-600">
                <span className="font-medium">Hours:</span> {center.operatingHours}
              </p>
            )}
          </div>

          {(center.certifications.length > 0 || center.safetyNotes) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">Safety & certifications</h2>
              {center.certifications.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {center.certifications.map((c) => (
                    <li
                      key={c}
                      className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                    >
                      ✓ {c}
                    </li>
                  ))}
                </ul>
              )}
              {center.safetyNotes && (
                <p className="mt-3 text-sm text-slate-600">{center.safetyNotes}</p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Caregivers</h2>
            {center.caregivers.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No caregivers listed yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {center.caregivers.map((cg) => (
                  <div
                    key={cg.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{cg.name}</span>
                      {cg.verified && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          Verified
                        </span>
                      )}
                    </div>
                    {cg.title && (
                      <p className="text-sm text-slate-500">{cg.title}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      {cg.experienceYears} yrs experience
                    </p>
                    {cg.bio && <p className="mt-2 text-sm text-slate-600">{cg.bio}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <form
            onSubmit={book}
            className="sticky top-20 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">Book a slot</h2>

            {msg && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.type === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {msg.text}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">Child's name</label>
              <input
                required
                value={form.childName}
                onChange={(e) => set("childName", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Age group</label>
              <select
                value={form.ageGroup}
                onChange={(e) => set("ageGroup", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
              >
                {Object.entries(AGE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Plan</label>
              <select
                value={form.planType}
                onChange={(e) => set("planType", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
              >
                <option value="HOURLY">Hourly — ₹{center.priceHourly}/hr</option>
                <option value="DAILY">Daily — ₹{center.priceDaily}/day</option>
                <option value="MONTHLY">Monthly — ₹{center.priceMonthly}/mo</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => set("quantity", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Start date</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                End date (optional)
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-600">Estimated total</span>
              <span className="text-xl font-bold text-slate-900">₹{total}</span>
            </div>

            <button
              disabled={busy}
              className="w-full rounded-lg bg-rose-500 px-4 py-2.5 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send booking request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
