import SandboxCard from "@/components/sandbox-card";
import { apps } from "@/data/apps";

export default function SandboxesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        Sandbox library
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Explore the current modules
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
        Each sandbox focuses on a different intervention archetype, but all are
        built to support earlier-stage thinking about thresholds, trade-offs,
        and value under uncertainty.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => (
          <SandboxCard key={app.slug} app={app} />
        ))}
      </div>
    </div>
  );
}