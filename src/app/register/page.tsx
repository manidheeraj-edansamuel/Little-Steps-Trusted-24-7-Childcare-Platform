"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const params = useSearchParams();
  const initialRole = params.get("role") === "PROVIDER" ? "PROVIDER" : "PARENT";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: initialRole,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Registration failed");

    const role = data.user.role;
    // Full page load so the nav re-reads the session cookie.
    window.location.href = role === "PROVIDER" ? "/provider" : "/dashboard";
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Join Little Steps as a parent or a childcare provider.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {(["PARENT", "PROVIDER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set("role", r)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  form.role === r
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {r === "PARENT" ? "I'm a parent" : "I'm a provider"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone (optional)</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          {form.role === "PROVIDER" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Provider accounts are reviewed by an admin before your centers go
              live.
            </p>
          )}

          <button
            disabled={busy}
            className="w-full rounded-lg bg-rose-500 px-4 py-2.5 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-rose-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-500">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
