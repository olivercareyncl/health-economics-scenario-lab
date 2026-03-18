import SandboxCard from "@/components/sandbox-card";
import { apps } from "@/data/apps";

const categoryOrder = [
  "Prevent Need",
  "Detect Earlier",
  "Stabilise Risk",
  "Improve Access",
  "Redesign Flow",
  "Shift Care Setting",
  "Improve Decisions",
];

export default function SandboxesPage() {
  const groupedApps = categoryOrder
    .map((category) => ({
      category,
      apps: apps.filter((app) => app.category === category),
    }))
    .filter((group) => group.apps.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        Sandbox library
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Explore the sandbox library
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
        Each sandbox focuses on a different intervention archetype, but all are
        built to support earlier-stage thinking about thresholds, trade-offs,
        and value under uncertainty.
      </p>

      <div className="mt-12 space-y-14">
        {groupedApps.map((group) => (
          <section key={group.category}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">
                {group.category}
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                {getCategoryDescription(group.category)}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {group.apps.map((app) => (
                <SandboxCard key={app.slug} app={app} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function getCategoryDescription(category: string) {
  switch (category) {
    case "Prevent Need":
      return "Interventions designed to reduce avoidable events before they happen.";
    case "Detect Earlier":
      return "Interventions that shift patients to earlier and potentially less costly states.";
    case "Stabilise Risk":
      return "Interventions aimed at reducing deterioration, crisis events, and unplanned activity.";
    case "Improve Access":
      return "Interventions that reduce delay, backlog, or escalation caused by constrained access.";
    case "Redesign Flow":
      return "Interventions that change how pathways operate in order to improve efficiency and value.";
    case "Shift Care Setting":
      return "Interventions that move care from higher-cost to lower-intensity settings.";
    case "Improve Decisions":
      return "Interventions that improve triage, prioritisation, and decision quality.";
    default:
      return "A set of related decision sandboxes.";
  }
}