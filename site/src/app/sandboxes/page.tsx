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
type RouteFilter = "All routes" | RouteName;

export default function SandboxesPage() {
  const [selectedRoute, setSelectedRoute] = useState<RouteFilter>("All routes");

  const routeCounts = useMemo(() => {
    return routeOrder.reduce<Record<RouteName, number>>((acc, route) => {
      acc[route] = apps.filter((app) => app.category === route).length;
      return acc;
    }, {} as Record<RouteName, number>);
  }, []);

  const groupedApps = useMemo(() => {
    const activeRoutes =
      selectedRoute === "All routes" ? routeOrder : [selectedRoute];

    return activeRoutes
      .map((route) => ({
        route,
        apps: apps.filter((app) => app.category === route),
      }))
      .filter((group) => group.apps.length > 0);
  }, [selectedRoute]);

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

      <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <div>
          <label
            htmlFor="route-filter"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Route to system value
          </label>
          <select
            id="route-filter"
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value as RouteFilter)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option value="All routes">All routes ({apps.length})</option>
            {routeOrder.map((route) => (
              <option key={route} value={route}>
                {route} ({routeCounts[route]})
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-slate-700">
            Jump to a route
          </p>
          <div className="flex flex-wrap gap-3">
            {routeOrder.map((route) => {
              const count = routeCounts[route];
              const isDisabled = count === 0;
              const isSelected = selectedRoute === route;

              if (selectedRoute === "All routes") {
                return (
                  <a
                    key={route}
                    href={`#${toAnchorId(route)}`}
                    aria-disabled={isDisabled}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      isDisabled
                        ? "pointer-events-none cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {route} ({count})
                  </a>
                );
              }

              return (
                <button
                  key={route}
                  type="button"
                  onClick={() => setSelectedRoute(route)}
                  disabled={isDisabled}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isDisabled
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {route} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-14">
        {groupedApps.map((group) => (
          <section key={group.route} id={toAnchorId(group.route)}>
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {group.route}
                </h2>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                  {group.apps.length}{" "}
                  {group.apps.length === 1 ? "sandbox" : "sandboxes"}
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
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

        {groupedApps.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No sandboxes are currently mapped to this route.
          </div>
        )}
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