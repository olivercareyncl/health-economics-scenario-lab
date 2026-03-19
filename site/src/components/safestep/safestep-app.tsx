"use client";

import { useMemo, useState } from "react";
import {
  ASSUMPTION_META,
  ASSUMPTION_ORDER,
  getAssumptionConfidenceSummary,
} from "@/lib/safestep/metadata";
import { defaultInputs } from "@/lib/safestep/defaults";
import {
  buildComparatorCase,
  runBoundedUncertainty,
  runModel,
} from "@/lib/safestep/calculations";
import {
  COSTING_METHOD_OPTIONS,
  SCENARIO_MAP,
  TARGETING_MODE_OPTIONS,
} from "@/lib/safestep/scenarios";
import {
  formatByType,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/safestep/formatters";
import {
  generateDecisionReadiness,
  generateInterpretation,
  generateOverviewSummary,
  generateOverallSignal,
  generateStructuredRecommendation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/safestep/summaries";
import type {
  CostingMethod,
  SafeStepInputs,
  ScenarioName,
  TargetingMode,
} from "@/lib/safestep/types";

type DesktopTabKey =
  | "overview"
  | "assumptions"
  | "uncertainty"
  | "interpretation";

type MobileTabKey = "summary" | "assumptions" | "details";

const scenarioOptions = Object.keys(SCENARIO_MAP) as ScenarioName[];

const comparatorOptions: ScenarioName[] = [
  "Higher-risk targeting",
  "Tighter high-risk targeting",
  "Lower-cost delivery",
  "Stronger effect",
  "Targeted and stronger effect",
];

export default function SafeStepApp() {
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioName>("Base case");
  const [comparatorMode, setComparatorMode] =
    useState<ScenarioName>("Higher-risk targeting");

  const [desktopTab, setDesktopTab] =
    useState<DesktopTabKey>("overview");
  const [mobileTab, setMobileTab] =
    useState<MobileTabKey>("summary");

  const [showAdvancedMobileInputs, setShowAdvancedMobileInputs] =
    useState(false);

  const [inputs, setInputs] = useState<SafeStepInputs>(() =>
    SCENARIO_MAP["Base case"](defaultInputs),
  );

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertaintyRows = useMemo(
    () => runBoundedUncertainty(inputs),
    [inputs],
  );

  const decisionStatus = useMemo(
    () => getDecisionStatus(results, inputs.cost_effectiveness_threshold),
    [results, inputs.cost_effectiveness_threshold],
  );

  const netCostLabel = useMemo(() => getNetCostLabel(results), [results]);

  const overallSignal = useMemo(
    () => generateOverallSignal(results, inputs, uncertaintyRows),
    [results, inputs, uncertaintyRows],
  );

  const overviewSummary = useMemo(
    () => generateOverviewSummary(results, inputs, uncertaintyRows),
    [results, inputs, uncertaintyRows],
  );

  const structuredRecommendation = useMemo(
    () => generateStructuredRecommendation(inputs, results, uncertaintyRows),
    [inputs, results, uncertaintyRows],
  );

  const decisionReadiness = useMemo(
    () => generateDecisionReadiness(inputs, results, uncertaintyRows),
    [inputs, results, uncertaintyRows],
  );

  const interpretation = useMemo(
    () => generateInterpretation(results, inputs, uncertaintyRows),
    [results, inputs, uncertaintyRows],
  );

  const confidenceSummary = useMemo(
    () => getAssumptionConfidenceSummary(),
    [],
  );

  const assumptionsTable = useMemo(
    () =>
      ASSUMPTION_ORDER.filter((key) => key in inputs).map((key) => {
        const meta = ASSUMPTION_META[key];
        const rawValue = inputs[key];
        return {
          key,
          assumption: meta.label,
          value: formatByType(rawValue as string | number, meta.formatter),
          unit: meta.unit,
          sourceType: meta.sourceType,
          confidence: meta.confidence,
          notes: meta.description,
        };
      }),
    [inputs],
  );

  const uncertaintyTable = useMemo(
    () =>
      uncertaintyRows.map((row) => ({
        case: row.case,
        fallsAvoided: formatNumber(row.falls_avoided_total),
        discountedNetCost: formatCurrency(row.discounted_net_cost_total),
        discountedCostPerQaly: formatCurrency(row.discounted_cost_per_qaly),
        decisionStatus: row.decision_status,
        dominantDomain: row.dominant_domain,
      })),
    [uncertaintyRows],
  );

  const comparatorResults = useMemo(() => {
    const comparatorInputs = buildComparatorCase(
      defaultInputs,
      inputs,
      comparatorMode,
    );
    return runModel(comparatorInputs);
  }, [inputs, comparatorMode]);

  function updateInput<K extends keyof SafeStepInputs>(
    key: K,
    value: SafeStepInputs[K],
  ) {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function applyScenario(scenario: ScenarioName) {
    setSelectedScenario(scenario);
    setInputs(SCENARIO_MAP[scenario](defaultInputs));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pb-28 sm:px-6 md:py-14 xl:pb-14">
      <div className="max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Health Economics Scenario Lab
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          SafeStep
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Falls Prevention Sandbox
        </p>

        <p className="mt-5 max-w-3xl leading-7 text-slate-600 xl:hidden">
          Test whether a falls prevention programme could create value under
          different assumptions about targeting, risk, effect, and cost.
        </p>

        <p className="mt-5 hidden max-w-3xl leading-8 text-slate-600 xl:block">
          Explore how falls prevention might change falls, admissions, bed use,
          and value under different assumptions about targeting, uptake,
          effectiveness, and delivery cost.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Key question: What would need to be true for falls prevention to create
        value?
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 xl:block hidden">
        Illustrative decision sandbox only. This model uses synthetic
        assumptions for exploratory decision support and is not a formal
        economic evaluation.
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="hidden xl:block space-y-4">
          <AccordionPanel
            title="Scenario"
            summary={selectedScenario}
            defaultOpen
          >
            <Field label="Scenario preset">
              <select
                value={selectedScenario}
                onChange={(e) =>
                  applyScenario(e.target.value as ScenarioName)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              >
                {scenarioOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </AccordionPanel>

          <AccordionPanel
            title="Population and delivery"
            summary={`${formatNumber(inputs.eligible_population)} eligible • ${formatPercent(inputs.uptake_rate)} uptake`}
          >
            <Field label="Eligible population">
              <input
                type="number"
                min={0}
                step={100}
                value={inputs.eligible_population}
                onChange={(e) =>
                  updateInput("eligible_population", Number(e.target.value))
                }
                className="input"
              />
            </Field>

            <RangeField
              label="Programme uptake"
              value={inputs.uptake_rate}
              min={0}
              max={1}
              step={0.01}
              display={formatPercent(inputs.uptake_rate)}
              onChange={(value) => updateInput("uptake_rate", value)}
            />

            <RangeField
              label="Programme completion"
              value={inputs.adherence_rate}
              min={0}
              max={1}
              step={0.01}
              display={formatPercent(inputs.adherence_rate)}
              onChange={(value) => updateInput("adherence_rate", value)}
            />

            <RangeField
              label="Annual participation drop-off"
              value={inputs.participation_dropoff_rate}
              min={0}
              max={0.5}
              step={0.01}
              display={formatPercent(inputs.participation_dropoff_rate)}
              onChange={(value) =>
                updateInput("participation_dropoff_rate", value)
              }
            />
          </AccordionPanel>

          <AccordionPanel
            title="Targeting and risk"
            summary={`${inputs.targeting_mode} • ${formatPercent(inputs.annual_fall_risk)} fall risk`}
          >
            <Field label="Targeting mode">
              <select
                value={inputs.targeting_mode}
                onChange={(e) =>
                  updateInput(
                    "targeting_mode",
                    e.target.value as TargetingMode,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              >
                {TARGETING_MODE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <RangeField
              label="Annual fall risk"
              value={inputs.annual_fall_risk}
              min={0}
              max={1}
              step={0.01}
              display={formatPercent(inputs.annual_fall_risk)}
              onChange={(value) => updateInput("annual_fall_risk", value)}
            />

            <RangeField
              label="Falls leading to admission"
              value={inputs.admission_rate_after_fall}
              min={0}
              max={1}
              step={0.01}
              display={formatPercent(inputs.admission_rate_after_fall)}
              onChange={(value) =>
                updateInput("admission_rate_after_fall", value)
              }
            />

            <Field label="Average length of stay (days)">
              <input
                type="number"
                min={0}
                step={0.5}
                value={inputs.average_length_of_stay}
                onChange={(e) =>
                  updateInput("average_length_of_stay", Number(e.target.value))
                }
                className="input"
              />
            </Field>
          </AccordionPanel>

          <AccordionPanel
            title="Intervention"
            summary={`${formatCurrency(inputs.intervention_cost_per_person)} per participant • ${formatPercent(inputs.relative_risk_reduction)} reduction`}
          >
            <Field label="Cost per participant">
              <input
                type="number"
                min={0}
                step={10}
                value={inputs.intervention_cost_per_person}
                onChange={(e) =>
                  updateInput(
                    "intervention_cost_per_person",
                    Number(e.target.value),
                  )
                }
                className="input"
              />
            </Field>

            <RangeField
              label="Reduction in falls"
              value={inputs.relative_risk_reduction}
              min={0}
              max={1}
              step={0.01}
              display={formatPercent(inputs.relative_risk_reduction)}
              onChange={(value) =>
                updateInput("relative_risk_reduction", value)
              }
            />

            <RangeField
              label="Annual effect decay"
              value={inputs.effect_decay_rate}
              min={0}
              max={0.5}
              step={0.01}
              display={formatPercent(inputs.effect_decay_rate)}
              onChange={(value) => updateInput("effect_decay_rate", value)}
            />
          </AccordionPanel>

          <AccordionPanel
            title="Economic assumptions"
            summary={`${inputs.costing_method} • ${formatCurrency(inputs.cost_effectiveness_threshold)} threshold`}
          >
            <Field label="Costing method">
              <select
                value={inputs.costing_method}
                onChange={(e) =>
                  updateInput(
                    "costing_method",
                    e.target.value as CostingMethod,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              >
                {COSTING_METHOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cost per admission">
              <input
                type="number"
                min={0}
                step={100}
                value={inputs.cost_per_admission}
                onChange={(e) =>
                  updateInput("cost_per_admission", Number(e.target.value))
                }
                className="input"
              />
            </Field>

            <Field label="Cost per bed day">
              <input
                type="number"
                min={0}
                step={50}
                value={inputs.cost_per_bed_day}
                onChange={(e) =>
                  updateInput("cost_per_bed_day", Number(e.target.value))
                }
                className="input"
              />
            </Field>

            <Field label="QALY loss per serious fall">
              <input
                type="number"
                min={0}
                step={0.01}
                value={inputs.qaly_loss_per_serious_fall}
                onChange={(e) =>
                  updateInput(
                    "qaly_loss_per_serious_fall",
                    Number(e.target.value),
                  )
                }
                className="input"
              />
            </Field>

            <Field label="Cost-effectiveness threshold">
              <input
                type="number"
                min={0}
                step={1000}
                value={inputs.cost_effectiveness_threshold}
                onChange={(e) =>
                  updateInput(
                    "cost_effectiveness_threshold",
                    Number(e.target.value),
                  )
                }
                className="input"
              />
            </Field>
          </AccordionPanel>

          <AccordionPanel
            title="Time horizon"
            summary={`${inputs.time_horizon_years} years • ${formatPercent(inputs.discount_rate)} discount`}
          >
            <Field label="Time horizon">
              <select
                value={inputs.time_horizon_years}
                onChange={(e) =>
                  updateInput("time_horizon_years", Number(e.target.value))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              >
                {[1, 3, 5].map((option) => (
                  <option key={option} value={option}>
                    {option} year{option !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Discount rate">
              <input
                type="number"
                min={0}
                step={0.005}
                value={inputs.discount_rate}
                onChange={(e) =>
                  updateInput("discount_rate", Number(e.target.value))
                }
                className="input"
              />
            </Field>
          </AccordionPanel>

          <AccordionPanel title="Comparator" summary={comparatorMode}>
            <Field label="Compare current selection with">
              <select
                value={comparatorMode}
                onChange={(e) =>
                  setComparatorMode(e.target.value as ScenarioName)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              >
                {comparatorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </AccordionPanel>
        </aside>

        <main className="min-w-0">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <h2 className="text-xl font-semibold">Decision verdict</h2>

            <div className="mt-4">
              {decisionStatus === "Appears cost-saving" ? (
                <StatusBanner
                  tone="success"
                  title="Appears cost-saving"
                  body="The current assumptions suggest the programme generates net savings over the selected horizon."
                />
              ) : decisionStatus === "Appears cost-effective" ? (
                <StatusBanner
                  tone="info"
                  title="Appears cost-effective"
                  body="The current assumptions suggest the programme is below the selected cost-effectiveness threshold, but not cost-saving."
                />
              ) : (
                <StatusBanner
                  tone="warning"
                  title="Above threshold"
                  body="The current assumptions suggest the programme delivers benefit, but remains above the selected threshold."
                />
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Falls avoided"
                value={formatNumber(results.falls_avoided_total)}
              />
              <MetricCard
                label="Admissions avoided"
                value={formatNumber(results.admissions_avoided_total)}
              />
              <MetricCard
                label={netCostLabel}
                value={formatCurrency(Math.abs(results.discounted_net_cost_total))}
              />
              <MetricCard
                label="Discounted cost per QALY"
                value={formatCurrency(results.discounted_cost_per_qaly)}
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 xl:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Overall signal
              </p>
              <p className="mt-3 leading-7 text-slate-700">{overallSignal}</p>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 xl:hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Quick assumptions
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Adjust the highest-leverage inputs first.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Mobile first
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Targeting mode">
                <select
                  value={inputs.targeting_mode}
                  onChange={(e) =>
                    updateInput(
                      "targeting_mode",
                      e.target.value as TargetingMode,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  {TARGETING_MODE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Eligible population">
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={inputs.eligible_population}
                  onChange={(e) =>
                    updateInput("eligible_population", Number(e.target.value))
                  }
                  className="input"
                />
              </Field>

              <RangeField
                label="Annual fall risk"
                value={inputs.annual_fall_risk}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.annual_fall_risk)}
                onChange={(value) => updateInput("annual_fall_risk", value)}
              />

              <Field label="Cost per participant">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={inputs.intervention_cost_per_person}
                  onChange={(e) =>
                    updateInput(
                      "intervention_cost_per_person",
                      Number(e.target.value),
                    )
                  }
                  className="input"
                />
              </Field>

              <RangeField
                label="Reduction in falls"
                value={inputs.relative_risk_reduction}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.relative_risk_reduction)}
                onChange={(value) =>
                  updateInput("relative_risk_reduction", value)
                }
              />

              <Field label="Costing method">
                <select
                  value={inputs.costing_method}
                  onChange={(e) =>
                    updateInput(
                      "costing_method",
                      e.target.value as CostingMethod,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  {COSTING_METHOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Time horizon">
                <select
                  value={inputs.time_horizon_years}
                  onChange={(e) =>
                    updateInput("time_horizon_years", Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  {[1, 3, 5].map((option) => (
                    <option key={option} value={option}>
                      {option} year{option !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() =>
                  setShowAdvancedMobileInputs((prev) => !prev)
                }
                className="inline-flex rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                {showAdvancedMobileInputs
                  ? "Hide advanced assumptions"
                  : "Show advanced assumptions"}
              </button>
            </div>

            {showAdvancedMobileInputs && (
              <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
                <Field label="Scenario preset">
                  <select
                    value={selectedScenario}
                    onChange={(e) =>
                      applyScenario(e.target.value as ScenarioName)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                  >
                    {scenarioOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <RangeField
                  label="Programme uptake"
                  value={inputs.uptake_rate}
                  min={0}
                  max={1}
                  step={0.01}
                  display={formatPercent(inputs.uptake_rate)}
                  onChange={(value) => updateInput("uptake_rate", value)}
                />

                <RangeField
                  label="Programme completion"
                  value={inputs.adherence_rate}
                  min={0}
                  max={1}
                  step={0.01}
                  display={formatPercent(inputs.adherence_rate)}
                  onChange={(value) => updateInput("adherence_rate", value)}
                />

                <RangeField
                  label="Annual participation drop-off"
                  value={inputs.participation_dropoff_rate}
                  min={0}
                  max={0.5}
                  step={0.01}
                  display={formatPercent(inputs.participation_dropoff_rate)}
                  onChange={(value) =>
                    updateInput("participation_dropoff_rate", value)
                  }
                />

                <RangeField
                  label="Falls leading to admission"
                  value={inputs.admission_rate_after_fall}
                  min={0}
                  max={1}
                  step={0.01}
                  display={formatPercent(inputs.admission_rate_after_fall)}
                  onChange={(value) =>
                    updateInput("admission_rate_after_fall", value)
                  }
                />

                <Field label="Average length of stay (days)">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={inputs.average_length_of_stay}
                    onChange={(e) =>
                      updateInput("average_length_of_stay", Number(e.target.value))
                    }
                    className="input"
                  />
                </Field>

                <RangeField
                  label="Annual effect decay"
                  value={inputs.effect_decay_rate}
                  min={0}
                  max={0.5}
                  step={0.01}
                  display={formatPercent(inputs.effect_decay_rate)}
                  onChange={(value) => updateInput("effect_decay_rate", value)}
                />

                <Field label="Cost per admission">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={inputs.cost_per_admission}
                    onChange={(e) =>
                      updateInput("cost_per_admission", Number(e.target.value))
                    }
                    className="input"
                  />
                </Field>

                <Field label="Cost per bed day">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={inputs.cost_per_bed_day}
                    onChange={(e) =>
                      updateInput("cost_per_bed_day", Number(e.target.value))
                    }
                    className="input"
                  />
                </Field>

                <Field label="QALY loss per serious fall">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={inputs.qaly_loss_per_serious_fall}
                    onChange={(e) =>
                      updateInput(
                        "qaly_loss_per_serious_fall",
                        Number(e.target.value),
                      )
                    }
                    className="input"
                  />
                </Field>

                <Field label="Cost-effectiveness threshold">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={inputs.cost_effectiveness_threshold}
                    onChange={(e) =>
                      updateInput(
                        "cost_effectiveness_threshold",
                        Number(e.target.value),
                      )
                    }
                    className="input"
                  />
                </Field>

                <Field label="Discount rate">
                  <input
                    type="number"
                    min={0}
                    step={0.005}
                    value={inputs.discount_rate}
                    onChange={(e) =>
                      updateInput("discount_rate", Number(e.target.value))
                    }
                    className="input"
                  />
                </Field>

                <Field label="Comparator">
                  <select
                    value={comparatorMode}
                    onChange={(e) =>
                      setComparatorMode(e.target.value as ScenarioName)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                  >
                    {comparatorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </section>

          <div className="mt-6 xl:hidden">
            <div className="flex flex-wrap gap-2">
              <TabButton
                label="Summary"
                active={mobileTab === "summary"}
                onClick={() => setMobileTab("summary")}
              />
              <TabButton
                label="Assumptions"
                active={mobileTab === "assumptions"}
                onClick={() => setMobileTab("assumptions")}
              />
              <TabButton
                label="Details"
                active={mobileTab === "details"}
                onClick={() => setMobileTab("details")}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              {mobileTab === "summary" && (
                <div className="space-y-5">
                  <SectionHeading
                    title="Summary"
                    body="A concise view of the current signal and the assumptions driving it."
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <MetricCard
                      label="People treated"
                      value={formatNumber(results.treated_population_year_1)}
                      subtle
                    />
                    <MetricCard
                      label="Bed days avoided"
                      value={formatNumber(results.bed_days_avoided_total)}
                      subtle
                    />
                    <MetricCard
                      label="Programme cost"
                      value={formatCurrency(results.programme_cost_total)}
                      subtle
                    />
                    <MetricCard
                      label="Gross savings"
                      value={formatCurrency(results.gross_savings_total)}
                      subtle
                    />
                    <MetricCard
                      label="Return on spend"
                      value={formatRatio(results.roi)}
                      subtle
                    />
                    <MetricCard
                      label="Max cost per participant"
                      value={formatCurrency(results.break_even_cost_per_participant)}
                      subtle
                    />
                  </div>

                  <InfoBox
                    title="Strategic summary"
                    body={overviewSummary}
                  />
                  <InfoBox
                    title="Main fragility"
                    body={structuredRecommendation.mainFragility}
                  />
                  <InfoBox
                    title="Best next step"
                    body={structuredRecommendation.bestNextStep}
                  />
                </div>
              )}

              {mobileTab === "assumptions" && (
                <div className="space-y-5">
                  <SectionHeading
                    title="Assumption review"
                    body="Review the current inputs and their metadata."
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                      label="High confidence"
                      value={String(confidenceSummary["High confidence"])}
                      subtle
                    />
                    <MetricCard
                      label="Medium confidence"
                      value={String(confidenceSummary["Medium confidence"])}
                      subtle
                    />
                    <MetricCard
                      label="Low confidence"
                      value={String(confidenceSummary["Low confidence"])}
                      subtle
                    />
                  </div>

                  <div className="space-y-3">
                    {assumptionsTable.map((row) => (
                      <div
                        key={row.key}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="font-semibold text-slate-900">
                          {row.assumption}
                        </p>
                        <p className="mt-2 text-lg font-medium text-slate-900">
                          {row.value}
                          {row.unit ? (
                            <span className="ml-2 text-sm font-normal text-slate-500">
                              {row.unit}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-3 text-sm text-slate-600">
                          {row.notes}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                            {row.sourceType}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                            {row.confidence}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mobileTab === "details" && (
                <div className="space-y-5">
                  <SectionHeading
                    title="Details"
                    body="Deeper analytical and interpretive detail for the current configuration."
                  />

                  <div className="space-y-3">
                    {uncertaintyTable.map((row) => (
                      <div
                        key={row.case}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold text-slate-900">
                            {row.case}
                          </p>
                          <span className="text-sm text-slate-500">
                            {row.decisionStatus}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">
                              Falls avoided
                            </span>
                            <span className="text-slate-800">
                              {row.fallsAvoided}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">
                              Discounted net cost
                            </span>
                            <span className="text-slate-800">
                              {row.discountedNetCost}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">
                              Discounted cost per QALY
                            </span>
                            <span className="text-slate-800">
                              {row.discountedCostPerQaly}
                            </span>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          Main uncertainty domain: {row.dominantDomain}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Decision readiness
                    </p>
                    <ul className="mt-3 space-y-2 text-slate-700">
                      {decisionReadiness.validateNext.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {decisionReadiness.readinessNote}
                    </p>
                  </div>

                  <InfoBox
                    title="What the model suggests"
                    body={interpretation.whatModelSuggests}
                  />
                  <InfoBox
                    title="What drives the result"
                    body={interpretation.whatDrivesResult}
                  />
                  <InfoBox
                    title="What looks fragile"
                    body={interpretation.whatLooksFragile}
                  />

                  <details className="rounded-xl border border-slate-200 bg-slate-50 p-4 group">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        Advanced comparison
                        <span className="text-slate-400 transition group-open:rotate-180">
                          ↓
                        </span>
                      </span>
                    </summary>
                    <div className="mt-4 space-y-4">
                      <InfoBox
                        title="Comparator snapshot"
                        body={`${comparatorMode} produces ${formatNumber(
                          comparatorResults.falls_avoided_total -
                            results.falls_avoided_total,
                        )} change in falls avoided and ${formatCurrency(
                          comparatorResults.discounted_net_cost_total -
                            results.discounted_net_cost_total,
                        )} change in discounted net cost versus the current selection.`}
                      />
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 hidden xl:block">
            <div className="flex flex-wrap gap-2">
              <TabButton
                label="Overview"
                active={desktopTab === "overview"}
                onClick={() => setDesktopTab("overview")}
              />
              <TabButton
                label="Assumptions"
                active={desktopTab === "assumptions"}
                onClick={() => setDesktopTab("assumptions")}
              />
              <TabButton
                label="Uncertainty"
                active={desktopTab === "uncertainty"}
                onClick={() => setDesktopTab("uncertainty")}
              />
              <TabButton
                label="Interpretation"
                active={desktopTab === "interpretation"}
                onClick={() => setDesktopTab("interpretation")}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
              {desktopTab === "overview" && (
                <div className="space-y-5">
                  <SectionHeading
                    title="Overview"
                    body="A summary of the current decision signal and the main assumptions driving it."
                  />

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <MetricCard
                      label="People treated"
                      value={formatNumber(results.treated_population_year_1)}
                      subtle
                    />
                    <MetricCard
                      label="Bed days avoided"
                      value={formatNumber(results.bed_days_avoided_total)}
                      subtle
                    />
                    <MetricCard
                      label="Programme cost"
                      value={formatCurrency(results.programme_cost_total)}
                      subtle
                    />
                    <MetricCard
                      label="Gross savings"
                      value={formatCurrency(results.gross_savings_total)}
                      subtle
                    />
                    <MetricCard
                      label="Return on spend"
                      value={formatRatio(results.roi)}
                      subtle
                    />
                    <MetricCard
                      label="Max cost per participant"
                      value={formatCurrency(results.break_even_cost_per_participant)}
                      subtle
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <InfoBox
                      title="Overall signal"
                      body={overallSignal}
                    />
                    <InfoBox
                      title="Strategic summary"
                      body={overviewSummary}
                    />
                    <InfoBox
                      title="Primary economic driver"
                      body={getMainDriverText(inputs)}
                    />
                    <InfoBox
                      title="Main fragility"
                      body={structuredRecommendation.mainFragility}
                    />
                    <InfoBox
                      title="Best next step"
                      body={structuredRecommendation.bestNextStep}
                    />
                    <InfoBox
                      title="Comparator snapshot"
                      body={`${comparatorMode} produces ${formatNumber(
                        comparatorResults.falls_avoided_total -
                          results.falls_avoided_total,
                      )} change in falls avoided and ${formatCurrency(
                        comparatorResults.discounted_net_cost_total -
                          results.discounted_net_cost_total,
                      )} change in discounted net cost versus the current selection.`}
                    />
                  </div>
                </div>
              )}

              {desktopTab === "assumptions" && (
                <div className="space-y-5">
                  <SectionHeading
                    title="Current assumptions"
                    body="Review the current values and metadata behind the model inputs."
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                      label="High confidence"
                      value={String(confidenceSummary["High confidence"])}
                      subtle
                    />
                    <MetricCard
                      label="Medium confidence"
                      value={String(confidenceSummary["Medium confidence"])}
                      subtle
                    />
                    <MetricCard
                      label="Low confidence"
                      value={String(confidenceSummary["Low confidence"])}
                      subtle
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0 text-sm">
                      <thead>
                        <tr>
                          {[
                            "Assumption",
                            "Value",
                            "Unit",
                            "Source type",
                            "Confidence",
                            "Notes",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="border-b border-slate-200 px-3 py-3 text-left font-semibold text-slate-700"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {assumptionsTable.map((row) => (
                          <tr key={row.key}>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-900">
                              {row.assumption}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                              {row.value}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                              {row.unit}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                              {row.sourceType}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                              {row.confidence}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-600">
                              {row.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {desktopTab === "uncertainty" && (
                <div className="space-y-5">
                  <SectionHeading
                    title="Bounded uncertainty"
                    body="A deterministic view of how robust or fragile the result looks under bounded changes in key assumptions."
                  />

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0 text-sm">
                      <thead>
                        <tr>
                          {[
                            "Case",
                            "Falls avoided",
                            "Discounted net cost",
                            "Discounted cost per QALY",
                            "Decision status",
                            "Main uncertainty domain",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="border-b border-slate-200 px-3 py-3 text-left font-semibold text-slate-700"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uncertaintyTable.map((row) => (
                          <tr key={row.case}>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-900">
                              {row.case}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                              {row.fallsAvoided}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                              {row.discountedNetCost}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                              {row.discountedCostPerQaly}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                              {row.decisionStatus}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3 text-slate-600">
                              {row.dominantDomain}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Decision readiness
                    </p>
                    <ul className="mt-3 space-y-2 text-slate-700">
                      {decisionReadiness.validateNext.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {decisionReadiness.readinessNote}
                    </p>
                  </div>
                </div>
              )}

              {desktopTab === "interpretation" && (
                <div className="space-y-5">
                  <SectionHeading
                    title="Interpretation"
                    body="Structured decision support text generated from the current assumptions and results."
                  />

                  <InfoBox
                    title="What the model suggests"
                    body={interpretation.whatModelSuggests}
                  />
                  <InfoBox
                    title="What drives the result"
                    body={interpretation.whatDrivesResult}
                  />
                  <InfoBox
                    title="What looks fragile"
                    body={interpretation.whatLooksFragile}
                  />
                  <InfoBox
                    title="What to validate next"
                    body={interpretation.whatToValidateNext}
                  />
                  <InfoBox
                    title="What this sandbox does not capture"
                    body={interpretation.limitations}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              {decisionStatus}
            </p>
            <p className="truncate text-sm font-semibold text-slate-900">
              {formatCurrency(Math.abs(results.discounted_net_cost_total))} •{" "}
              {formatCurrency(results.discounted_cost_per_qaly)}
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Live
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        SafeStep is part of the Health Economics Scenario Lab — a series of
        interactive decision sandboxes for exploring value under uncertainty.
      </p>
    </div>
  );
}

function AccordionPanel({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 group"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{summary}</p>
          </div>
          <span className="mt-1 text-slate-400 transition group-open:rotate-180">
            ↓
          </span>
        </div>
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-500">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        subtle ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBanner({
  tone,
  title,
  body,
}: {
  tone: "success" | "info" | "warning";
  title: string;
  body: string;
}) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "info"
        ? "border-blue-200 bg-blue-50 text-blue-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className={`rounded-xl border p-4 ${styles}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{body}</p>
    </div>
  );
}

function InfoBox({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <p className="mt-3 leading-7 text-slate-700">{body}</p>
    </div>
  );
}

function SectionHeading({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 max-w-3xl text-slate-600">{body}</p>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}