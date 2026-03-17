import Link from "next/link";
import type { AppItem } from "@/data/apps";

export default function SandboxCard({ app }: { app: AppItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {app.category}
        </span>
        <span className="text-xs text-slate-500">{app.status}</span>
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight">{app.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{app.descriptor}</p>

      <p className="mt-4 text-sm text-slate-700">{app.question}</p>
      <p className="mt-3 text-sm text-slate-600">{app.shortDescription}</p>

      <div className="mt-6 flex gap-3">
        <Link
          href={app.liveUrl === "#" ? "/sandboxes" : app.liveUrl}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Open sandbox
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