import Link from "next/link";
import DemoSlider from "@/components/demo-slider";
import RoutesGrid from "@/components/routes-grid";
import SandboxCard from "@/components/sandbox-card";
import { apps, GITHUB_URL } from "@/data/apps";

export default function HomePage() {
  const liveApps = apps.filter((app) => app.status === "Live");
  const plannedApps = ["StableHeart", "SteadyLungs", "KidneyKind", "DiabetesForward"];

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
          sandboxes for testing how interventions and service changes might
          affect activity, cost, outcomes, and value before ideas harden into
          static business cases.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/sandboxes"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Explore sandboxes
          </Link>
          <Link
            href="/framework"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
            View framework
          </Link>
          <Link
            href={GITHUB_URL}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
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
        <DemoSlider />
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
                using the same broad logic: population, risk, effect, cost, and
                value.
              </p>
            </div>

            <Link href="/sandboxes" className="text-sm font-medium text-slate-700">
              View all →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {liveApps.map((app) => (
              <SandboxCard key={app.slug} app={app} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Method
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            A simple intervention value model
          </h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            The sandboxes are built around a simple question: what would need to
            be true for this intervention to create value? In practice that
            usually comes down to scale, risk, effect size, and delivery cost.
          </p>

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

        <section>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Next up
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Planned modules
          </h2>
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