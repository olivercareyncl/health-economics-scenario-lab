"use client";

import { useMemo } from "react";
import SandboxCard from "@/components/sandbox-card";
import { apps } from "@/data/apps";

const routeOrder = [
  "Prevent Need",
  "Detect Earlier",
  "Stabilise Risk",
  "Improve Access",
  "Redesign Flow",
  "Shift Care Setting",
  "Improve Decisions",
] as const;

type RouteName = (typeof routeOrder)[number];

export default function SandboxesPage() {
  const groupedApps = useMemo(() => {
    return routeOrder
      .map((route) => ({
        route,
        apps: apps.filter((app) => app.category === route),
      }))
      .filter((group) => group.apps.length > 0);
  }, []);

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

      <div className="mt-10">
        <p className="mb-3 text-sm font-medium text-slate-700">
          Jump to a route
        </p>
        <div className="flex flex-wrap gap-3">
          {groupedApps.map((group) => (
            <a
              key={group.route}
              href={`#${toAnchorId(group.route)}`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              {group.route} ({group.apps.length})
            </a>
          ))}
        </div>
      </div>

      <div className="mt-12 space-y-10">
        {groupedApps.map((group) => (
          <section
            key={group.route}
            id={toAnchorId(group.route)}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-8"
          >
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {group.route}
                </h2>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {group.apps.length}{" "}
                  {group.apps.length === 1 ? "sandbox" : "sandboxes"}
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                {getRouteDescription(group.route)}
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

function toAnchorId(route: string) {
  return route.toLowerCase().replace(/\s+/g, "-");
}

function getRouteDescription(route: string) {
  switch (route) {
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