import Link from "next/link";
import { notFound } from "next/navigation";
import { apps } from "@/data/apps";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = apps.find((item) => item.slug === slug);

  if (!app) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to home
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            App
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {app.name}
          </h1>
          <p className="mt-2 text-lg text-slate-500">{app.descriptor}</p>
          <p className="mt-6 leading-8 text-slate-600">{app.longDescription}</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <img
            src={app.image}
            alt={app.name}
            className="w-full object-cover"
          />
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            What you can test
          </h2>
          <ul className="mt-5 space-y-3 text-slate-600">
            {app.bullets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={app.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Open live app
          </a>
          <a
            href={app.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View code
          </a>
        </div>

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-lg font-semibold text-amber-900">Disclaimer</h3>
          <p className="mt-3 leading-7 text-amber-900/80">
            This is an illustrative sandbox, not a formal economic evaluation.
          </p>
        </div>
      </div>
    </main>
  );
}