"use client";

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
    href: "/sandboxes#prevent-need",
    icon: ShieldPlus,
  },
  {
    name: "Detect Earlier",
    description: "Shift patients into earlier and more treatable states.",
    href: "/sandboxes#detect-earlier",
    icon: Search,
  },
  {
    name: "Stabilise Risk",
    description: "Reduce deterioration, crisis events, and unplanned activity.",
    href: "/sandboxes#stabilise-risk",
    icon: HeartPulse,
  },
  {
    name: "Improve Access",
    description:
      "Reduce delay, backlog, and escalation caused by constrained access.",
    href: "/sandboxes#improve-access",
    icon: Clock3,
  },
  {
    name: "Redesign Flow",
    description: "Improve pathway efficiency by changing how care operates.",
    href: "/sandboxes#redesign-flow",
    icon: Workflow,
  },
  {
    name: "Shift Care Setting",
    description: "Move care from higher-cost to lower-intensity settings.",
    href: "/sandboxes#shift-care-setting",
    icon: ArrowRightLeft,
  },
  {
    name: "Improve Decisions",
    description: "Improve triage, prioritisation, and decision quality.",
    href: "/sandboxes#improve-decisions",
    icon: BrainCircuit,
  },
];

export default function RoutesGrid() {
  return (
    <section>
      <div className="mb-6 md:mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Routes to system value
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          A shared framework across the lab
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          The sandboxes are organised around recurring ways healthcare systems
          create value.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {routes.map((route) => {
          const Icon = route.icon;

          return (
            <Link
              key={route.name}
              href={route.href}
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white md:p-6"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 md:p-3">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>

                <div>
                  <h3 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
                    {route.name}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {route.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}