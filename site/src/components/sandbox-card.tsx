import Link from "next/link";
import type { AppItem } from "@/data/apps";

export default function SandboxCard({ app }: { app: AppItem }) {
  const isLive = app.status === "Live";
  const primaryHref = isLive ? app.liveUrl : "/sandboxes";
  const primaryLabel = isLive ? "Open sandbox" : "Coming soon";
  const isExternal = isLive && primaryHref.startsWith("http");

  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {app.category}
        </span>
        <span className="text-xs font-medium text-slate-500">{app.status}</span>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
        {app.name}
      </h3>

      <p className="mt-1 hidden text-sm text-slate-500 md:block">
        {app.descriptor}
      </p>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Key question
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-800">{app.question}</p>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">
        {app.shortDescription}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={primaryHref}
          {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition sm:w-auto ${
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
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          GitHub
        </Link>
      </div>
    </article>
  );
}