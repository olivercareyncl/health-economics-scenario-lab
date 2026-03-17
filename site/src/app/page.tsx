import Link from "next/link";
import { apps } from "@/data/apps";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Health Economics Scenario Lab
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Interactive sandboxes for exploring value under uncertainty.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            A collection of lightweight tools for testing how different
            interventions and service changes might affect cost, activity,
            outcomes, and value in healthcare.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#apps"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Explore apps
            </a>
            <a
              href="https://github.com/YOUR-USERNAME/health-economics-scenario-lab"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              Why this exists
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              A lot of early economic thinking still happens in static decks,
              rough spreadsheets, and loosely structured conversations. These
              tools are designed to make that stage more interactive,
              transparent, and testable — before a full formal model exists.
            </p>
          </div>
        </div>
      </section>

      <section id="apps" className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10">
            <h2 className="text-2xl font-semibold tracking-tight">Apps</h2>
            <p className="mt-3 text-slate-600">
              Each module focuses on a different healthcare decision problem,
              but follows the same broad sandbox approach.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {apps.map((app) => (
              <div
                key={app.slug}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={app.image}
                    alt={app.name}
                    className="h-44 w-full object-cover"
                  />
                </div>

                <h3 className="text-xl font-semibold">{app.name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {app.descriptor}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {app.shortDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={app.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Open app
                  </a>
                  <Link
                    href={`/apps/${app.slug}`}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Read more
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Built for early-stage thinking
              </h2>
              <p className="mt-4 leading-8 text-slate-600">
                These apps are designed as exploratory decision-support
                sandboxes, not formal economic evaluations. They are useful for
                testing assumptions, exploring thresholds, comparing strategies,
                and identifying what should be validated next.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="text-lg font-semibold text-amber-900">
                Important
              </h3>
              <p className="mt-3 leading-7 text-amber-900/80">
                These tools are illustrative only and should not be used for
                real-world decisions without local validation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}