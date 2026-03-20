import Link from "next/link";
import { Github, Layers3, LayoutGrid, Route } from "lucide-react";
import RoutesGrid from "@/components/routes-grid";
import SandboxCard from "@/components/sandbox-card";
import { apps, GITHUB_URL } from "@/data/apps";

export default function HomePage() {
  const liveApps = apps.filter((app) => app.status === "Live").slice(0, 2);
  const plannedApps = apps
    .filter((app) => app.status === "Planned")
    .map((app) => app.name);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <section className="pb-12 md:pb-16">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Open decision sandboxes for healthcare strategy
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          Explore how healthcare interventions generate value under uncertainty.
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 md:hidden">
          Health Economics Scenario Lab is an open analytical project exploring
          how interventions and service changes might affect activity, cost,
          outcomes, and value before ideas harden into static business cases.
        </p>

        <p className="mt-6 hidden max-w-3xl text-base leading-8 text-slate-600 md:block md:text-lg">
          Health Economics Scenario Lab is an open analytical project exploring
          how healthcare interventions and service changes might affect activity,
          cost, outcomes, and value before ideas harden into static business
          cases.
        </p>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Built by Oliver Carey as a practical exploration of healthcare
          strategy, health economics, and interactive decision support.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href="/sandboxes"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.8} />
            Explore sandboxes
          </Link>
          <Link
            href="/framework"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            <Layers3 className="h-4 w-4" strokeWidth={1.8} />
            View framework
          </Link>
          <Link
            href="/how-to-use"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            <Route className="h-4 w-4" strokeWidth={1.8} />
            How to use the lab
          </Link>
          <Link
            href={GITHUB_URL}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            <Github className="h-4 w-4" strokeWidth={1.8} />
            View GitHub
          </Link>
        </div>

        <div className="mt-8 hidden max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 md:block">
          These tools are exploratory and illustrative. They are designed to
          support earlier-stage decision thinking, not replace formal economic
          evaluation, detailed service modelling, or local validation.
        </div>
      </section>

      <div className="space-y-16 md:space-y-20">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                About the project
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                A practical model for thinking more clearly
              </h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                The lab is built around a simple question: what would need to be
                true for an intervention to create value? In practice, that
                usually comes down to scale, baseline risk, effect size,
                persistence, and delivery cost.
              </p>
            </div>

            <Link
              href="/about"
              className="text-sm font-medium text-slate-700"
            >
              Read more about the lab →
            </Link>
          </div>

          <div className="mt-6 hidden flex-wrap gap-3 text-sm text-slate-700 md:flex">
            {[
              "Population at risk",
              "Coverage",
              "Baseline event risk",
              "Effect size",
              "Events avoided",
              "Gross savings",
              "Intervention cost",
              "Net value",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Live sandboxes
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Current library
              </h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                Open the live modules and explore how different intervention
                types behave under different assumptions.
              </p>
            </div>

            <Link
              href="/sandboxes"
              className="text-sm font-medium text-slate-700"
            >
              View all sandboxes →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {liveApps.map((app) => (
              <SandboxCard key={app.slug} app={app} />
            ))}
          </div>
        </section>

        <div className="hidden md:block">
          <RoutesGrid />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                In practice
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                From idea to decision
              </h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                The lab helps structure an intervention idea, translate it into
                explicit assumptions, test uncertainty, and clarify what would
                need to be true before a stronger case can be made.
              </p>
            </div>

            <Link
              href="/how-to-use"
              className="text-sm font-medium text-slate-700"
            >
              See how it works →
            </Link>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Next up
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Planned modules
              </h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                The next wave of modules expands the framework across additional
                routes to system value, including care setting shift, proactive
                management, and decision support.
              </p>
            </div>

            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
              {plannedApps.length} planned
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {plannedApps.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}