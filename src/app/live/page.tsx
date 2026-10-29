"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CameraPlayer, { type Camera } from "@/components/CameraPlayer";

type Venue = {
  centerId: string;
  centerName: string;
  city: string;
  source: "subscription" | "booking";
  cameras: number;
};

export default function LivePage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selected, setSelected] = useState("");
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/live")
      .then(async (r) => {
        if (r.status === 401) return (window.location.href = "/login");
        const d = await r.json();
        const list: Venue[] = d.venues ?? [];
        setVenues(list);
        setSelected(list[0]?.centerId ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/centers/${selected}/cameras`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setCameras([]);
          setError(d.error ?? "Could not load the live feeds.");
          return;
        }
        setCameras(d.cameras ?? []);
        setError(null);
      })
      .catch(() => setError("Could not reach the live feed service."));
  }, [selected]);

  if (loading) return <p className="text-slate-500">Loading…</p>;

  if (venues.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Live view</h1>
        <p className="mt-2 text-slate-600">
          There are no feeds to show — live cameras appear once one of your
          bookings is confirmed or a subscription is active.
        </p>
        <Link
          href="/centers"
          className="mt-4 inline-block rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          Find childcare
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Live view</h1>
        <p className="mt-1 text-slate-600">
          CCTV feeds from the centers where your child is currently in care.
          Only you and center staff can see them.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {venues.map((v) => (
          <button
            key={v.centerId}
            onClick={() => setSelected(v.centerId)}
            className={`rounded-xl border px-4 py-2 text-left text-sm ${
              selected === v.centerId
                ? "border-rose-500 bg-rose-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="block font-medium text-slate-900">{v.centerName}</span>
            <span className="block text-xs text-slate-500">
              {v.city} · via {v.source} · {v.cameras} camera
              {v.cameras === 1 ? "" : "s"}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!error && cameras.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          This center has not published any cameras yet.
        </div>
      )}

      {cameras.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cameras.map((c) => (
            <CameraPlayer key={c.id} camera={c} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Feed access is granted automatically while your booking or subscription is
        active and revoked as soon as it ends.
      </p>
    </div>
  );
}
