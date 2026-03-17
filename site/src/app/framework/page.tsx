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

      <section className="mt-12 space-y-8">
        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Core question</h2>
          <p className="mt-3 text-slate-600">
            The key question is not simply whether an intervention sounds
            worthwhile, but what would need to be true for it to generate value
            in a real system.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Basic structure</h2>
          <p className="mt-3 text-slate-600">
            Most sandboxes in the lab follow the same broad logic:
            population reached, baseline event risk, intervention effect, and
            delivery cost combine to determine whether value appears.
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
                className="rounded-full border border-slate-200 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Seven routes to system value</h2>
          <p className="mt-3 text-slate-600">
            The sandboxes are organised around recurring ways healthcare systems
            create value.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
            {[
              "Prevent Need",
              "Detect Earlier",
              "Stabilise Risk",
              "Improve Access",
              "Redesign Flow",
              "Shift Care Setting",
              "Improve Decisions",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Why decision sandboxes?</h2>
          <p className="mt-3 text-slate-600">
            Static models are useful for formal evaluation, but they are often
            poor tools for exploration. Decision sandboxes make assumptions
            visible and adjustable so users can test thresholds, fragility, and
            strategic plausibility.
          </p>
        </div>
      </section>
    </div>
  );
}