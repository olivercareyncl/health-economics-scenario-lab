"use client";

import { useMemo, useState } from "react";
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
type FilterValue = "All routes" | RouteName;

export default function SandboxesPage() {
  const [selectedRoute, setSelectedRoute] =
    useState<FilterValue>("All routes");

  const groupedApps = useMemo(() => {
    const groups = routeOrder
      .map((route) => ({
        route,
        apps: apps.filter((app) => app.category === route),
      }))
      .filter((group) => group.apps.length > 0);

    if (selectedRoute === "All routes") {
      return groups;
    }

    return groups.filter((group) => group.route === selectedRoute);
  }, [selectedRoute]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
        Sandbox library
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
        Explore the sandbox library
      </h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
        Each sandbox focuses on a different intervention context, but all are
        designed to support earlier-stage thinking about thresholds,
        trade-offs, and value under uncertainty.
      </p>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Filter
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Browse by route
            </h2>
            <p className="mt-3 max-w-3xl text-slate-600">
              View the full library or focus on a specific route to system
              value.
            </p>
          </div>

          <div className="w-full md:w-[320px]">
            <label
              htmlFor="route-filter"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Route
            </label>
            <select
              id="route-filter"
              value={selectedRoute}
              onChange={(e) =>
                setSelectedRoute(e.target.value as FilterValue)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            >
              <option value="All routes">All routes</option>
              {routeOrder.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="mt-12 space-y-8 md:space-y-10">
        {groupedApps.map((group) => (
          <section
            key={group.route}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8"
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

function getRouteDescription(route: string) {
  switch (route) {
    case "Prevent Need":
      return "Reduce avoidable events before they happen.";
    case "Detect Earlier":
      return "Shift patients into earlier and potentially less costly states.";
    case "Stabilise Risk":
      return "Reduce deterioration, crisis events, and unplanned activity.";
    case "Improve Access":
      return "Reduce delay, backlog, and escalation caused by constrained access.";
    case "Redesign Flow":
      return "Change how pathways operate to improve efficiency and value.";
    case "Shift Care Setting":
      return "Move care from higher-cost to lower-intensity settings.";
    case "Improve Decisions":
      return "Improve triage, prioritisation, and decision quality.";
    default:
      return "A set of related decision sandboxes.";
  }
}