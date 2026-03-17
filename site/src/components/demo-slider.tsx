"use client";

import { useMemo, useState } from "react";

export default function DemoSlider() {
  const [effectSize, setEffectSize] = useState(12);

  const model = useMemo(() => {
    const population = 10000;
    const coverage = 0.35;
    const baselineRisk = 0.12;
    const costPerEvent = 4200;
    const interventionCostPerPatient = 95;

    const peopleReached = population * coverage;
    const eventsAvoided =
      peopleReached * baselineRisk * (effectSize / 100);
    const grossSavings = eventsAvoided * costPerEvent;
    const programmeCost = peopleReached * interventionCostPerPatient;
    const netValue = grossSavings - programmeCost;

    return {
      eventsAvoided,
      grossSavings,
      programmeCost,
      netValue,
    };
  }, [effectSize]);

  const money = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          5-second demo
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          How interventions create value
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Adjust one assumption and watch the economics change. This is the core
          logic behind every sandbox.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Effect size ({effectSize}% reduction in events)
          </label>
          <input
            type="range"
            min={0}
            max={40}
            value={effectSize}
            onChange={(e) => setEffectSize(Number(e.target.value))}
            className="w-full"
          />

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
            {[
              "Population",
              "Coverage",
              "Risk",
              "Effect",
              "Events avoided",
              "Savings",
              "Net value",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Metric label="Events avoided" value={model.eventsAvoided.toFixed(0)} />
          <Metric label="Gross system savings" value={money(model.grossSavings)} />
          <Metric label="Programme cost" value={money(model.programmeCost)} />
          <Metric
            label="Net system value"
            value={money(model.netValue)}
            strong
          />
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl tracking-tight ${strong ? "font-semibold" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
