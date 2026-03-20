"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  RotateCcw,
  ChevronDown,
  SlidersHorizontal,
  BarChart3,
  FileSearch,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/safestep/formatters";

type Inputs = {
  targeting_mode: "Universal" | "Risk-targeted" | "High-risk only";
  costing_method: "Admission costs only" | "Admission + bed days";
  eligible_population: number;
  annual_fall_risk: number;
  intervention_cost_per_person: number;
  relative_risk_reduction: number;
  time_horizon_years: 1 | 3 | 5;
  uptake_rate: number;
  adherence_rate: number;
  participation_dropoff_rate: number;
  effect_decay_rate: number;
  admission_rate_after_fall: number;
  average_length_of_stay: number;
  cost_per_admission: number;
  cost_per_bed_day: number;
  qaly_loss_per_serious_fall: number;
  cost_effectiveness_threshold: number;
  discount_rate: number;
};

type MobileTab = "summary" | "assumptions" | "analysis";

type AssumptionSectionKey =
  | "advanced-delivery"
  | "advanced-risk"
  | "advanced-economics";

type PresetOption =
  | "Base case"
  | "Conservative case"
  | "Optimistic case"
  | "High-risk targeted"
  | "Adherence-led delivery"
  | "Admission-led value";

type LocalYearlyResultRow = {
  year: number;
  falls_avoided: number;
  cumulative_programme_cost: number;
  cumulative_gross_savings: number;
};

type LocalUncertaintyRow = {
  case: string;
  discounted_cost_per_qaly: number;
  falls_avoided_total: number;
  decision_status: string;
};

type ModelResults = {
  falls_avoided_total: number;
  admissions_avoided_total: number;
  bed_days_avoided_total: number;
  discounted_programme_cost_total: number;
  discounted_gross_savings_total: number;
  discounted_net_cost_total: number;
  discounted_qalys_gained_total: number;
  discounted_cost_per_qaly: number;
  yearly_results: LocalYearlyResultRow[];
};

type ScenarioPresetDefinition = {
  label: PresetOption;
  description: string;
  overrides: Partial<Inputs>;
};

const DEFAULT_INPUTS: Inputs = {
  targeting_mode: "Risk-targeted",
  costing_method: "Admission + bed days",
  eligible_population: 5000,
  annual_fall_risk: 0.24,
  intervention_cost_per_person: 180,
  relative_risk_reduction: 0.18,
  time_horizon_years: 3,
  uptake_rate: 0.7,
  adherence_rate: 0.75,
  participation_dropoff_rate: 0.08,
  effect_decay_rate: 0.06,
  admission_rate_after_fall: 0.22,
  average_length_of_stay: 7,
  cost_per_admission: 3200,
  cost_per_bed_day: 420,
  qaly_loss_per_serious_fall: 0.055,
  cost_effectiveness_threshold: 20000,
  discount_rate: 0.035,
};

const PRESET_OPTIONS: readonly PresetOption[] = [
  "Base case",
  "Conservative case",
  "Optimistic case",
  "High-risk targeted",
  "Adherence-led delivery",
  "Admission-led value",
];

const PRESET_DEFINITIONS: Record<PresetOption, ScenarioPresetDefinition> = {
  "Base case": {
    label: "Base case",
    description: "Balanced risk-targeted prevention case.",
    overrides: {},
  },
  "Conservative case": {
    label: "Conservative case",
    description: "Lower effect, weaker participation, and higher delivery cost.",
    overrides: {
      relative_risk_reduction: 0.12,
      uptake_rate: 0.62,
      adherence_rate: 0.68,
      intervention_cost_per_person: 210,
      participation_dropoff_rate: 0.1,
      effect_decay_rate: 0.08,
    },
  },
  "Optimistic case": {
    label: "Optimistic case",
    description: "Stronger effect, better participation, and lower delivery friction.",
    overrides: {
      relative_risk_reduction: 0.24,
      uptake_rate: 0.78,
      adherence_rate: 0.82,
      intervention_cost_per_person: 160,
      participation_dropoff_rate: 0.05,
      effect_decay_rate: 0.04,
    },
  },
  "High-risk targeted": {
    label: "High-risk targeted",
    description: "More concentrated risk with tighter targeting.",
    overrides: {
      targeting_mode: "High-risk only",
      annual_fall_risk: 0.32,
      uptake_rate: 0.68,
      adherence_rate: 0.8,
      relative_risk_reduction: 0.2,
      intervention_cost_per_person: 195,
    },
  },
  "Adherence-led delivery": {
    label: "Adherence-led delivery",
    description: "Value mainly comes from stronger uptake and sustained completion.",
    overrides: {
      targeting_mode: "Risk-targeted",
      uptake_rate: 0.82,
      adherence_rate: 0.86,
      participation_dropoff_rate: 0.05,
      effect_decay_rate: 0.05,
      relative_risk_reduction: 0.17,
      intervention_cost_per_person: 185,
    },
  },
  "Admission-led value": {
    label: "Admission-led value",
    description: "Value is concentrated in avoided admissions and bed use.",
    overrides: {
      costing_method: "Admission + bed days",
      annual_fall_risk: 0.27,
      admission_rate_after_fall: 0.28,
      average_length_of_stay: 8,
      relative_risk_reduction: 0.19,
      intervention_cost_per_person: 175,
    },
  },
};

const COSTING_METHOD_OPTIONS: readonly Inputs["costing_method"][] = [
  "Admission costs only",
  "Admission + bed days",
];

const TARGETING_MODE_OPTIONS: readonly Inputs["targeting_mode"][] = [
  "Universal",
  "Risk-targeted",
  "High-risk only",
];

const PANEL_SHELL =
  "rounded-[26px] border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:p-5 xl:p-6";
const SUBCARD =
  "rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5";
const SUBCARD_DENSE =
  "rounded-2xl border border-slate-200 bg-white p-3.5 lg:p-4";
const SECTION_KICKER =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";
const SECTION_BODY = "text-sm leading-6 text-slate-700";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function safeDivide(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function getTargetingMultiplier(mode: Inputs["targeting_mode"]) {
  switch (mode) {
    case "Universal":
      return 0.9;
    case "Risk-targeted":
      return 1;
    case "High-risk only":
      return 1.15;
    default:
      return 1;
  }
}

function getScenarioCaseLabel(
  inputs: Inputs,
  selectedPreset: PresetOption,
): string {
  if (selectedPreset === "Conservative case") return "Conservative prevention case";
  if (selectedPreset === "Optimistic case") return "Optimistic prevention case";
  if (selectedPreset === "High-risk targeted") return "Targeted high-risk case";
  if (selectedPreset === "Adherence-led delivery") return "Adherence-led delivery case";
  if (selectedPreset === "Admission-led value") return "Admission-led value case";

  if (inputs.targeting_mode === "High-risk only") return "Targeted high-risk case";
  if (inputs.admission_rate_after_fall >= 0.26) return "Admission-led value case";
  if (inputs.uptake_rate * inputs.adherence_rate >= 0.62) {
    return "Participation-led prevention case";
  }
  return "Broad operational prevention case";
}

function runModel(inputs: Inputs): ModelResults {
  const yearlyResults: LocalYearlyResultRow[] = [];

  let cumulativeProgrammeCost = 0;
  let cumulativeGrossSavings = 0;
  let discountedFallsAvoidedTotal = 0;
  let discountedAdmissionsAvoidedTotal = 0;
  let discountedBedDaysAvoidedTotal = 0;
  let discountedQalysTotal = 0;

  const targetingMultiplier = getTargetingMultiplier(inputs.targeting_mode);

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participants =
      inputs.eligible_population *
      inputs.uptake_rate *
      inputs.adherence_rate *
      Math.pow(1 - inputs.participation_dropoff_rate, year - 1);

    const effectiveRiskReduction =
      inputs.relative_risk_reduction *
      Math.pow(1 - inputs.effect_decay_rate, year - 1) *
      targetingMultiplier;

    const fallsAvoidedRaw =
      participants *
      inputs.annual_fall_risk *
      clamp(effectiveRiskReduction, 0, 1);

    const admissionsAvoidedRaw =
      fallsAvoidedRaw * clamp(inputs.admission_rate_after_fall, 0, 1);

    const bedDaysAvoidedRaw =
      admissionsAvoidedRaw * Math.max(0, inputs.average_length_of_stay);

    const programmeCostRaw =
      participants * Math.max(0, inputs.intervention_cost_per_person);

    const grossSavingsRaw =
      inputs.costing_method === "Admission + bed days"
        ? admissionsAvoidedRaw * inputs.cost_per_admission +
          bedDaysAvoidedRaw * inputs.cost_per_bed_day
        : admissionsAvoidedRaw * inputs.cost_per_admission;

    const discountFactor = 1 / Math.pow(1 + inputs.discount_rate, year - 1);

    const fallsAvoidedDiscounted = fallsAvoidedRaw * discountFactor;
    const admissionsAvoidedDiscounted = admissionsAvoidedRaw * discountFactor;
    const bedDaysAvoidedDiscounted = bedDaysAvoidedRaw * discountFactor;
    const programmeCostDiscounted = programmeCostRaw * discountFactor;
    const grossSavingsDiscounted = grossSavingsRaw * discountFactor;
    const qalysDiscounted =
      fallsAvoidedRaw *
      Math.max(0, inputs.qaly_loss_per_serious_fall) *
      discountFactor;

    discountedFallsAvoidedTotal += fallsAvoidedDiscounted;
    discountedAdmissionsAvoidedTotal += admissionsAvoidedDiscounted;
    discountedBedDaysAvoidedTotal += bedDaysAvoidedDiscounted;
    discountedQalysTotal += qalysDiscounted;

    cumulativeProgrammeCost += programmeCostDiscounted;
    cumulativeGrossSavings += grossSavingsDiscounted;

    yearlyResults.push({
      year,
      falls_avoided: round(fallsAvoidedDiscounted),
      cumulative_programme_cost: cumulativeProgrammeCost,
      cumulative_gross_savings: cumulativeGrossSavings,
    });
  }

  const discountedNetCostTotal = cumulativeProgrammeCost - cumulativeGrossSavings;
  const discountedCostPerQaly =
    discountedQalysTotal > 0
      ? discountedNetCostTotal / discountedQalysTotal
      : Number.POSITIVE_INFINITY;

  return {
    falls_avoided_total: round(discountedFallsAvoidedTotal),
    admissions_avoided_total: round(discountedAdmissionsAvoidedTotal),
    bed_days_avoided_total: round(discountedBedDaysAvoidedTotal),
    discounted_programme_cost_total: cumulativeProgrammeCost,
    discounted_gross_savings_total: cumulativeGrossSavings,
    discounted_net_cost_total: discountedNetCostTotal,
    discounted_qalys_gained_total: discountedQalysTotal,
    discounted_cost_per_qaly: Number.isFinite(discountedCostPerQaly)
      ? discountedCostPerQaly
      : 0,
    yearly_results: yearlyResults,
  };
}

function runBoundedUncertainty(inputs: Inputs): LocalUncertaintyRow[] {
  const scenarios = [
    {
      case: "Low",
      riskMultiplier: 0.85,
      effectMultiplier: 0.8,
      costMultiplier: 1.1,
    },
    {
      case: "Base",
      riskMultiplier: 1,
      effectMultiplier: 1,
      costMultiplier: 1,
    },
    {
      case: "High",
      riskMultiplier: 1.15,
      effectMultiplier: 1.15,
      costMultiplier: 0.92,
    },
  ] as const;

  return scenarios.map((scenario) => {
    const scenarioInputs: Inputs = {
      ...inputs,
      annual_fall_risk: clamp(inputs.annual_fall_risk * scenario.riskMultiplier, 0, 1),
      relative_risk_reduction: clamp(
        inputs.relative_risk_reduction * scenario.effectMultiplier,
        0,
        1,
      ),
      intervention_cost_per_person: Math.max(
        0,
        inputs.intervention_cost_per_person * scenario.costMultiplier,
      ),
    };

    const results = runModel(scenarioInputs);
    const decisionStatus = getDecisionStatus(
      results,
      inputs.cost_effectiveness_threshold,
    );

    return {
      case: scenario.case,
      discounted_cost_per_qaly: results.discounted_cost_per_qaly,
      falls_avoided_total: results.falls_avoided_total,
      decision_status: decisionStatus,
    };
  });
}

function getDecisionStatus(results: ModelResults, threshold: number) {
  if (results.discounted_net_cost_total < 0) {
    return "Appears cost-saving";
  }

  if (results.discounted_cost_per_qaly <= threshold) {
    return "Appears cost-effective";
  }

  return "Above current threshold";
}

function getMobileDecisionStatus(status: string) {
  if (status === "Appears cost-saving") return "Cost-saving";
  if (status === "Appears cost-effective") return "Cost-effective";
  return "Above threshold";
}

function getNetCostLabel(results: ModelResults) {
  return results.discounted_net_cost_total < 0 ? "Net saving" : "Net cost";
}

function getMobileNetCostLabel(results: ModelResults) {
  return results.discounted_net_cost_total < 0 ? "Saving" : "Net cost";
}

function getMainDriverText(inputs: Inputs) {
  const candidates = [
    {
      label: "annual fall risk",
      score: inputs.annual_fall_risk,
    },
    {
      label: "reduction in falls",
      score: inputs.relative_risk_reduction,
    },
    {
      label: "cost per participant",
      score: inputs.intervention_cost_per_person / 1000,
    },
    {
      label: "uptake and adherence",
      score: inputs.uptake_rate * inputs.adherence_rate,
    },
  ];

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.label ?? "the core programme assumptions";
}

function getComparatorStyleReadout(
  inputs: Inputs,
  selectedPreset: PresetOption,
) {
  const caseLabel = getScenarioCaseLabel(inputs, selectedPreset);

  if (caseLabel === "Targeted high-risk case") {
    return "This case is best read as a concentrated-risk prevention option rather than a broad population offer.";
  }
  if (caseLabel === "Adherence-led delivery case") {
    return "This case mainly assumes delivery quality and sustained participation are doing the work.";
  }
  if (caseLabel === "Admission-led value case") {
    return "This case mainly depends on avoided admissions and bed use rather than modest falls reduction alone.";
  }
  if (caseLabel === "Conservative prevention case") {
    return "This case represents a cautious implementation view with weaker participation and smaller achieved effect.";
  }
  if (caseLabel === "Optimistic prevention case") {
    return "This case represents a stronger implementation view with better participation and a more durable effect.";
  }

  return "This case is best read as a broad operational prevention scenario with moderate reach and effect.";
}

function generateInterpretation(
  results: ModelResults,
  inputs: Inputs,
  uncertainty: LocalUncertaintyRow[],
  selectedPreset: PresetOption,
) {
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const baseCase = uncertainty.find((row) => row.case === "Base");
  const worstCase = uncertainty.find((row) => row.case === "Low");
  const bestCase = uncertainty.find((row) => row.case === "High");
  const caseLabel = getScenarioCaseLabel(inputs, selectedPreset);
  const mainDriver = getMainDriverText(inputs);

  const whatModelSuggests =
    decisionStatus === "Appears cost-saving"
      ? "The current case suggests the programme could save more than it costs while reducing falls and admissions."
      : decisionStatus === "Appears cost-effective"
        ? "The current case suggests the programme may be economically reasonable at the current threshold."
        : "The current case sits above the threshold, so the proposition depends on stronger achieved impact or lower delivery cost.";

  const whatDrivesResult = `The result is mainly shaped by ${mainDriver}, alongside who is targeted and how much participation holds over time.`;

  const uncertaintySignal =
    worstCase && bestCase
      ? worstCase.decision_status === bestCase.decision_status
        ? "The bounded range is directionally stable across low, base, and high cases."
        : "The bounded range crosses decision boundaries, so modest assumption shifts could change the conclusion."
      : "The bounded range should be interpreted cautiously.";

  const whatLooksFragile =
    baseCase &&
    baseCase.discounted_cost_per_qaly >
      inputs.cost_effectiveness_threshold * 0.85
      ? "The case sits fairly close to the threshold, so moderate changes in effect size or delivery cost could alter the decision."
      : uncertaintySignal;

  const whatToValidateNext =
    inputs.intervention_cost_per_person > inputs.cost_per_admission
      ? "Validate delivery cost realism, likely uptake, and whether the offer can sustain engagement at the assumed level."
      : "Validate achievable effect size, likely uptake, and the share of falls that genuinely translate into avoided admissions.";

  const recommendationTitle =
    decisionStatus === "Appears cost-saving"
      ? "Proceed as a prioritised option"
      : decisionStatus === "Appears cost-effective"
        ? "Promising option with validation"
        : "Validate before scaling";

  return {
    case_label: caseLabel,
    recommendation_title: recommendationTitle,
    what_model_suggests: whatModelSuggests,
    what_drives_result: whatDrivesResult,
    what_looks_fragile: whatLooksFragile,
    what_to_validate_next: whatToValidateNext,
    comparator_readout: getComparatorStyleReadout(inputs, selectedPreset),
  };
}

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item, index) => (
          <p key={`${item.name}-${index}`} className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{item.name}:</span>{" "}
            {formatCurrency(item.value ?? 0)}
          </p>
        ))}
      </div>
    </div>
  );
}

function NumberTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item, index) => (
          <p key={`${item.name}-${index}`} className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{item.name}:</span>{" "}
            {formatNumber(item.value ?? 0)}
          </p>
        ))}
      </div>
    </div>
  );
}

function FallsAvoidedChart({
  yearlyResults,
}: {
  yearlyResults: LocalYearlyResultRow[];
}) {
  const data = yearlyResults.map((row) => ({
    year: `Y${row.year}`,
    fallsAvoided: row.falls_avoided,
  }));

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Falls avoided
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual impact across the horizon.
        </p>
      </div>

      <div className="h-48 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => formatNumber(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={46}
            />
            <Tooltip content={<NumberTooltip />} />
            <Bar
              dataKey="fallsAvoided"
              name="Falls avoided"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CostVsSavingsChart({
  yearlyResults,
}: {
  yearlyResults: LocalYearlyResultRow[];
}) {
  const data = yearlyResults.map((row) => ({
    year: `Y${row.year}`,
    cumulativeProgrammeCost: row.cumulative_programme_cost,
    cumulativeGrossSavings: row.cumulative_gross_savings,
  }));

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Cost vs savings
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Cumulative delivery cost against gross savings.
        </p>
      </div>

      <div className="h-48 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => {
                const numeric = Number(value);
                if (Math.abs(numeric) >= 1000000) {
                  return `£${(numeric / 1000000).toFixed(1)}m`;
                }
                if (Math.abs(numeric) >= 1000) {
                  return `£${(numeric / 1000).toFixed(0)}k`;
                }
                return formatCurrency(numeric);
              }}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={54}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Line
              type="monotone"
              dataKey="cumulativeProgrammeCost"
              name="Programme cost"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cumulativeGrossSavings"
              name="Gross savings"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BoundedUncertaintyChart({
  uncertaintyRows,
  threshold,
}: {
  uncertaintyRows: LocalUncertaintyRow[];
  threshold: number;
}) {
  const data = uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
  }));

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Uncertainty
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Low, base, and high cases against the threshold.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="case" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => {
                const numeric = Number(value);
                if (Math.abs(numeric) >= 1000) {
                  return `£${(numeric / 1000).toFixed(0)}k`;
                }
                return formatCurrency(numeric);
              }}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={54}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <ReferenceLine
              y={threshold}
              stroke="#c2410c"
              strokeWidth={2}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
            <Bar
              dataKey="discountedCostPerQaly"
              name="Discounted cost per QALY"
              radius={[8, 8, 0, 0]}
            >
              {data.map((entry) => {
                const belowThreshold = entry.discountedCostPerQaly <= threshold;
                return (
                  <Cell
                    key={`cell-${entry.case}`}
                    fill={belowThreshold ? "#0f172a" : "#94a3b8"}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-600">
        Dark bars are at or below threshold.
      </p>
    </div>
  );
}

function MobileAccordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-slate-900">{title}</span>
        <ChevronDown
          className={cx(
            "h-4 w-4 text-slate-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? <div className="border-t border-slate-200 p-4">{children}</div> : null}
    </div>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
  dense = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    <section
      className={cx(
        PANEL_SHELL,
        dense ? "p-4 lg:p-5" : "p-4 sm:p-5 lg:p-5 xl:p-6",
      )}
    >
      <div className="mb-4 flex flex-col gap-3 lg:mb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-950 lg:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 self-start">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "strong";
}) {
  return (
    <div className={SUBCARD_DENSE}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={cx(
          "mt-1.5 tracking-tight text-slate-950",
          tone === "strong"
            ? "text-2xl font-semibold lg:text-[1.7rem]"
            : "text-lg font-semibold lg:text-xl",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MiniInsight({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={SUBCARD_DENSE}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function MobileTabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  help,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      />
      {help ? (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">{help}</span>
      ) : null}
    </label>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  help,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
  help?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-semibold text-slate-900">{display}</span>
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
      {help ? <p className="mt-1.5 text-xs leading-5 text-slate-500">{help}</p> : null}
    </div>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
  help,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {help ? (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">{help}</span>
      ) : null}
    </label>
  );
}

function AssumptionReviewCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className={SUBCARD_DENSE}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{value}</p>
      {note ? <p className="mt-1.5 text-sm leading-6 text-slate-600">{note}</p> : null}
    </div>
  );
}

export default function SafeStepApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>("Base case");
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [openSections, setOpenSections] = useState<
    Record<AssumptionSectionKey, boolean>
  >({
    "advanced-delivery": false,
    "advanced-risk": false,
    "advanced-economics": false,
  });

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertainty = useMemo(() => runBoundedUncertainty(inputs), [inputs]);

  const decisionStatus = useMemo(
    () => getDecisionStatus(results, inputs.cost_effectiveness_threshold),
    [results, inputs.cost_effectiveness_threshold],
  );

  const netCostLabel = useMemo(() => getNetCostLabel(results), [results]);
  const mainDriver = useMemo(() => getMainDriverText(inputs), [inputs]);
  const scenarioCaseLabel = useMemo(
    () => getScenarioCaseLabel(inputs, selectedPreset),
    [inputs, selectedPreset],
  );
  const interpretation = useMemo(
    () => generateInterpretation(results, inputs, uncertainty, selectedPreset),
    [results, inputs, uncertainty, selectedPreset],
  );

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: PresetOption) => {
    const definition = PRESET_DEFINITIONS[preset];
    setSelectedPreset(preset);
    setInputs((prev) => ({
      ...prev,
      ...definition.overrides,
    }));
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setSelectedPreset("Base case");
    setShowAdvancedMobile(false);
    setOpenSections({
      "advanced-delivery": false,
      "advanced-risk": false,
      "advanced-economics": false,
    });
  };

  const toggleSection = (key: AssumptionSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const summaryMetrics = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        tone="strong"
      />
    </div>
  );

  const desktopSecondaryMetrics = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Bed days avoided"
        value={formatNumber(results.bed_days_avoided_total)}
      />
      <MetricCard
        label="Programme cost"
        value={formatCurrency(results.discounted_programme_cost_total)}
      />
      <MetricCard
        label="Gross savings"
        value={formatCurrency(results.discounted_gross_savings_total)}
      />
      <MetricCard
        label="QALYs gained"
        value={results.discounted_qalys_gained_total.toFixed(2)}
      />
    </div>
  );

  const interpretationPanel = (
    <div className="grid gap-3 lg:grid-cols-3">
      <MiniInsight
        label="Recommendation"
        value={interpretation.recommendation_title}
      />
      <MiniInsight
        label="Case type"
        value={scenarioCaseLabel}
      />
      <MiniInsight
        label="Main driver"
        value={`The result is currently most shaped by ${mainDriver}.`}
      />
    </div>
  );

  const recommendationPanel = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MiniInsight
        label="What this suggests"
        value={interpretation.what_model_suggests}
      />
      <MiniInsight
        label="What drives it"
        value={interpretation.what_drives_result}
      />
      <MiniInsight
        label="What looks fragile"
        value={interpretation.what_looks_fragile}
      />
      <MiniInsight
        label="Validate next"
        value={interpretation.what_to_validate_next}
      />
    </div>
  );

  const quickAssumptionNotice = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
      Start with population, risk, delivery cost, and the core effect size.
    </div>
  );

  const presetControl = (
    <div className={SUBCARD}>
      <p className="mb-3 text-sm font-semibold text-slate-900">
        Scenario preset
      </p>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SelectInput
          label="Preset"
          value={selectedPreset}
          options={PRESET_OPTIONS}
          onChange={(value) => applyPreset(value)}
          help="Applies a coherent scenario without removing the ability to edit assumptions manually."
        />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Current preset
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">
            {selectedPreset}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {PRESET_DEFINITIONS[selectedPreset].description}
          </p>
        </div>
      </div>
    </div>
  );

  const assumptionsQuick = (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Core setup
        </p>
        <div className="mt-3 grid gap-4 lg:gap-3 xl:grid-cols-2">
          <SelectInput
            label="Targeting mode"
            value={inputs.targeting_mode}
            options={TARGETING_MODE_OPTIONS}
            onChange={(value) => updateInput("targeting_mode", value)}
            help="Primary lever for risk concentration."
          />

          <NumberInput
            label="Eligible population"
            value={inputs.eligible_population}
            onChange={(value) => updateInput("eligible_population", value)}
            step={100}
            help="Changes the scale of impact."
          />

          <NumberInput
            label="Cost per participant"
            value={inputs.intervention_cost_per_person}
            onChange={(value) => updateInput("intervention_cost_per_person", value)}
            step={10}
            help="Main delivery cost lever."
          />

          <div className="xl:col-span-2">
            <SelectInput
              label="Time horizon"
              value={String(inputs.time_horizon_years) as "1" | "3" | "5"}
              options={["1", "3", "5"]}
              onChange={(value) =>
                updateInput("time_horizon_years", Number(value) as 1 | 3 | 5)
              }
              help="Longer horizons often improve the economic picture."
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Risk and effect
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          These inputs do most of the work in the current case.
        </p>
        <div className="mt-3 grid gap-4">
          <SliderInput
            label="Annual fall risk"
            value={inputs.annual_fall_risk}
            onChange={(value) => updateInput("annual_fall_risk", value)}
            min={0}
            max={1}
            step={0.01}
            display={formatPercent(inputs.annual_fall_risk)}
            help="Major driver of avoided falls."
          />

          <SliderInput
            label="Reduction in falls"
            value={inputs.relative_risk_reduction}
            onChange={(value) => updateInput("relative_risk_reduction", value)}
            min={0}
            max={1}
            step={0.01}
            display={formatPercent(inputs.relative_risk_reduction)}
            help="Major driver of economic value."
          />
        </div>
      </div>
    </div>
  );

  const advancedSections = (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-delivery")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-delivery"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Delivery persistence
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-delivery"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-delivery"] ? (
          <div className="border-t border-slate-200 p-4">
            <p className="mb-4 text-xs leading-5 text-slate-600">
              Use these to adjust uptake, completion, and how the programme holds over time.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              <SliderInput
                label="Programme uptake"
                value={inputs.uptake_rate}
                onChange={(value) => updateInput("uptake_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.uptake_rate)}
              />
              <SliderInput
                label="Programme completion"
                value={inputs.adherence_rate}
                onChange={(value) => updateInput("adherence_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.adherence_rate)}
              />
              <SliderInput
                label="Annual participation drop-off"
                value={inputs.participation_dropoff_rate}
                onChange={(value) =>
                  updateInput("participation_dropoff_rate", value)
                }
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.participation_dropoff_rate)}
              />
              <SliderInput
                label="Annual effect decay"
                value={inputs.effect_decay_rate}
                onChange={(value) => updateInput("effect_decay_rate", value)}
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.effect_decay_rate)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-risk")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-risk"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Risk and pathway
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-risk"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-risk"] ? (
          <div className="border-t border-slate-200 p-4">
            <p className="mb-4 text-xs leading-5 text-slate-600">
              Use these to change pathway severity, admission risk, and bed use.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              <SliderInput
                label="Falls leading to admission"
                value={inputs.admission_rate_after_fall}
                onChange={(value) => updateInput("admission_rate_after_fall", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.admission_rate_after_fall)}
              />
              <NumberInput
                label="Average length of stay"
                value={inputs.average_length_of_stay}
                onChange={(value) => updateInput("average_length_of_stay", value)}
                step={0.5}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-economics")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-economics"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Cost inputs and threshold
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-economics"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-economics"] ? (
          <div className="border-t border-slate-200 p-4">
            <p className="mb-4 text-xs leading-5 text-slate-600">
              Use these to change how avoided impact is valued and interpreted.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              <SelectInput
                label="Costing method"
                value={inputs.costing_method}
                options={COSTING_METHOD_OPTIONS}
                onChange={(value) => updateInput("costing_method", value)}
                help="Defines how avoided impact is valued."
              />
              <NumberInput
                label="Cost-effectiveness threshold"
                value={inputs.cost_effectiveness_threshold}
                onChange={(value) =>
                  updateInput("cost_effectiveness_threshold", value)
                }
                step={1000}
              />
              <NumberInput
                label="Cost per admission"
                value={inputs.cost_per_admission}
                onChange={(value) => updateInput("cost_per_admission", value)}
                step={100}
              />
              <NumberInput
                label="Cost per bed day"
                value={inputs.cost_per_bed_day}
                onChange={(value) => updateInput("cost_per_bed_day", value)}
                step={50}
              />
              <NumberInput
                label="QALY loss per serious fall"
                value={inputs.qaly_loss_per_serious_fall}
                onChange={(value) =>
                  updateInput("qaly_loss_per_serious_fall", value)
                }
                step={0.01}
              />
              <NumberInput
                label="Discount rate"
                value={inputs.discount_rate}
                onChange={(value) => updateInput("discount_rate", value)}
                step={0.005}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const assumptionsReview = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <AssumptionReviewCard
        label="Preset"
        value={selectedPreset}
        note={PRESET_DEFINITIONS[selectedPreset].description}
      />
      <AssumptionReviewCard
        label="Case type"
        value={scenarioCaseLabel}
      />
      <AssumptionReviewCard
        label="Targeting mode"
        value={inputs.targeting_mode}
        note="Primary determinant of who is reached and how concentrated risk is."
      />
      <AssumptionReviewCard
        label="Eligible population"
        value={formatNumber(inputs.eligible_population)}
      />
      <AssumptionReviewCard
        label="Annual fall risk"
        value={formatPercent(inputs.annual_fall_risk)}
      />
      <AssumptionReviewCard
        label="Reduction in falls"
        value={formatPercent(inputs.relative_risk_reduction)}
      />
      <AssumptionReviewCard
        label="Cost per participant"
        value={formatCurrency(inputs.intervention_cost_per_person)}
      />
      <AssumptionReviewCard
        label="Costing method"
        value={inputs.costing_method}
      />
      <AssumptionReviewCard
        label="Time horizon"
        value={`${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"}`}
      />
      <AssumptionReviewCard
        label="Discount rate"
        value={formatPercent(inputs.discount_rate)}
      />
      <AssumptionReviewCard
        label="Threshold"
        value={formatCurrency(inputs.cost_effectiveness_threshold)}
      />
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <FallsAvoidedChart yearlyResults={results.yearly_results} />

      <MobileAccordion title="Cost vs savings">
        <CostVsSavingsChart yearlyResults={results.yearly_results} />
      </MobileAccordion>

      <MobileAccordion title="Uncertainty">
        <BoundedUncertaintyChart
          uncertaintyRows={uncertainty}
          threshold={inputs.cost_effectiveness_threshold}
        />
      </MobileAccordion>
    </div>
  );

  const desktopCharts = (
    <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
      <FallsAvoidedChart yearlyResults={results.yearly_results} />
      <CostVsSavingsChart yearlyResults={results.yearly_results} />
      <div className="lg:col-span-2">
        <BoundedUncertaintyChart
          uncertaintyRows={uncertainty}
          threshold={inputs.cost_effectiveness_threshold}
        />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Health Economics Scenario Lab
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          SafeStep
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          Explore how falls prevention might reduce falls, admissions, bed use,
          and economic burden under different assumptions.
        </p>
      </div>

      <div className="sticky top-[72px] z-20 mb-4 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 items-start gap-2.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Signal
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-950">
              {getMobileDecisionStatus(decisionStatus)}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">
              {getMobileNetCostLabel(results)}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatCurrency(Math.abs(results.discounted_net_cost_total))}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">Cost/QALY</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatCurrency(results.discounted_cost_per_qaly)}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-[72px] z-20 mb-4 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:block">
        <div className="grid grid-cols-3 items-start gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Signal
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-950">
              {getMobileDecisionStatus(decisionStatus)}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">
              {getMobileNetCostLabel(results)}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatCurrency(Math.abs(results.discounted_net_cost_total))}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">Cost/QALY</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatCurrency(results.discounted_cost_per_qaly)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        <MobileTabButton
          active={mobileTab === "summary"}
          onClick={() => setMobileTab("summary")}
          icon={<BarChart3 className="h-4 w-4" />}
        >
          Summary
        </MobileTabButton>
        <MobileTabButton
          active={mobileTab === "assumptions"}
          onClick={() => setMobileTab("assumptions")}
          icon={<SlidersHorizontal className="h-4 w-4" />}
        >
          Assumptions
        </MobileTabButton>
        <MobileTabButton
          active={mobileTab === "analysis"}
          onClick={() => setMobileTab("analysis")}
          icon={<FileSearch className="h-4 w-4" />}
        >
          Analysis
        </MobileTabButton>
      </div>

      <div className="mb-4 hidden gap-2 overflow-x-auto pb-1 lg:flex">
        <MobileTabButton
          active={mobileTab === "summary"}
          onClick={() => setMobileTab("summary")}
          icon={<BarChart3 className="h-4 w-4" />}
        >
          Summary
        </MobileTabButton>
        <MobileTabButton
          active={mobileTab === "assumptions"}
          onClick={() => setMobileTab("assumptions")}
          icon={<SlidersHorizontal className="h-4 w-4" />}
        >
          Assumptions
        </MobileTabButton>
        <MobileTabButton
          active={mobileTab === "analysis"}
          onClick={() => setMobileTab("analysis")}
          icon={<FileSearch className="h-4 w-4" />}
        >
          Analysis
        </MobileTabButton>
      </div>

      <div className="lg:hidden">
        <div className={cx(mobileTab !== "summary" && "hidden")}>
          <SectionCard
            title="Headline view"
            description="Start with the current signal and the main outputs."
            dense
          >
            {summaryMetrics}
            <div className="mt-4">{interpretationPanel}</div>
            <div className="mt-4">{recommendationPanel}</div>
          </SectionCard>

          <div className="mt-4">
            <SectionCard
              title="Charts"
              description="Primary chart first, with supporting views below."
              dense
            >
              {mobileCharts}
            </SectionCard>
          </div>
        </div>

        <div className={cx(mobileTab !== "assumptions" && "hidden")}>
          <SectionCard
            title="Assumptions"
            description="Quick assumptions first. Advanced settings stay below."
            action={
              <button
                type="button"
                onClick={resetToBaseCase}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to base case
              </button>
            }
            dense
          >
            <div className="space-y-4">
              {presetControl}

              <div className={SUBCARD}>
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Quick assumptions
                </p>
                {quickAssumptionNotice}
                <div className="mt-4">{assumptionsQuick}</div>
              </div>

              <div className={SUBCARD}>
                <button
                  type="button"
                  onClick={() => setShowAdvancedMobile((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={showAdvancedMobile}
                >
                  <span className="text-sm font-medium text-slate-900">
                    Show advanced assumptions
                  </span>
                  <ChevronDown
                    className={cx(
                      "h-4 w-4 text-slate-500 transition-transform",
                      showAdvancedMobile && "rotate-180",
                    )}
                  />
                </button>

                {showAdvancedMobile ? (
                  <div className="mt-4">{advancedSections}</div>
                ) : null}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className={cx(mobileTab !== "analysis" && "hidden")}>
          <SectionCard
            title="Analysis"
            description="Review the current case, bounded uncertainty, and the next checks."
            dense
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3">
                <MetricCard
                  label="Case type"
                  value={scenarioCaseLabel}
                />
                <MetricCard
                  label="Bed days avoided"
                  value={formatNumber(results.bed_days_avoided_total)}
                />
                <MetricCard
                  label="QALYs gained"
                  value={results.discounted_qalys_gained_total.toFixed(2)}
                />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Decision support readout</h3>
                <div className="mt-3 grid gap-3">
                  <AssumptionReviewCard
                    label="Recommendation"
                    value={interpretation.recommendation_title}
                  />
                  <AssumptionReviewCard
                    label="Case interpretation"
                    value={scenarioCaseLabel}
                    note={interpretation.comparator_readout}
                  />
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Recommendation</h3>
                <div className="mt-3 space-y-3">
                  <p className={SECTION_BODY}>{interpretation.what_model_suggests}</p>
                  <p className={SECTION_BODY}>{interpretation.what_drives_result}</p>
                  <p className={SECTION_BODY}>{interpretation.what_looks_fragile}</p>
                  <p className={SECTION_BODY}>{interpretation.what_to_validate_next}</p>
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.falls_avoided_total)} falls avoided · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <MobileAccordion title="Review current assumptions">
                <div>{assumptionsReview}</div>
              </MobileAccordion>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className={cx(mobileTab !== "summary" && "hidden")}>
          <SectionCard
            title="Headline view"
            description="Start with the current signal and the main outputs."
            dense
          >
            {summaryMetrics}
            <div className="mt-3">{desktopSecondaryMetrics}</div>
            <div className="mt-4">{interpretationPanel}</div>
            <div className="mt-4">{recommendationPanel}</div>
          </SectionCard>

          <div className="mt-4">
            <SectionCard
              title="Charts"
              description="Primary chart first, with supporting views below."
              dense
            >
              {desktopCharts}
            </SectionCard>
          </div>
        </div>

        <div className={cx(mobileTab !== "assumptions" && "hidden")}>
          <SectionCard
            title="Assumptions"
            description="Quick assumptions first. Advanced settings stay below."
            action={
              <button
                type="button"
                onClick={resetToBaseCase}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to base case
              </button>
            }
            dense
          >
            <div className="space-y-4">
              {presetControl}

              <div className={SUBCARD}>
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Quick assumptions
                </p>
                {quickAssumptionNotice}
                <div className="mt-4">{assumptionsQuick}</div>
              </div>

              <div className={SUBCARD}>
                <button
                  type="button"
                  onClick={() => setShowAdvancedMobile((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={showAdvancedMobile}
                >
                  <span className="text-sm font-medium text-slate-900">
                    Show advanced assumptions
                  </span>
                  <ChevronDown
                    className={cx(
                      "h-4 w-4 text-slate-500 transition-transform",
                      showAdvancedMobile && "rotate-180",
                    )}
                  />
                </button>

                {showAdvancedMobile ? (
                  <div className="mt-4">{advancedSections}</div>
                ) : null}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className={cx(mobileTab !== "analysis" && "hidden")}>
          <SectionCard
            title="Analysis"
            description="Review the current case, bounded uncertainty, and the next checks."
            dense
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard
                  label="Case type"
                  value={scenarioCaseLabel}
                />
                <MetricCard
                  label="Bed days avoided"
                  value={formatNumber(results.bed_days_avoided_total)}
                />
                <MetricCard
                  label="QALYs gained"
                  value={results.discounted_qalys_gained_total.toFixed(2)}
                />
                <MetricCard
                  label="Programme cost"
                  value={formatCurrency(results.discounted_programme_cost_total)}
                />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Decision support readout</h3>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  <MiniInsight
                    label="Recommendation"
                    value={interpretation.recommendation_title}
                  />
                  <MiniInsight
                    label="Case interpretation"
                    value={interpretation.comparator_readout}
                  />
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Recommendation</h3>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  <p className={SECTION_BODY}>{interpretation.what_model_suggests}</p>
                  <p className={SECTION_BODY}>{interpretation.what_drives_result}</p>
                  <p className={SECTION_BODY}>{interpretation.what_looks_fragile}</p>
                  <p className={SECTION_BODY}>{interpretation.what_to_validate_next}</p>
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.falls_avoided_total)} falls avoided · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <MobileAccordion title="Review current assumptions">
                <div>{assumptionsReview}</div>
              </MobileAccordion>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}