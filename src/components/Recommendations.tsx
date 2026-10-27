"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Reason = { label: string; weight: number };

type RecCenter = {
  centerId: string;
  name: string;
  city: string;
  open24x7: boolean;
  priceDaily: number;
  score: number;
  reasons: Reason[];
};

type RecCaregiver = {
  caregiverId: string;
  name: string;
  title: string | null;
  experienceYears: number;
  verified: boolean;
  centerId: string;
  centerName: string;
  atYourCenter: boolean;
  score: number;
  reasons: string[];
};

export default function Recommendations() {
  const [centers, setCenters] = useState<RecCenter[]>([]);
  const [caregivers, setCaregivers] = useState<RecCaregiver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        setCenters(d.centers ?? []);
        setCaregivers(d.caregivers ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (centers.length === 0 && caregivers.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recommended for you</h2>
        <p className="text-sm text-slate-500">
          Ranked from your booking history, your usual spend, center ratings and
          what similar families choose.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {centers.map((c) => (
          <div
            key={c.centerId}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/centers/${c.centerId}`}
                  className="font-semibold text-slate-900 hover:text-rose-600"
                >
                  {c.name}
                </Link>
                <p className="text-sm text-slate-500">
                  {c.city} · ₹{c.priceDaily}/day
                  {c.open24x7 ? " · 24×7" : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                {c.score}% match
              </span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {c.reasons.map((r) => (
                <li
                  key={r.label}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                >
                  {r.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {caregivers.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Caregivers who fit your child</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {caregivers.map((cg) => (
              <div key={cg.caregiverId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{cg.name}</p>
                    <p className="text-sm text-slate-500">
                      {cg.title ?? "Caregiver"} · {cg.centerName}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">
                    {cg.score}%
                  </span>
                </div>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {cg.reasons.map((label) => (
                    <li
                      key={label}
                      className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/centers/${cg.centerId}`}
                  className="mt-2 inline-block text-xs text-rose-600 hover:underline"
                >
                  View center
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
