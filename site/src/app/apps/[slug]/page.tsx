import Image from "next/image";
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
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to home
        </Link>

        <div className="mt-8 max-w-4xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {app.category}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
              {app.status}
            </span>
          </div>

          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            App
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {app.name}
          </h1>
          <p className="mt-2 text-lg text-slate-500">{app.descriptor}</p>

          <p className="mt-6 text-lg font-medium leading-8 text-slate-900">
            {app.question}
          </p>

          <p className="mt-6 leading-8 text-slate-600">{app.longDescription}</p>

          <div className="mt-8 flex flex-wrap gap-3">
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
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-sm leading-7 text-slate-700">
            <span className="font-semibold text-slate-900">Why this matters:</span>{" "}
            {app.whyItMatters}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Image
            src={app.image}
            alt={app.name}
            width={1600}
            height={900}
            className="w-full object-cover"
          />
        </div>
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              What you can test
            </h2>
            <ul className="mt-5 space-y-3 text-slate-600">
              {app.bullets.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold tracking-tight">
              How to read this tool
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              This app is designed for exploratory decision support. It is most
              useful when the question is not whether a case is already proven,
              but what would need to be true for it to look convincing.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              It can help test assumptions, compare scenarios, explore
              thresholds, and surface what should be validated next.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h3 className="text-lg font-semibold text-amber-900">Important</h3>
            <p className="mt-3 leading-7 text-amber-900/80">
              This is an illustrative sandbox, not a formal economic
              evaluation. It should not be used for real-world decisions without
              local validation, local costing review, and appropriate clinical
              and operational input.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{app.name} · Built by Oliver Carey</p>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <Link href="/about" className="hover:text-slate-900">
              About
            </Link>
            <a
              href={app.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}