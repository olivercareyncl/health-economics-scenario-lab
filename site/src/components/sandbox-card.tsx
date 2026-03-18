import Link from "next/link";
import type { AppItem } from "@/data/apps";
import { getRouteStyle } from "@/lib/route-styles";

export default function SandboxCard({ app }: { app: AppItem }) {
  const isLive = app.status === "Live";
  const primaryHref = isLive ? app.liveUrl : "/sandboxes";
  const primaryLabel = isLive ? "Open sandbox" : "Coming soon";
  const routeStyle = getRouteStyle(app.category);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${routeStyle.pill}`}
        >
          {app.category}
        </span>
        <span className="text-xs text-slate-500">{app.status}</span>
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight">{app.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{app.descriptor}</p>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Key question
        </p>
        <p className="mt-2 text-sm text-slate-800">{app.question}</p>
      </div>

      <p className="mt-4 text-sm text-slate-600">{app.shortDescription}</p>

      <div className="mt-6 flex gap-3">
        <Link
          href={primaryHref}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            isLive
              ? "bg-slate-900 text-white"
              : "border border-slate-300 text-slate-700"
          }`}
        >
          {primaryLabel}
        </Link>

        <Link
          href={app.githubUrl}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          GitHub
        </Link>
      </div>
    </article>
  );
}