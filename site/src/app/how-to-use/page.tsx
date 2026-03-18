import Link from "next/link";

export default function HowToUsePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        How to use the lab
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        From idea to decision
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
        The Health Economics Scenario Lab is designed to explore a simple
        question: what would need to be true for an intervention to create
        value?
      </p>

      <section className="mt-12 space-y-8">
        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">How the sandboxes are used</h2>
          <p className="mt-3 text-slate-600">
            Each sandbox is not a final answer. It is a way of structuring
            assumptions, testing how value is generated, understanding where
            results are sensitive, and clarifying what needs validating next.
          </p>
        </div>

        <ExampleCard
          tag="Prevent Need"
          title="Falls prevention (SafeStep)"
          question="Can a falls prevention programme reduce admissions and bed use enough to create value?"
          baseCase={[
            "population size",
            "baseline risk",
            "intervention reach",
            "expected risk reduction",
            "cost per participant",
          ]}
          outputs={[
            "falls avoided",
            "admissions avoided",
            "bed days avoided",
            "net cost",
            "cost per QALY",
          ]}
          sensitivities={[
            "effectiveness",
            "engagement",
            "delivery cost",
            "targeting of higher-risk groups",
          ]}
          signal="The programme appears valuable if it meaningfully reduces falls in a sufficiently high-risk population at a controlled delivery cost."
          appHref="/sandboxes"
          appLabel="Open SafeStep"
        />

        <ExampleCard
          tag="Improve Access"
          title="Waiting list optimisation (WaitWise)"
          question="Can waiting list interventions reduce pressure without simply shifting activity elsewhere?"
          baseCase={[
            "size of waiting list",
            "proportion suitable for removal or redirection",
            "downstream activity assumptions",
            "delivery cost",
          ]}
          outputs={[
            "waiting list reduction",
            "escalations avoided",
            "admissions avoided",
            "cost impact",
            "overall value signal",
          ]}
          sensitivities={[
            "avoidable activity",
            "downstream pathway costs",
            "sustainability of change",
          ]}
          signal="Value is created only if unnecessary activity is genuinely reduced, not redistributed."
          appHref="/sandboxes"
          appLabel="Open WaitWise"
        />

        <ExampleCard
          tag="Prevent Need"
          title="Cardiovascular prevention (StableHeart)"
          question="Can proactive cardiovascular management reduce enough recurrent events to generate value?"
          baseCase={[
            "eligible population",
            "baseline event risk",
            "reach and engagement",
            "risk reduction",
            "intervention cost",
          ]}
          outputs={[
            "events avoided",
            "admissions avoided",
            "bed days avoided",
            "net cost",
            "cost per QALY",
          ]}
          sensitivities={[
            "achievable risk reduction",
            "sustained engagement",
            "targeting strategy",
            "cost per patient",
          ]}
          signal="The intervention creates value if risk reduction is real, sustained, and concentrated in higher-risk patients."
          appHref="/sandboxes"
          appLabel="Open StableHeart"
        />

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">What this process does</h2>
          <p className="mt-3 text-slate-600">
            Across different interventions, the process is consistent:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Define a plausible intervention",
              "Translate it into assumptions",
              "Observe the implied value",
              "Test uncertainty",
              "Identify key dependencies",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">What this process does not do</h2>
          <ul className="mt-4 space-y-2 text-slate-600">
            <li>It does not produce a final answer.</li>
            <li>It does not replace formal evaluation.</li>
            <li>It does not remove uncertainty.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">What it gives instead</h2>
          <p className="mt-3 text-slate-600">
            A clearer decision:
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-lg font-medium tracking-tight text-slate-900">
              This is likely to work if these conditions hold.
            </p>
          </div>
          <p className="mt-4 text-slate-600">
            In practice, that usually leads to targeted pilots, focused data
            collection, refinement of assumptions, or prioritisation against
            alternatives.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">One consistent question</h2>
          <p className="mt-3 text-slate-600">
            Across all sandboxes:
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-lg font-medium tracking-tight text-slate-900">
              What would need to be true for this to create value?
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExampleCard({
  tag,
  title,
  question,
  baseCase,
  outputs,
  sensitivities,
  signal,
  appHref,
  appLabel,
}: {
  tag: string;
  title: string;
  question: string;
  baseCase: string[];
  outputs: string[];
  sensitivities: string[];
  signal: string;
  appHref: string;
  appLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          {tag}
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold">{title}</h2>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Question
          </h3>
          <p className="mt-2 text-slate-700">{question}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Set the base case
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {baseCase.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Review what the model suggests
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {outputs.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Check what matters
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sensitivities.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Decision signal
          </h3>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-slate-700">{signal}</p>
          </div>
        </div>

        <div className="pt-1">
          <Link
            href={appHref}
            className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {appLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}