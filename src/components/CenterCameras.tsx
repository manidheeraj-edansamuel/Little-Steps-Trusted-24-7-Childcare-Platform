"use client";

import { useEffect, useState } from "react";
import type { Camera } from "@/components/CameraPlayer";

type Option = { id: string; name: string };

const TYPES = [
  { value: "HLS", label: "HLS stream (.m3u8)" },
  { value: "MP4", label: "Video file / recorder clip (.mp4)" },
  { value: "IFRAME", label: "Embed URL from the camera vendor" },
];

export default function CenterCameras({ centers }: { centers: Option[] }) {
  const [centerId, setCenterId] = useState(centers[0]?.id ?? "");
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [form, setForm] = useState({
    name: "",
    location: "",
    type: "HLS",
    streamUrl: "",
  });
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!centerId) return;
    let ignore = false;
    fetch(`/api/centers/${centerId}/cameras`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (ignore) return;
        if (!r.ok) {
          setCameras([]);
          setMsg(d.error ?? "Could not load cameras");
          return;
        }
        setCameras(d.cameras ?? []);
        setMsg("");
      })
      .catch(() => {
        if (!ignore) setMsg("Could not reach the camera service.");
      });
    return () => {
      ignore = true;
    };
  }, [centerId, tick]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/centers/${centerId}/cameras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(d.error ?? "Could not add camera");
    setForm({ name: "", location: "", type: form.type, streamUrl: "" });
    setTick((t) => t + 1);
  }

  async function update(id: string, data: object) {
    await fetch(`/api/cameras/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setTick((t) => t + 1);
  }

  async function remove(id: string) {
    await fetch(`/api/cameras/${id}`, { method: "DELETE" });
    setTick((t) => t + 1);
  }

  if (centers.length === 0)
    return (
      <p className="text-sm text-slate-500">
        Create a center first, then publish its cameras.
      </p>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Camera feeds for</span>
        <select
          value={centerId}
          onChange={(e) => setCenterId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        >
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-500">
        Parents with an active booking or subscription at this center see these
        feeds under Live view. Use your NVR or vendor share link — Little Steps
        never stores recordings.
      </p>

      {msg && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {msg}
        </div>
      )}

      <div className="space-y-2">
        {cameras.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{c.name}</p>
              <p className="truncate text-xs text-slate-500">
                {c.location ? `${c.location} · ` : ""}
                {c.type} · {c.streamUrl}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update(c.id, { active: !c.active })}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                {c.active ? "Pause feed" : "Resume feed"}
              </button>
              <button
                onClick={() => remove(c.id)}
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={add}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
      >
        <input
          required
          placeholder="Camera name (e.g. Play area)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        />
        <input
          placeholder="Location note (optional)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="https://… stream or embed URL"
          value={form.streamUrl}
          onChange={(e) => setForm({ ...form, streamUrl: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        />
        <button className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 sm:col-span-2">
          Add camera
        </button>
      </form>
    </div>
  );
}
