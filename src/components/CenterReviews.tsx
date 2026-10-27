"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  parent: { name: string };
};

type ReviewsPayload = { reviews?: Review[]; average?: number | null } | null;

async function fetchReviews(centerId: string): Promise<ReviewsPayload> {
  const res = await fetch(`/api/reviews?centerId=${centerId}`);
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as ReviewsPayload;
}

export default function CenterReviews({ centerId }: { centerId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [form, setForm] = useState({ rating: "5", comment: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetchReviews(centerId)
      .then((d) => {
        if (ignore || !d) return;
        setReviews(d.reviews ?? []);
        setAverage(d.average ?? null);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [centerId, tick]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ centerId, rating: Number(form.rating), comment: form.comment }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(d.error ?? "Could not save your review.");
      return;
    }
    setMsg("Thanks — your review is live.");
    setForm({ rating: "5", comment: "" });
    setTick((t) => t + 1);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Parent reviews</h2>
        {average !== null && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
            {average.toFixed(1)}★ · {reviews.length}
          </span>
        )}
      </div>

      {reviews.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">
          No reviews yet. Ratings from booked parents power the recommendations
          you see on your dashboard.
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">{r.parent.name}</span>
              <span className="text-sm text-amber-600">{"★".repeat(r.rating)}</span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}★
            </option>
          ))}
        </select>
        <input
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          placeholder="How was your experience?"
          className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        />
        <button
          disabled={busy}
          className="rounded-lg border border-rose-500 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Rate this center"}
        </button>
      </form>
      {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
      <p className="mt-2 text-xs text-slate-400">
        Only parents with a confirmed booking or active subscription here can post.
      </p>
    </div>
  );
}
