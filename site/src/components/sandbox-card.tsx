import Link from "next/link";
import type { AppItem } from "@/data/apps";

export default function SandboxCard({ app }: { app: AppItem }) {
  const isLive = app.status === "Live";
  const primaryHref = isLive ? app.liveUrl : "/sandboxes";
  const primaryLabel = isLive ? "Open sandbox" : "Coming soon";
  const isExternal = isLive && primaryHref.startsWith("http");

  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {app.category}
        </span>
        <span className="text-xs font-medium text-slate-500">{app.status}</span>
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
        {app.name}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{app.descriptor}</p>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Key question
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-800">{app.question}</p>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">
        {app.shortDescription}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
          className={`inline-flex rounded-xl px-4 py-2 text-sm font-medium transition ${
            isLive
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {primaryLabel}
        </Link>

        <Link
          href={app.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          GitHub
        </Link>
      </div>
    </article>
  );
}