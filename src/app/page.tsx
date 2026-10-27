import Link from "next/link";

const features = [
  {
    title: "Verified caregivers",
    body: "Every provider and caregiver goes through document verification before going live.",
  },
  {
    title: "24×7 availability",
    body: "Search centers that support day, night and emergency care for shift-working parents.",
  },
  {
    title: "Flexible plans",
    body: "Book by the hour, day or month. Compare pricing transparently before you commit.",
  },
  {
    title: "Real-time booking",
    body: "Send a booking request and get confirmation from the center — no overbooking.",
  },
  {
    title: "Live CCTV viewing",
    body: "Watch your child's play area any time while your booking or subscription is active.",
  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 py-8 md:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
            Trusted 24×7 Childcare
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Safe, reliable childcare — any hour of the day.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Little Steps connects working parents with verified daycare centers
            and caregivers. Search, compare and book flexible childcare in a few
            clicks.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/centers"
              className="rounded-lg bg-rose-500 px-5 py-3 font-medium text-white hover:bg-rose-600"
            >
              Find childcare near me
            </Link>
            <Link
              href="/register?role=PROVIDER"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-100"
            >
              List your center
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rose-400 to-orange-300 p-8 text-white shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["24×7", "Round-the-clock care"],
              ["Verified", "Background-checked"],
              ["Flexible", "Hourly / daily / monthly"],
              ["Transparent", "Upfront pricing"],
            ].map(([h, s]) => (
              <div key={h} className="rounded-xl bg-white/20 p-4 backdrop-blur">
                <div className="text-2xl font-bold">{h}</div>
                <div className="text-sm opacity-90">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Why parents choose Little Steps</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
