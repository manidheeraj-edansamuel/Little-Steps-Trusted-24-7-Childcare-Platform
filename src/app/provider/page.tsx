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
  parent: { id: string; name: string; email: string; phone?: string | null };
  center: { id: string; name: string; city: string };
};

type Center = {
  id: string;
  name: string;
  city: string;
  approved: string;
  open24x7: boolean;
  priceDaily: number;
  _count: { bookings: number };
};

const emptyCenter = {
  name: "",
  description: "",
  address: "",
  city: "",
  operatingHours: "",
  capacity: 20,
  priceHourly: 0,
  priceDaily: 0,
  priceMonthly: 0,
  safetyNotes: "",
  certifications: "",
  open24x7: true,
  ageGroups: [] as string[],
};

export default function ProviderDashboard() {
  const [tab, setTab] = useState<"bookings" | "centers">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCenter);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [bRes, cRes] = await Promise.all([
      fetch("/api/bookings"),
      fetch("/api/centers?mine=true"),
    ]);
    if (bRes.status === 401 || cRes.status === 401) {
      window.location.href = "/login";
      return;
    }
    const bData = await bRes.json();
    const cData = await cRes.json();
    setBookings(bData.bookings ?? []);
    setCenters(cData.centers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  function toggleAge(a: string) {
    setForm((f) => ({
      ...f,
      ageGroups: f.ageGroups.includes(a)
        ? f.ageGroups.filter((x) => x !== a)
        : [...f.ageGroups, a],
    }));
  }

  async function createCenter(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const payload = {
      ...form,
      certifications: form.certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const res = await fetch("/api/centers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? "Failed to create center");
    setShowForm(false);
    setForm(emptyCenter);
    setTab("centers");
    load();
  }

  const pending = bookings.filter((b) => b.status === "PENDING");
  const earnings = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Provider dashboard</h1>
        <p className="mt-1 text-slate-600">
          Manage booking requests and your childcare centers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pending requests" value={String(pending.length)} />
        <Stat label="Total bookings" value={String(bookings.length)} />
        <Stat label="Earnings" value={`₹${earnings}`} />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <TabButton active={tab === "bookings"} onClick={() => setTab("bookings")}>
          Booking requests ({bookings.length})
        </TabButton>
        <TabButton active={tab === "centers"} onClick={() => setTab("centers")}>
          My centers ({centers.length})
        </TabButton>
      </div>

      {tab === "bookings" ? (
        bookings.length === 0 ? (
          <Empty text="No booking requests yet." />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {b.childName}{" "}
                      <span className="font-normal text-slate-500">
                        ({b.ageGroup.toLowerCase()})
                      </span>
                    </p>
                    <Link
                      href={`/centers/${b.center.id}`}
                      className="text-sm text-rose-600 hover:underline"
                    >
                      {b.center.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      Parent: {b.parent.name} · {b.parent.email}
                      {b.parent.phone ? ` · ${b.parent.phone}` : ""}
                    </p>
                    <p className="text-sm text-slate-500">
                      {b.planType.toLowerCase()} × {b.quantity} · starts{" "}
                      {new Date(b.startDate).toLocaleDateString()} · ₹{b.totalPrice}
                    </p>
                    {b.notes && (
                      <p className="mt-1 text-sm text-slate-600">“{b.notes}”</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={b.status} />
                    {b.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStatus(b.id, "CONFIRMED")}
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setStatus(b.id, "REJECTED")}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {b.status === "CONFIRMED" && (
                      <button
                        onClick={() => setStatus(b.id, "COMPLETED")}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        Mark completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-rose-500 px-4 py-2 font-medium text-white hover:bg-rose-600"
          >
            {showForm ? "Close form" : "+ Add a center"}
          </button>

          {showForm && (
            <form
              onSubmit={createCenter}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              {msg && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {msg}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Center name">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={input}
                  />
                </Field>
                <Field label="City">
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={input}
                  />
                </Field>
                <Field label="Address">
                  <input
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={input}
                  />
                </Field>
                <Field label="Operating hours">
                  <input
                    value={form.operatingHours}
                    onChange={(e) =>
                      setForm({ ...form, operatingHours: e.target.value })
                    }
                    placeholder="e.g. Open 24 hours"
                    className={input}
                  />
                </Field>
                <Field label="Capacity">
                  <input
                    type="number"
                    min={0}
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: Number(e.target.value) })
                    }
                    className={input}
                  />
                </Field>
                <Field label="Certifications (comma-separated)">
                  <input
                    value={form.certifications}
                    onChange={(e) =>
                      setForm({ ...form, certifications: e.target.value })
                    }
                    placeholder="ISO 9001, Fire Safety"
                    className={input}
                  />
                </Field>
                <Field label="Price / hour (₹)">
                  <input
                    type="number"
                    min={0}
                    value={form.priceHourly}
                    onChange={(e) =>
                      setForm({ ...form, priceHourly: Number(e.target.value) })
                    }
                    className={input}
                  />
                </Field>
                <Field label="Price / day (₹)">
                  <input
                    type="number"
                    min={0}
                    value={form.priceDaily}
                    onChange={(e) =>
                      setForm({ ...form, priceDaily: Number(e.target.value) })
                    }
                    className={input}
                  />
                </Field>
                <Field label="Price / month (₹)">
                  <input
                    type="number"
                    min={0}
                    value={form.priceMonthly}
                    onChange={(e) =>
                      setForm({ ...form, priceMonthly: Number(e.target.value) })
                    }
                    className={input}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className={input}
                />
              </Field>
              <Field label="Safety notes">
                <textarea
                  value={form.safetyNotes}
                  onChange={(e) =>
                    setForm({ ...form, safetyNotes: e.target.value })
                  }
                  rows={2}
                  className={input}
                />
              </Field>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Age groups
                </label>
                <div className="mt-1 flex gap-2">
                  {["INFANT", "TODDLER", "PRESCHOOL"].map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => toggleAge(a)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        form.ageGroups.includes(a)
                          ? "border-rose-500 bg-rose-50 text-rose-700"
                          : "border-slate-300 text-slate-600"
                      }`}
                    >
                      {a.charAt(0) + a.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.open24x7}
                  onChange={(e) => setForm({ ...form, open24x7: e.target.checked })}
                  className="h-4 w-4 accent-rose-500"
                />
                Open 24×7
              </label>
              <button className="rounded-lg bg-rose-500 px-4 py-2.5 font-medium text-white hover:bg-rose-600">
                Submit for approval
              </button>
              <p className="text-xs text-slate-500">
                New centers are reviewed by an admin before appearing in search.
              </p>
            </form>
          )}

          {centers.length === 0 ? (
            <Empty text="You haven't listed any centers yet." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {centers.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/centers/${c.id}`}
                      className="font-semibold text-slate-900 hover:text-rose-600"
                    >
                      {c.name}
                    </Link>
                    <StatusBadge status={c.approved} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{c.city}</p>
                  <p className="text-sm text-slate-500">
                    ₹{c.priceDaily}/day · {c._count.bookings} bookings
                    {c.open24x7 ? " · 24×7" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
      {text}
    </div>
  );
}
