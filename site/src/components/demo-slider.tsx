"use client";

import { useMemo, useState } from "react";

type AdjustableKey =
  | "coverage"
  | "baselineRisk"
  | "effectSize"
  | "costPerEvent"
  | "interventionCostPerPatient";

const controls: Record<
  AdjustableKey,
  {
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    formatLabel: (value: number) => string;
  }
> = {
  coverage: {
    label: "Coverage",
    min: 10,
    max: 80,
    step: 1,
    defaultValue: 35,
    formatLabel: (value) => `${value}% of eligible population reached`,
  },
  baselineRisk: {
    label: "Baseline event risk",
    min: 2,
    max: 30,
    step: 1,
    defaultValue: 12,
    formatLabel: (value) => `${value}% baseline event risk`,
  },
  effectSize: {
    label: "Effect size",
    min: 0,
    max: 40,
    step: 1,
    defaultValue: 12,
    formatLabel: (value) => `${value}% reduction in events`,
  },
  costPerEvent: {
    label: "Cost per event",
    min: 1000,
    max: 10000,
    step: 100,
    defaultValue: 4200,
    formatLabel: (value) =>
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
      }).format(value),
  },
  interventionCostPerPatient: {
    label: "Intervention cost per patient",
    min: 20,
    max: 300,
    step: 5,
    defaultValue: 95,
    formatLabel: (value) =>
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
      }).format(value),
  },
};

const logicChips: {
  label: string;
  key?: AdjustableKey;
}[] = [
  { label: "Population" },
  { label: "Coverage", key: "coverage" },
  { label: "Risk", key: "baselineRisk" },
  { label: "Effect", key: "effectSize" },
  { label: "Cost per event", key: "costPerEvent" },
  { label: "Intervention cost", key: "interventionCostPerPatient" },
  { label: "Events avoided" },
  { label: "Savings" },
  { label: "Net value" },
];

export default function DemoSlider() {
  const [selectedAssumption, setSelectedAssumption] =
    useState<AdjustableKey>("effectSize");
  const [sliderValue, setSliderValue] = useState(
    controls.effectSize.defaultValue,
  );

  const money = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(n);

  const model = useMemo(() => {
    const population = 10000;

    const coverage =
      selectedAssumption === "coverage" ? sliderValue / 100 : 0.35;
    const baselineRisk =
      selectedAssumption === "baselineRisk" ? sliderValue / 100 : 0.12;
    const effectSize =
      selectedAssumption === "effectSize" ? sliderValue / 100 : 0.12;
    const costPerEvent =
      selectedAssumption === "costPerEvent" ? sliderValue : 4200;
    const interventionCostPerPatient =
      selectedAssumption === "interventionCostPerPatient" ? sliderValue : 95;

    const peopleReached = population * coverage;
    const eventsAvoided = peopleReached * baselineRisk * effectSize;
    const grossSavings = eventsAvoided * costPerEvent;
    const programmeCost = peopleReached * interventionCostPerPatient;
    const netValue = grossSavings - programmeCost;

    return {
      eventsAvoided,
      grossSavings,
      programmeCost,
      netValue,
      peopleReached,
    };
  }, [selectedAssumption, sliderValue]);

  const activeControl = controls[selectedAssumption];

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
          Choose one assumption to adjust and watch the economics change. This
          is the core logic behind every sandbox.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <label
            htmlFor="assumption-select"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Assumption to adjust
          </label>
          <select
            id="assumption-select"
            value={selectedAssumption}
            onChange={(e) => {
              const nextKey = e.target.value as AdjustableKey;
              setSelectedAssumption(nextKey);
              setSliderValue(controls[nextKey].defaultValue);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            {Object.entries(controls).map(([key, control]) => (
              <option key={key} value={key}>
                {control.label}
              </option>
            ))}
          </select>

          <label className="mb-3 mt-6 block text-sm font-medium text-slate-700">
            {activeControl.label} ({activeControl.formatLabel(sliderValue)})
          </label>
          <input
            type="range"
            min={activeControl.min}
            max={activeControl.max}
            step={activeControl.step}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full"
          />

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
            {logicChips.map((chip) => {
              const isActive = chip.key === selectedAssumption;

              return (
                <span
                  key={chip.label}
                  className={`rounded-full border px-3 py-1 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {chip.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Metric
            label="People reached"
            value={model.peopleReached.toFixed(0)}
          />
          <Metric
            label="Events avoided"
            value={model.eventsAvoided.toFixed(0)}
          />
          <Metric
            label="Gross system savings"
            value={money(model.grossSavings)}
          />
          <Metric
            label="Programme cost"
            value={money(model.programmeCost)}
          />
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
      <p
        className={`mt-1 text-2xl tracking-tight ${
          strong ? "font-semibold" : "font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  );
}