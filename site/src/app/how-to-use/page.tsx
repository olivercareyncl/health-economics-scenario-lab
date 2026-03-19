import Link from "next/link";
import DemoSlider from "@/components/demo-slider";

export default function HowToUsePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        How to use the lab
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
        From idea to decision
      </h1>

      <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 md:hidden">
        A structured way to test what would need to be true for an intervention
        to create value.
      </p>

      <p className="mt-6 hidden max-w-3xl text-base leading-8 text-slate-600 md:block md:text-lg">
        The Health Economics Scenario Lab is designed to explore a simple
        question: what would need to be true for an intervention to create
        value?
      </p>

      <div className="mt-12 space-y-8 md:space-y-10">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">How the sandboxes are used</h2>

          <p className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
            Each sandbox helps structure assumptions, test value, and clarify
            what needs validating next.
          </p>

          <p className="mt-4 hidden max-w-3xl leading-8 text-slate-600 md:block">
            Each sandbox is not a final answer. It is a way of structuring
            assumptions, testing how value is generated, understanding where
            results are sensitive, and clarifying what needs validating next.
          </p>
        </section>

        <DemoSlider />

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">What this process does</h2>

          <p className="mt-4 hidden max-w-3xl leading-8 text-slate-600 md:block">
            Across different intervention types, the process is consistent.
          </p>

          <div className="mt-8">
            <div className="block md:hidden">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="space-y-4">
                  <ProcessStep
                    title="Intervention idea"
                    body="Start with a plausible service change or intervention."
                  />
                  <ArrowVertical />
                  <ProcessStep
                    title="Translate assumptions"
                    body="Turn the idea into explicit assumptions about scale, risk, effect, and cost."
                  />
                  <ArrowVertical />
                  <ProcessStep
                    title="Observe model signal"
                    body="Review the implied effect on events, cost, and value."
                  />
                  <ArrowVertical />
                  <ProcessStep
                    title="Test uncertainty"
                    body="Change assumptions to see where the case is robust or fragile."
                  />
                  <ArrowVertical />
                  <ProcessStep
                    title="Clarify what to validate"
                    body="Identify what matters most and what needs testing next."
                  />
                </div>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[1100px] rounded-2xl border border-slate-200 bg-white p-6">
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-4">
                  <ProcessStep
                    title="Intervention idea"
                    body="Start with a plausible service change or intervention."
                  />
                  <Arrow />
                  <ProcessStep
                    title="Translate assumptions"
                    body="Turn the idea into explicit assumptions about scale, risk, effect, and cost."
                  />
                  <Arrow />
                  <ProcessStep
                    title="Observe model signal"
                    body="Review the implied effect on events, cost, and value."
                  />
                  <Arrow />
                  <ProcessStep
                    title="Test uncertainty"
                    body="Change assumptions to see where the case is robust or fragile."
                  />
                  <Arrow />
                  <ProcessStep
                    title="Clarify what to validate"
                    body="Identify what matters most and what needs testing next."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              In practice
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Three example decision questions
            </h2>

            <p className="mt-3 hidden max-w-3xl text-slate-600 md:block">
              Different sandboxes focus on different intervention contexts, but
              the pattern is the same: define the base case, review the model
              signal, and test which assumptions matter most.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
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
              appHref="https://safestep-mnjcyn8idt5rrddqsmnncd.streamlit.app/"
              appLabel="Open sandbox"
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
              appHref="https://health-economics-scenario-lab-7nhwymodtxwru3ftvwhdoc.streamlit.app/"
              appLabel="Open sandbox"
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
              appHref="https://health-economics-scenario-lab-jvqybhvadqymamynbwmhov.streamlit.app/"
              appLabel="Open sandbox"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">What this process does not do</h2>
          <ul className="mt-4 space-y-2 text-slate-600">
            <li>It does not produce a final answer.</li>
            <li>It does not replace formal evaluation.</li>
            <li>It does not remove uncertainty.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">What it gives instead</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            A clearer decision.
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-lg font-medium tracking-tight text-slate-900">
              This is likely to work if these conditions hold.
            </p>
          </div>

          <p className="mt-4 hidden max-w-3xl leading-8 text-slate-600 md:block">
            In practice, this usually leads to targeted pilots, focused data
            collection, refinement of assumptions, or prioritisation against
            alternatives.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">One consistent question</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            Across all sandboxes, the same question sits underneath the model:
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-lg font-medium tracking-tight text-slate-900">
              What would need to be true for this to create value?
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProcessStep({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{body}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div
      className="flex items-center justify-center text-slate-300"
      aria-hidden="true"
    >
      <svg
        width="28"
        height="12"
        viewBox="0 0 28 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <path
          d="M1 6H25M25 6L20 1M25 6L20 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ArrowVertical() {
  return (
    <div
      className="flex items-center justify-center text-slate-300"
      aria-hidden="true"
    >
      <svg
        width="12"
        height="28"
        viewBox="0 0 12 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <path
          d="M6 1V25M6 25L1 20M6 25L11 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
  const isExternal = appHref.startsWith("http");

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          {tag}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight md:text-xl">
        {title}
      </h3>

      <div className="mt-6 flex flex-1 flex-col space-y-6">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Question
          </h4>
          <p className="mt-2 text-slate-700">{question}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Set the base case
          </h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {baseCase.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Review what the model suggests
          </h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {outputs.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Check what matters
          </h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {sensitivities.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Decision signal
          </h4>
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-slate-700">{signal}</p>
          </div>
        </div>

        <div className="pt-1">
          <Link
            href={appHref}
            {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:w-auto"
          >
            {appLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}