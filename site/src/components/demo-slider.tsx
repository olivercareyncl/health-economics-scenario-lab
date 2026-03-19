"use client";

import { useMemo, useState } from "react";

type DemoMode =
  | "effectSize"
  | "coverage"
  | "baselineRisk"
  | "costPerEvent"
  | "interventionCost";

export default function DemoSlider() {
  const [isOpen, setIsOpen] = useState(false);
  const [demoMode, setDemoMode] = useState<DemoMode>("effectSize");
  const [sliderValue, setSliderValue] = useState(12);

  const sliderConfig = useMemo(() => {
    switch (demoMode) {
      case "coverage":
        return {
          label: "Coverage",
          suffix: "%",
          min: 10,
          max: 80,
          step: 1,
          valueText: `${sliderValue}% of population reached`,
        };
      case "baselineRisk":
        return {
          label: "Baseline event risk",
          suffix: "%",
          min: 4,
          max: 30,
          step: 1,
          valueText: `${sliderValue}% baseline event risk`,
        };
      case "costPerEvent":
        return {
          label: "Cost per event",
          suffix: "",
          min: 1000,
          max: 10000,
          step: 100,
          valueText: money(sliderValue),
        };
      case "interventionCost":
        return {
          label: "Intervention cost per patient",
          suffix: "",
          min: 20,
          max: 300,
          step: 5,
          valueText: money(sliderValue),
        };
      case "effectSize":
      default:
        return {
          label: "Effect size",
          suffix: "%",
          min: 0,
          max: 40,
          step: 1,
          valueText: `${sliderValue}% reduction in events`,
        };
    }
  }, [demoMode, sliderValue]);

  const model = useMemo(() => {
    const population = 10000;

    const coverage = demoMode === "coverage" ? sliderValue / 100 : 0.35;
    const baselineRisk = demoMode === "baselineRisk" ? sliderValue / 100 : 0.12;
    const effectSize = demoMode === "effectSize" ? sliderValue / 100 : 0.12;
    const costPerEvent = demoMode === "costPerEvent" ? sliderValue : 4200;
    const interventionCostPerPatient =
      demoMode === "interventionCost" ? sliderValue : 95;

    const peopleReached = population * coverage;
    const eventsAvoided = peopleReached * baselineRisk * effectSize;
    const grossSavings = eventsAvoided * costPerEvent;
    const programmeCost = peopleReached * interventionCostPerPatient;
    const netValue = grossSavings - programmeCost;

    return {
      peopleReached,
      eventsAvoided,
      grossSavings,
      programmeCost,
      netValue,
    };
  }, [demoMode, sliderValue]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full flex-col items-start gap-4 px-6 py-6 text-left md:flex-row md:items-center md:justify-between md:gap-6 md:px-8"
        aria-expanded={isOpen}
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            5-second demo
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            How interventions create value
          </h2>

          <p className="mt-3 hidden max-w-2xl text-slate-600 md:block">
            Adjust one assumption and watch the economics change. This is the core
            logic behind every sandbox.
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          {isOpen ? "Hide demo" : "Show demo"}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <label
                htmlFor="demo-assumption"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Choose an assumption to adjust
              </label>
              <select
                id="demo-assumption"
                value={demoMode}
                onChange={(e) => {
                  const nextMode = e.target.value as DemoMode;
                  setDemoMode(nextMode);

                  switch (nextMode) {
                    case "coverage":
                      setSliderValue(35);
                      break;
                    case "baselineRisk":
                      setSliderValue(12);
                      break;
                    case "costPerEvent":
                      setSliderValue(4200);
                      break;
                    case "interventionCost":
                      setSliderValue(95);
                      break;
                    case "effectSize":
                    default:
                      setSliderValue(12);
                      break;
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="effectSize">Effect size</option>
                <option value="coverage">Coverage</option>
                <option value="baselineRisk">Baseline event risk</option>
                <option value="costPerEvent">Cost per event</option>
                <option value="interventionCost">Intervention cost per patient</option>
              </select>

              <div className="mt-6">
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  {sliderConfig.label} ({sliderConfig.valueText})
                </label>
                <input
                  type="range"
                  min={sliderConfig.min}
                  max={sliderConfig.max}
                  step={sliderConfig.step}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Metric label="People reached" value={model.peopleReached.toFixed(0)} />
              <Metric label="Events avoided" value={model.eventsAvoided.toFixed(0)} />
              <Metric label="Gross system savings" value={money(model.grossSavings)} />
              <Metric label="Programme cost" value={money(model.programmeCost)} />
              <Metric label="Net system value" value={money(model.netValue)} strong />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function money(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
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
        className={`mt-1 text-xl tracking-tight md:text-2xl ${
          strong ? "font-semibold" : "font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  );
}