import Link from "next/link";

const routes = [
  "Prevent Need",
  "Detect Earlier",
  "Stabilise Risk",
  "Improve Access",
  "Redesign Flow",
  "Shift Care Setting",
  "Improve Decisions",
] as const;

export default function FrameworkPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        Framework
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        The intervention value model
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
        Most healthcare interventions can be explored using the same broad
        structure: a population at risk, an intervention applied to part of that
        population, a change in events, and a resulting effect on cost and value.
      </p>

      <section className="mt-12 space-y-10">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold">Core question</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            The key question is not simply whether an intervention sounds
            worthwhile, but what would need to be true for it to generate value
            in a real system.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold">Basic structure</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            Most sandboxes in the lab follow the same broad logic: population
            reached, baseline event risk, intervention effect, and delivery cost
            combine to determine whether value appears.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
            {[
              "Population at risk",
              "Intervention coverage",
              "Baseline event risk",
              "Effect size",
              "Events avoided",
              "System savings",
              "Intervention cost",
              "Net system value",
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

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold">How value appears</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            Across the sandboxes, value usually emerges through the same chain:
            a population is identified, risk is estimated, an intervention is
            applied, events are avoided, and those avoided events translate into
            system impact and economic value.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
            {[
              "Population",
              "Risk",
              "Intervention",
              "Effect",
              "Events avoided",
              "Cost change",
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

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold">Seven routes to system value</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            The sandboxes are organised around recurring ways healthcare systems
            create value.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
            {routes.map((route) => (
              <span
                key={route}
                className="rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                {route}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold">Different modules, shared logic</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            SafeStep, ClearPath, WaitWise, PathShift, FrailtyForward, and
            StableHeart explore different intervention archetypes, but they use
            the same broad decision structure: assumptions, system impact,
            thresholds, uncertainty, and interpretation.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold">Why decision sandboxes?</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            Static models are useful for formal evaluation, but they are often
            poor tools for exploration. Decision sandboxes make assumptions
            visible and adjustable so users can test thresholds, fragility, and
            strategic plausibility.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold">From framework to use</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            The framework explains the shared structure. The next step is seeing
            how that structure is used in practice to test an intervention idea.
          </p>
          <div className="mt-4">
            <Link
              href="/how-to-use"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              View decision walkthroughs
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}