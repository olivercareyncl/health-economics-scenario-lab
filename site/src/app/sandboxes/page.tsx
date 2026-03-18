"use client";

import { useMemo, useState } from "react";
import SandboxCard from "@/components/sandbox-card";
import { apps } from "@/data/apps";

const categoryOrder = [
  "All routes",
  "Prevent Need",
  "Detect Earlier",
  "Stabilise Risk",
  "Improve Access",
  "Redesign Flow",
  "Shift Care Setting",
  "Improve Decisions",
] as const;

type CategoryFilter = (typeof categoryOrder)[number];

export default function SandboxesPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All routes");

  const groupedApps = useMemo(() => {
    const activeCategories =
      selectedCategory === "All routes"
        ? categoryOrder.filter((item) => item !== "All routes")
        : [selectedCategory];

    return activeCategories
      .map((category) => ({
        category,
        apps: apps.filter((app) => app.category === category),
      }))
      .filter((group) => group.apps.length > 0);
  }, [selectedCategory]);

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

      <div className="mt-10 max-w-sm">
        <label
          htmlFor="route-filter"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Route to system value
        </label>
        <select
          id="route-filter"
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(e.target.value as CategoryFilter)
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
        >
          {categoryOrder.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

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

        {groupedApps.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No sandboxes are currently mapped to this route.
          </div>
        )}
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