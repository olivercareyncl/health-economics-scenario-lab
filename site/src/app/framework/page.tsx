import Link from "next/link";
import {
  ArrowRightLeft,
  BrainCircuit,
  Clock3,
  GitBranch,
  Layers3,
  Search,
  ShieldPlus,
  Sparkles,
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
    icon: Sparkles,
  },
  {
    name: "Improve Access",
    description: "Reduce delay, backlog, and misallocation.",
    icon: Clock3,
  },
  {
    name: "Redesign Flow",
    description: "Remove inefficiency within pathways.",
    icon: GitBranch,
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

const modelSteps = [
  "Population at risk",
  "Intervention coverage",
  "Baseline event risk",
  "Effect size",
  "Events avoided",
  "System savings",
  "Intervention cost",
  "Net system value",
] as const;

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}

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
          <SectionHeading icon={Sparkles} title="Core question" />
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
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

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <SectionHeading icon={Layers3} title="Seven routes to system value" />
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            The sandboxes are organised around recurring ways healthcare systems
            create value. Different interventions may look very different in
            practice, but they often work through the same small number of
            underlying mechanisms.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <SectionHeading icon={GitBranch} title="The intervention value model" />
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            Across the lab, value is explored through a shared model. A
            population is defined, baseline risk is estimated, an intervention
            is applied, and the effect on events, system savings, and delivery
            cost is examined.
          </p>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">
            This creates a consistent way to test thresholds, compare
            assumptions, and see where a case is strong or fragile.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-700">
            {modelSteps.map((item) => (
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
          <SectionHeading icon={ArrowRightLeft} title="From idea to decision" />
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            The framework is applied across the live library of sandboxes. Each
            module explores a different intervention archetype, such as falls
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
              View decision walkthroughs
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <SectionHeading icon={BrainCircuit} title="Boundaries of use" />
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
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