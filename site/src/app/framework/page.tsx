import Link from "next/link";
import {
  ArrowRightLeft,
  BrainCircuit,
  Clock3,
  HeartPulse,
  Search,
  ShieldPlus,
  Workflow,
} from "lucide-react";

const routes = [
  {
    name: "Prevent Need",
    description: "Reduce avoidable events before they happen.",
    icon: ShieldPlus,
  },
  {
    name: "Detect Earlier",
    description: "Shift patients into earlier and less costly states.",
    icon: Search,
  },
  {
    name: "Stabilise Risk",
    description: "Reduce deterioration and unplanned activity.",
    icon: HeartPulse,
  },
  {
    name: "Improve Access",
    description: "Reduce delay, backlog, and misallocation.",
    icon: Clock3,
  },
  {
    name: "Redesign Flow",
    description: "Remove inefficiency within pathways.",
    icon: Workflow,
  },
  {
    name: "Shift Care Setting",
    description: "Substitute higher-cost care with lower-intensity care.",
    icon: ArrowRightLeft,
  },
  {
    name: "Improve Decisions",
    description: "Improve triage, prioritisation, and clinical choices.",
    icon: BrainCircuit,
  },
] as const;

export default function FrameworkPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        Framework
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
        The intervention value model
      </h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
        Most healthcare interventions can be explored using the same broad
        structure: a population at risk, an intervention applied to part of that
        population, a change in events, and a resulting effect on cost and
        value.
      </p>

      <section className="mt-12 space-y-8 md:space-y-10">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">Core question</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            The key question is not simply whether an intervention sounds
            worthwhile, but what would need to be true for it to generate value
            in a real system.
          </p>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            The lab is designed to help structure an intervention idea,
            translate it into explicit assumptions, and clarify the conditions
            required for value to appear before ideas harden into static
            business cases.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">Seven routes to system value</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            The sandboxes are organised around recurring ways healthcare systems
            create value. Different interventions may look very different in
            practice, but they often work through the same small number of
            underlying mechanisms.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <div
                  key={route.name}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {route.name}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {route.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 group">
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-800">
              <span className="inline-flex items-center gap-2">
                Read more about the seven routes
                <span className="text-slate-400 transition group-open:rotate-180">
                  ↓
                </span>
              </span>
            </summary>

            <div className="mt-5 space-y-6 text-slate-600">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Why the routes matter
                </h3>
                <p className="mt-2 leading-8">
                  Most healthcare transformation strategies create value through
                  a small number of recurring mechanisms. The routes help make
                  that logic more explicit, so teams can ask not just whether an
                  intervention sounds promising, but how it is expected to
                  generate value.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    1. Prevent Need
                  </h3>
                  <p className="mt-2 leading-8">
                    This route focuses on reducing avoidable events before they
                    happen. The value case depends on whether the cost of
                    prevention is offset by meaningful reductions in downstream
                    acute activity.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    2. Detect Earlier
                  </h3>
                  <p className="mt-2 leading-8">
                    This route creates value by shifting patients into earlier,
                    less acute, and potentially less costly states. The key
                    question is whether earlier detection genuinely changes
                    outcomes and total pathway cost.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    3. Stabilise Risk
                  </h3>
                  <p className="mt-2 leading-8">
                    This route focuses on proactive management to reduce
                    deterioration and unplanned activity. The value logic is
                    about preventing crisis events and avoiding the
                    highest-cost parts of the system.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    4. Improve Access
                  </h3>
                  <p className="mt-2 leading-8">
                    This route focuses on reducing delay, backlog, and friction
                    in access to care. The strategic question is whether an
                    intervention creates real system value or simply increases
                    throughput without reducing downstream pressure.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    5. Redesign Flow
                  </h3>
                  <p className="mt-2 leading-8">
                    This route aims to remove inefficiency within existing care
                    pathways. The focus is not just on doing more, but on
                    changing the pathway so that activity, follow-up burden, or
                    bed use are reduced.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    6. Shift Care Setting
                  </h3>
                  <p className="mt-2 leading-8">
                    This route generates value by substituting higher-cost care
                    with lower-intensity alternatives where appropriate. The
                    value case depends on whether care can genuinely be shifted
                    without recreating cost elsewhere.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    7. Improve Decisions
                  </h3>
                  <p className="mt-2 leading-8">
                    This route focuses on improving triage, prioritisation, and
                    clinical choice. It is often cross-cutting, because better
                    decisions can improve how patients are routed, matched, and
                    managed across several other routes.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Why categorising value helps
                </h3>
                <p className="mt-2 leading-8">
                  Categorising an intervention by route helps make its value
                  logic more testable. It moves the conversation from a general
                  improvement ambition to a clearer statement of how the
                  intervention is actually expected to create system value.
                </p>
              </div>
            </div>
          </details>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">The intervention value model</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            Across the lab, value is explored through a shared model. A
            population is defined, baseline risk is estimated, an intervention
            is applied, and the effect on events, system savings, and delivery
            cost is examined.
          </p>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            This creates a consistent way to test thresholds, compare
            assumptions, and see where a case is strong or fragile.
          </p>

          <div className="mt-8">
            <div className="block md:hidden">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="space-y-4">
                  <ModelStep
                    title="Population"
                    body="Define the eligible population and the proportion reached."
                  />
                  <ArrowVertical />
                  <ModelStep
                    title="Risk"
                    body="Estimate baseline event risk without intervention."
                  />
                  <ArrowVertical />
                  <ModelStep
                    title="Effect size"
                    body="Model the expected reduction in events."
                  />
                  <ArrowVertical />
                  <ModelStep
                    title="Impact and value"
                    body="Translate events avoided into savings, cost, and net value."
                  />
                </div>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[980px] rounded-2xl border border-slate-200 bg-white p-6">
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-4">
                  <ModelStep
                    title="Population"
                    body="Define the eligible population and the proportion reached."
                  />
                  <Arrow />
                  <ModelStep
                    title="Risk"
                    body="Estimate baseline event risk without intervention."
                  />
                  <Arrow />
                  <ModelStep
                    title="Effect size"
                    body="Model the expected reduction in events."
                  />
                  <Arrow />
                  <ModelStep
                    title="Impact and value"
                    body="Translate events avoided into savings, cost, and net value."
                  />
                </div>
              </div>
            </div>
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 group">
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-800">
              <span className="inline-flex items-center gap-2">
                Read more about the intervention value model
                <span className="text-slate-400 transition group-open:rotate-180">
                  ↓
                </span>
              </span>
            </summary>

            <div className="mt-5 space-y-6 text-slate-600">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  1. Defining scale: population and coverage
                </h3>
                <p className="mt-2 leading-8">
                  The model begins with the population at risk: the total group
                  eligible for an intervention. Because no service reaches every
                  patient, the model then applies an intervention coverage
                  assumption, representing the realistic proportion of that
                  population the programme is expected to reach.
                </p>
                <p className="mt-2 leading-8">
                  Together, these assumptions define the practical ceiling for
                  the intervention’s impact.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  2. Measuring potential: baseline risk and effect size
                </h3>
                <p className="mt-2 leading-8">
                  Once scale is defined, the model considers baseline event
                  risk: the expected frequency of the negative outcome without
                  intervention. That might be a fall, an admission, a crisis
                  event, or another form of system activity.
                </p>
                <p className="mt-2 leading-8">
                  Effect size then represents the anticipated reduction in those
                  events attributable to the intervention. This allows users to
                  test whether value depends more on targeting high-risk groups,
                  achieving a strong effect, or some combination of both.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  3. Calculating impact: events avoided and gross savings
                </h3>
                <p className="mt-2 leading-8">
                  The interaction between scale, risk, and effect produces the
                  modelled number of events avoided. This is the primary system
                  impact measure.
                </p>
                <p className="mt-2 leading-8">
                  To translate that impact into economic terms, the model
                  applies a cost per event. This produces gross system savings:
                  the estimated avoided cost associated with reducing activity.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  4. The economic reality: intervention cost and net value
                </h3>
                <p className="mt-2 leading-8">
                  The model then introduces intervention cost, representing the
                  resource required to deliver the programme at the chosen
                  scale.
                </p>
                <p className="mt-2 leading-8">
                  Net value is the result of gross savings minus intervention
                  cost. This gives a bottom-line view of whether the
                  intervention appears cost-saving, cost-neutral, or likely to
                  require net investment under the selected assumptions.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Why this matters for strategy
                </h3>
                <p className="mt-2 leading-8">
                  The purpose of the model is not to produce a single definitive
                  answer. It is to create a decision sandbox in which strategy
                  teams can test assumptions, explore break-even points, and
                  clarify the specific conditions required for value to appear.
                </p>
                <p className="mt-2 leading-8">
                  In practice, that means making it easier to ask better
                  questions earlier: how much effect is needed, how much cost is
                  tolerable, where the fragility sits, and what should be
                  validated next.
                </p>
              </div>
            </div>
          </details>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">From idea to decision</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            The framework is applied across the live library of sandboxes. Each
            module explores a different intervention context, such as falls
            prevention, earlier diagnosis, waiting list strategy, pathway
            redesign, frailty support, or cardiovascular prevention.
          </p>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            What changes from module to module is the intervention context. What
            stays the same is the decision structure: assumptions, system
            impact, thresholds, uncertainty, and interpretation.
          </p>

          <div className="mt-4">
            <Link
              href="/how-to-use"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              See how it works
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold">Boundaries of use</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            These tools are exploratory and illustrative. They are designed to
            support earlier-stage thinking and make assumptions more transparent,
            not to replace formal economic evaluation or local validation.
          </p>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            The code for the models is open and available on GitHub, so the
            underlying logic can be inspected rather than treated as a black box.
          </p>

          <div className="mt-4">
            <Link
              href="https://github.com/olivercareyncl/health-economics-scenario-lab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              View GitHub
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}

function ModelStep({
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