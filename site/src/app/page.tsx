import Link from "next/link";
import { Github, Layers3, LayoutGrid, Route } from "lucide-react";
import DemoSlider from "@/components/demo-slider";
import RoutesGrid from "@/components/routes-grid";
import SandboxCard from "@/components/sandbox-card";
import EmbeddedSandboxPreview from "@/components/embedded-sandbox-preview";
import { apps, GITHUB_URL } from "@/data/apps";

export default function HomePage() {
  const liveApps = apps.filter((app) => app.status === "Live").slice(0, 2);
  const plannedApps = apps
    .filter((app) => app.status === "Planned")
    .map((app) => app.name);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <section className="pb-16">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Decision sandboxes for healthcare strategy
        </p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950">
          Explore how healthcare interventions generate value under uncertainty.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Health Economics Scenario Lab is a suite of lightweight interactive
          decision sandboxes for exploring how interventions and service changes
          might affect activity, cost, outcomes, and value before ideas harden
          into static business cases.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/sandboxes"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.8} />
            Explore sandboxes
          </Link>
          <Link
            href="/framework"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
            <Layers3 className="h-4 w-4" strokeWidth={1.8} />
            View framework
          </Link>
          <Link
            href="/how-to-use"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
            <Route className="h-4 w-4" strokeWidth={1.8} />
            How to use the lab
          </Link>
          <Link
            href={GITHUB_URL}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
            <Github className="h-4 w-4" strokeWidth={1.8} />
            View GitHub
          </Link>
        </div>

        <div className="mt-8 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          These tools are exploratory and illustrative. They are designed to
          support earlier-stage decision thinking, not replace formal economic
          evaluation or local validation.
        </div>
      </section>

      <div className="space-y-20">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Method
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                A simple intervention value model
              </h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                The sandboxes are built around a simple question: what would need
                to be true for this intervention to create value? In practice that
                usually comes down to scale, risk, effect size, and delivery cost.
              </p>
            </div>

            <Link
              href="/framework"
              className="text-sm font-medium text-slate-700"
            >
              Read the framework →
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-700">
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

        <RoutesGrid />

        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Live sandboxes
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Current library
              </h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                Each sandbox explores a different intervention archetype while
                using the same broad logic: population, risk, effect size,
                delivery cost, and value.
              </p>
            </div>

            <Link
              href="/sandboxes"
              className="text-sm font-medium text-slate-700"
            >
              View all →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {liveApps.map((app) => (
              <SandboxCard key={app.slug} app={app} />
            ))}
          </div>
        </section>

        <DemoSlider />

        <EmbeddedSandboxPreview />

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                In practice
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                From idea to decision
              </h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                The lab is designed to help structure an intervention idea,
                translate it into assumptions, test uncertainty, and clarify
                what would need to be true for value to appear.
              </p>
            </div>

            <Link
              href="/how-to-use"
              className="text-sm font-medium text-slate-700"
            >
              View walkthrough →
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
                routes to system value, including care setting shift and
                decision support.
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