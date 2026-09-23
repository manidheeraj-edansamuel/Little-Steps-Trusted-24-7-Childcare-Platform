"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Center = {
  id: string;
  name: string;
  city: string;
  address: string;
  open24x7: boolean;
  operatingHours: string | null;
  ageGroups: string[];
  priceHourly: number;
  priceDaily: number;
  priceMonthly: number;
  capacity: number;
  caregivers: { id: string; name: string; verified: boolean }[];
};

const AGE_LABEL: Record<string, string> = {
  INFANT: "Infant (0–1)",
  TODDLER: "Toddler (1–3)",
  PRESCHOOL: "Preschool (3–5)",
};

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: "",
    city: "",
    open24x7: false,
    ageGroup: "",
    timing: "",
    plan: "daily",
    maxPrice: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.city) params.set("city", filters.city);
    if (filters.open24x7) params.set("open24x7", "true");
    if (filters.ageGroup) params.set("ageGroup", filters.ageGroup);
    if (filters.timing) params.set("timing", filters.timing);
    if (filters.plan) params.set("plan", filters.plan);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

    const res = await fetch(`/api/centers?${params.toString()}`);
    const data = await res.json();
    setCenters(data.centers ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function set<K extends keyof typeof filters>(k: K, v: (typeof filters)[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Find childcare</h1>
        <p className="mt-1 text-slate-600">
          Search verified daycare centers and crèches by location, timing and price.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Search</label>
            <input
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Center name or keyword"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">City</label>
            <input
              value={filters.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="e.g. Mumbai"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Age group</label>
            <select
              value={filters.ageGroup}
              onChange={(e) => set("ageGroup", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
            >
              <option value="">Any</option>
              {Object.entries(AGE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Timing</label>
            <select
              value={filters.timing}
              onChange={(e) => set("timing", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
            >
              <option value="">Any</option>
              <option value="day">Day</option>
              <option value="night">Night</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.open24x7}
              onChange={(e) => set("open24x7", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-rose-500"
            />
            24×7 availability only
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-700">Plan</label>
            <select
              value={filters.plan}
              onChange={(e) => set("plan", e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-rose-500"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-700">Max price</label>
            <input
              type="number"
              min={0}
              value={filters.maxPrice}
              onChange={(e) => set("maxPrice", e.target.value)}
              placeholder="Any"
              className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading centers…</p>
      ) : centers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No centers match your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {centers.map((c) => (
            <Link
              key={c.id}
              href={`/centers/${c.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 group-hover:text-rose-600">
                  {c.name}
                </h3>
                {c.open24x7 && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    24×7
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {c.city} · {c.address}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {c.ageGroups.map((a) => (
                  <span
                    key={a}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {AGE_LABEL[a] ?? a}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-600">
                  ₹{c.priceDaily}/day · ₹{c.priceMonthly}/mo
                </span>
                <span className="text-xs text-slate-500">
                  {c.caregivers.length} caregivers
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
