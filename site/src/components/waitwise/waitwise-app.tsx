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
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TargetingMode =
  | "Broad waiting list"
  | "Higher-risk targeting"
  | "Long-wait targeting";

type CostingMethod =
  | "Escalation and admission savings only"
  | "Bed-day value only"
  | "Combined illustrative view";

type Inputs = {
  starting_waiting_list_size: number;
  monthly_inflow: number;
  baseline_monthly_throughput: number;
  intervention_reach_rate: number;
  demand_reduction_effect: number;
  throughput_increase_effect: number;
  escalation_reduction_effect: number;
  intervention_cost_per_patient_reached: number;
  effect_decay_rate: number;
  participation_dropoff_rate: number;
  monthly_escalation_rate: number;
  admission_rate_after_escalation: number;
  average_length_of_stay: number;
  qaly_gain_per_escalation_avoided: number;
  cost_per_escalation: number;
  cost_per_admission: number;
  cost_per_bed_day: number;
  costing_method: CostingMethod;
  targeting_mode: TargetingMode;
  time_horizon_years: 1 | 3 | 5;
  discount_rate: number;
  cost_effectiveness_threshold: number;
};

type MobileTab = "summary" | "assumptions" | "analysis";

type AssumptionSectionKey =
  | "advanced-delivery"
  | "advanced-pathway"
  | "advanced-economics";

type YearlyResultRow = {
  year: number;
  waiting_list_start: number;
  waiting_list_end: number;
  waiting_list_reduction: number;
  escalations_avoided: number;
  admissions_avoided: number;
  bed_days_avoided: number;
  patients_reached: number;
  programme_cost: number;
  gross_savings: number;
  net_cost: number;
  qalys_gained: number;
  discount_factor: number;
  discounted_programme_cost: number;
  discounted_gross_savings: number;
  discounted_net_cost: number;
  discounted_qalys: number;
  cumulative_programme_cost: number;
  cumulative_gross_savings: number;
  cumulative_net_cost: number;
};

type ModelResults = {
  waiting_list_start_year_1: number;
  waiting_list_end_final: number;
  waiting_list_reduction_total: number;
  escalations_avoided_total: number;
  admissions_avoided_total: number;
  bed_days_avoided_total: number;
  programme_cost_total: number;
  gross_savings_total: number;
  discounted_programme_cost_total: number;
  discounted_gross_savings_total: number;
  discounted_net_cost_total: number;
  discounted_qalys_total: number;
  discounted_cost_per_qaly: number;
  roi: number;
  yearly_results: YearlyResultRow[];
  break_even_effect_required: number;
  break_even_cost_per_patient: number;
  break_even_horizon: string;
};

type UncertaintyRow = {
  case: string;
  waiting_list_reduction_total: number;
  discounted_net_cost_total: number;
  discounted_cost_per_qaly: number;
  dominant_domain: string;
  decision_status: string;
};

const DEFAULT_INPUTS: Inputs = {
  starting_waiting_list_size: 8000,
  monthly_inflow: 900,
  baseline_monthly_throughput: 800,
  intervention_reach_rate: 0.4,
  demand_reduction_effect: 0.08,
  throughput_increase_effect: 0.1,
  escalation_reduction_effect: 0.12,
  intervention_cost_per_patient_reached: 180,
  effect_decay_rate: 0.1,
  participation_dropoff_rate: 0.05,
  monthly_escalation_rate: 0.03,
  admission_rate_after_escalation: 0.25,
  average_length_of_stay: 4,
  qaly_gain_per_escalation_avoided: 0.08,
  cost_per_escalation: 700,
  cost_per_admission: 3500,
  cost_per_bed_day: 400,
  costing_method: "Escalation and admission savings only",
  targeting_mode: "Broad waiting list",
  time_horizon_years: 3,
  discount_rate: 0.035,
  cost_effectiveness_threshold: 20000,
};

const TARGETING_MODE_OPTIONS: readonly TargetingMode[] = [
  "Broad waiting list",
  "Higher-risk targeting",
  "Long-wait targeting",
];

const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Escalation and admission savings only",
  "Bed-day value only",
  "Combined illustrative view",
];

const TARGETING_MODE_MAP: Record<
  TargetingMode,
  { population_multiplier: number; reach_multiplier: number; risk_multiplier: number }
> = {
  "Broad waiting list": {
    population_multiplier: 1,
    reach_multiplier: 1,
    risk_multiplier: 1,
  },
  "Higher-risk targeting": {
    population_multiplier: 0.6,
    reach_multiplier: 1.05,
    risk_multiplier: 1.3,
  },
  "Long-wait targeting": {
    population_multiplier: 0.45,
    reach_multiplier: 1.1,
    risk_multiplier: 1.45,
  },
};

const PANEL_SHELL =
  "rounded-[26px] border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:p-5 xl:p-6";
const SUBCARD =
  "rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5";
const SUBCARD_DENSE =
  "rounded-2xl border border-slate-200 bg-white p-3.5 lg:p-4";
const SECTION_KICKER =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";
const SECTION_TITLE =
  "mt-1 text-lg font-semibold tracking-tight text-slate-950 lg:text-[1.1rem]";
const SECTION_BODY = "text-sm leading-6 text-slate-700";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clampRate(value: number) {
  return Math.max(0, Math.min(1, value));
}

function safeDivide(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function formatCurrency(value: number) {
  return `£${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatRatio(value: number) {
  return `${value.toFixed(2)}x`;
}

function getDiscountFactor(year: number, discountRate: number) {
  return 1 / Math.pow(1 + discountRate, year - 1);
}

function getTargetingAdjustments(inputs: Inputs) {
  const targeting = TARGETING_MODE_MAP[inputs.targeting_mode];
  const adjusted_waiting_list =
    inputs.starting_waiting_list_size * targeting.population_multiplier;
  const adjusted_reach_rate = clampRate(
    inputs.intervention_reach_rate * targeting.reach_multiplier,
  );
  const adjusted_escalation_rate = clampRate(
    inputs.monthly_escalation_rate * targeting.risk_multiplier,
  );

  return {
    adjusted_waiting_list,
    adjusted_reach_rate,
    adjusted_escalation_rate,
  };
}

function calculateGrossSavings(
  escalationsAvoided: number,
  admissionsAvoided: number,
  bedDaysAvoided: number,
  inputs: Inputs,
) {
  const escalationAndAdmissionSavings =
    escalationsAvoided * inputs.cost_per_escalation +
    admissionsAvoided * inputs.cost_per_admission;

  const bedDayValue = bedDaysAvoided * inputs.cost_per_bed_day;

  if (inputs.costing_method === "Escalation and admission savings only") {
    return escalationAndAdmissionSavings;
  }

  if (inputs.costing_method === "Bed-day value only") {
    return bedDayValue;
  }

  return escalationAndAdmissionSavings + bedDayValue;
}

function runModelCore(inputs: Inputs) {
  const targeting = getTargetingAdjustments(inputs);

  const startingWaitingList = targeting.adjusted_waiting_list;
  const monthlyInflow = inputs.monthly_inflow;
  const monthlyThroughput = inputs.baseline_monthly_throughput;

  const yearlyRows: YearlyResultRow[] = [];
  let cumulativeProgrammeCost = 0;
  let cumulativeGrossSavings = 0;
  let cumulativeNetCost = 0;
  let waitingListCurrent = startingWaitingList;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const effectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);
    const participationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );

    const effectiveReach =
      targeting.adjusted_reach_rate * participationMultiplier;
    const demandReduction = inputs.demand_reduction_effect * effectMultiplier;
    const throughputIncrease =
      inputs.throughput_increase_effect * effectMultiplier;
    const escalationReduction =
      inputs.escalation_reduction_effect * effectMultiplier;

    const annualInflow = monthlyInflow * 12;
    const annualBaselineThroughput = monthlyThroughput * 12;

    const reducedInflow =
      annualInflow * (1 - demandReduction * effectiveReach);
    const improvedThroughput =
      annualBaselineThroughput * (1 + throughputIncrease * effectiveReach);

    const waitingListNext = Math.max(
      waitingListCurrent + reducedInflow - improvedThroughput,
      0,
    );
    const baselineWaitingListNext = Math.max(
      waitingListCurrent + annualInflow - annualBaselineThroughput,
      0,
    );

    const waitingListReduction = Math.max(
      baselineWaitingListNext - waitingListNext,
      0,
    );

    const annualEscalationsBaseline =
      waitingListCurrent * targeting.adjusted_escalation_rate * 12;

    const escalationsAvoided =
      annualEscalationsBaseline * escalationReduction * effectiveReach;
    const admissionsAvoided =
      escalationsAvoided * inputs.admission_rate_after_escalation;
    const bedDaysAvoided =
      admissionsAvoided * inputs.average_length_of_stay;

    const patientsReached = waitingListCurrent * effectiveReach;
    const programmeCost =
      patientsReached * inputs.intervention_cost_per_patient_reached;

    const grossSavings = calculateGrossSavings(
      escalationsAvoided,
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );

    const netCost = programmeCost - grossSavings;
    const qalysGained =
      escalationsAvoided * inputs.qaly_gain_per_escalation_avoided;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);
    const discountedProgrammeCost = programmeCost * discountFactor;
    const discountedGrossSavings = grossSavings * discountFactor;
    const discountedNetCost = netCost * discountFactor;
    const discountedQalys = qalysGained * discountFactor;

    cumulativeProgrammeCost += programmeCost;
    cumulativeGrossSavings += grossSavings;
    cumulativeNetCost += netCost;

    yearlyRows.push({
      year,
      waiting_list_start: waitingListCurrent,
      waiting_list_end: waitingListNext,
      waiting_list_reduction: waitingListReduction,
      escalations_avoided: escalationsAvoided,
      admissions_avoided: admissionsAvoided,
      bed_days_avoided: bedDaysAvoided,
      patients_reached: patientsReached,
      programme_cost: programmeCost,
      gross_savings: grossSavings,
      net_cost: netCost,
      qalys_gained: qalysGained,
      discount_factor: discountFactor,
      discounted_programme_cost: discountedProgrammeCost,
      discounted_gross_savings: discountedGrossSavings,
      discounted_net_cost: discountedNetCost,
      discounted_qalys: discountedQalys,
      cumulative_programme_cost: cumulativeProgrammeCost,
      cumulative_gross_savings: cumulativeGrossSavings,
      cumulative_net_cost: cumulativeNetCost,
    });

    waitingListCurrent = waitingListNext;
  }

  const waiting_list_reduction_total = yearlyRows.reduce(
    (sum, row) => sum + row.waiting_list_reduction,
    0,
  );
  const escalations_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.escalations_avoided,
    0,
  );
  const admissions_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.admissions_avoided,
    0,
  );
  const bed_days_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.bed_days_avoided,
    0,
  );
  const programme_cost_total = yearlyRows.reduce(
    (sum, row) => sum + row.programme_cost,
    0,
  );
  const gross_savings_total = yearlyRows.reduce(
    (sum, row) => sum + row.gross_savings,
    0,
  );
  const discounted_programme_cost_total = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_programme_cost,
    0,
  );
  const discounted_gross_savings_total = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_gross_savings,
    0,
  );
  const discounted_net_cost_total = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_net_cost,
    0,
  );
  const discounted_qalys_total = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_qalys,
    0,
  );

  const discounted_cost_per_qaly = safeDivide(
    discounted_net_cost_total,
    discounted_qalys_total,
  );
  const roi = safeDivide(gross_savings_total, programme_cost_total);

  return {
    waiting_list_start_year_1: yearlyRows[0]?.waiting_list_start ?? 0,
    waiting_list_end_final:
      yearlyRows[yearlyRows.length - 1]?.waiting_list_end ?? 0,
    waiting_list_reduction_total,
    escalations_avoided_total,
    admissions_avoided_total,
    bed_days_avoided_total,
    programme_cost_total,
    gross_savings_total,
    discounted_programme_cost_total,
    discounted_gross_savings_total,
    discounted_net_cost_total,
    discounted_qalys_total,
    discounted_cost_per_qaly,
    roi,
    yearly_results: yearlyRows,
  };
}

function calculateBreakEvenEffect(inputs: Inputs) {
  const targeting = getTargetingAdjustments(inputs);
  const waitingListBase = targeting.adjusted_waiting_list;

  let numerator = 0;
  let denominator = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);
    const effectiveReach =
      targeting.adjusted_reach_rate * participationMultiplier;

    const patientsReached = waitingListBase * effectiveReach;

    const escalationsAvoidedPerUnit =
      waitingListBase *
      targeting.adjusted_escalation_rate *
      12 *
      effectMultiplier *
      effectiveReach;

    const admissionsAvoidedPerUnit =
      escalationsAvoidedPerUnit * inputs.admission_rate_after_escalation;
    const bedDaysAvoidedPerUnit =
      admissionsAvoidedPerUnit * inputs.average_length_of_stay;

    const grossSavingsPerUnit = calculateGrossSavings(
      escalationsAvoidedPerUnit,
      admissionsAvoidedPerUnit,
      bedDaysAvoidedPerUnit,
      inputs,
    );

    const qalyValuePerUnit =
      escalationsAvoidedPerUnit *
      inputs.qaly_gain_per_escalation_avoided *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    numerator +=
      patientsReached *
      inputs.intervention_cost_per_patient_reached *
      discountFactor;

    denominator += (grossSavingsPerUnit + qalyValuePerUnit) * discountFactor;
  }

  return safeDivide(numerator, denominator);
}

function calculateBreakEvenCostPerPatient(inputs: Inputs) {
  const targeting = getTargetingAdjustments(inputs);
  const waitingListBase = targeting.adjusted_waiting_list;

  let totalDiscountedPatientsReached = 0;
  let totalDiscountedValue = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);
    const effectiveReach =
      targeting.adjusted_reach_rate * participationMultiplier;

    const patientsReached = waitingListBase * effectiveReach;

    const blendedEffect =
      (inputs.demand_reduction_effect +
        inputs.throughput_increase_effect +
        inputs.escalation_reduction_effect) /
      3;

    const escalationsAvoided =
      waitingListBase *
      targeting.adjusted_escalation_rate *
      12 *
      blendedEffect *
      effectMultiplier *
      effectiveReach;

    const admissionsAvoided =
      escalationsAvoided * inputs.admission_rate_after_escalation;
    const bedDaysAvoided =
      admissionsAvoided * inputs.average_length_of_stay;

    const grossSavings = calculateGrossSavings(
      escalationsAvoided,
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );

    const qalyValue =
      escalationsAvoided *
      inputs.qaly_gain_per_escalation_avoided *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    totalDiscountedPatientsReached += patientsReached * discountFactor;
    totalDiscountedValue += (grossSavings + qalyValue) * discountFactor;
  }

  return safeDivide(totalDiscountedValue, totalDiscountedPatientsReached);
}

function calculateBreakEvenHorizon(inputs: Inputs, maxYears = 10) {
  for (let horizon = 1; horizon <= maxYears; horizon += 1) {
    const testInputs = { ...inputs, time_horizon_years: horizon as 1 | 3 | 5 };
    const result = runModelCore(testInputs);

    if (
      result.discounted_cost_per_qaly > 0 &&
      result.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
    ) {
      return `${horizon} year${horizon === 1 ? "" : "s"}`;
    }

    if (result.discounted_net_cost_total < 0) {
      return `${horizon} year${horizon === 1 ? "" : "s"}`;
    }
  }

  return `>${maxYears} years`;
}

function runModel(inputs: Inputs): ModelResults {
  const core = runModelCore(inputs);

  return {
    ...core,
    break_even_effect_required: clampRate(calculateBreakEvenEffect(inputs)),
    break_even_cost_per_patient: calculateBreakEvenCostPerPatient(inputs),
    break_even_horizon: calculateBreakEvenHorizon(inputs, 10),
  };
}

function getDecisionStatus(results: ModelResults, threshold: number) {
  if (results.discounted_net_cost_total < 0) return "Appears cost-saving";
  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
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
  if (inputs.targeting_mode !== "Broad waiting list") {
    return "targeting and concentration of escalation risk";
  }
  if (inputs.costing_method === "Combined illustrative view") {
    return "the costing method and blend of effects";
  }
  if (inputs.intervention_cost_per_patient_reached >= 250) {
    return "delivery cost per patient reached";
  }
  if (
    inputs.throughput_increase_effect >= inputs.demand_reduction_effect &&
    inputs.throughput_increase_effect >= inputs.escalation_reduction_effect
  ) {
    return "throughput improvement";
  }
  if (
    inputs.demand_reduction_effect >= inputs.throughput_increase_effect &&
    inputs.demand_reduction_effect >= inputs.escalation_reduction_effect
  ) {
    return "demand reduction";
  }
  if (inputs.participation_dropoff_rate >= 0.15) {
    return "participation persistence over time";
  }
  return "escalation reduction while waiting";
}

function runBoundedUncertainty(inputs: Inputs): UncertaintyRow[] {
  const cases = [
    {
      case: "Low",
      overrides: {
        demand_reduction_effect: clampRate(inputs.demand_reduction_effect * 0.8),
        throughput_increase_effect: clampRate(
          inputs.throughput_increase_effect * 0.8,
        ),
        escalation_reduction_effect: clampRate(
          inputs.escalation_reduction_effect * 0.8,
        ),
        intervention_cost_per_patient_reached:
          inputs.intervention_cost_per_patient_reached * 1.2,
        qaly_gain_per_escalation_avoided:
          inputs.qaly_gain_per_escalation_avoided * 0.8,
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 1.2,
        ),
      },
      dominant_domain: "Delivery assumptions",
    },
    {
      case: "Base",
      overrides: {},
      dominant_domain: "Base case",
    },
    {
      case: "High",
      overrides: {
        demand_reduction_effect: clampRate(inputs.demand_reduction_effect * 1.2),
        throughput_increase_effect: clampRate(
          inputs.throughput_increase_effect * 1.2,
        ),
        escalation_reduction_effect: clampRate(
          inputs.escalation_reduction_effect * 1.2,
        ),
        intervention_cost_per_patient_reached:
          inputs.intervention_cost_per_patient_reached * 0.8,
        qaly_gain_per_escalation_avoided:
          inputs.qaly_gain_per_escalation_avoided * 1.2,
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 0.8,
        ),
      },
      dominant_domain: "Clinical and delivery assumptions",
    },
  ] as const;

  return cases.map((scenario) => {
    const caseInputs: Inputs = {
      ...inputs,
      ...scenario.overrides,
    };

    const result = runModelCore(caseInputs);

    const decision_status =
      result.discounted_net_cost_total < 0
        ? "Appears cost-saving"
        : result.discounted_cost_per_qaly > 0 &&
            result.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
          ? "Appears cost-effective"
          : "Above current threshold";

    return {
      case: scenario.case,
      waiting_list_reduction_total: result.waiting_list_reduction_total,
      discounted_net_cost_total: result.discounted_net_cost_total,
      discounted_cost_per_qaly: result.discounted_cost_per_qaly,
      dominant_domain: scenario.dominant_domain,
      decision_status,
    };
  });
}

function assessUncertaintyRobustness(
  uncertaintyRows: UncertaintyRow[],
  threshold: number,
) {
  const allBelow = uncertaintyRows.every(
    (row) => row.discounted_cost_per_qaly <= threshold,
  );
  const allCostSaving = uncertaintyRows.every(
    (row) => row.discounted_net_cost_total < 0,
  );
  const anyBelow = uncertaintyRows.some(
    (row) => row.discounted_cost_per_qaly <= threshold,
  );

  if (allCostSaving) {
    return "The case stays cost-saving across the bounded cases.";
  }
  if (allBelow) {
    return "The case stays below threshold across the bounded cases.";
  }
  if (anyBelow) {
    return "The bounded range crosses the threshold, so the case looks sensitive.";
  }
  return "The bounded range stays above the threshold.";
}

function generateInterpretation(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
) {
  const threshold = inputs.cost_effectiveness_threshold;
  const horizon = inputs.time_horizon_years;
  const breakEvenHorizon = results.break_even_horizon;
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    threshold,
  );
  const dependency = getMainDriverText(inputs);

  const whatModelSuggests =
    results.discounted_net_cost_total < 0
      ? `The current case suggests backlog reduction with a discounted net saving over ${horizon} year${horizon === 1 ? "" : "s"}.`
      : results.discounted_cost_per_qaly > 0 &&
          results.discounted_cost_per_qaly <= threshold
        ? `The current case suggests operational benefit and a cost-effective result over ${horizon} year${horizon === 1 ? "" : "s"}, but not a net saving.`
        : `The current case suggests operational benefit, but the economic result stays above the current threshold over ${horizon} year${horizon === 1 ? "" : "s"}.`;

  const whatDrivesResult = `The result is mainly shaped by ${dependency}, alongside reach, targeting, and whether the effect holds over time.`;

  const whatLooksFragile =
    inputs.costing_method === "Combined illustrative view"
      ? "The result may look stronger than reality if overlapping cost components are counted together."
      : inputs.targeting_mode === "Broad waiting list"
        ? "Broad implementation may dilute value if the highest-opportunity patients are only a subset of the list."
        : uncertaintyText;

  const whatToValidateNext = `Validate local cost inputs, escalation risk, and whether the case still looks worthwhile over about ${breakEvenHorizon}.`;

  return {
    what_model_suggests: whatModelSuggests,
    what_drives_result: whatDrivesResult,
    what_looks_fragile: whatLooksFragile,
    what_to_validate_next: whatToValidateNext,
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

function WaitingListReductionChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    waitingListReduction: row.waiting_list_reduction,
  }));

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Waiting list reduction
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual backlog reduction across the selected horizon.
        </p>
      </div>

      <div className="h-52 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => formatNumber(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={56}
            />
            <Tooltip content={<NumberTooltip />} />
            <Bar
              dataKey="waitingListReduction"
              name="Waiting list reduction"
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
  yearlyResults: YearlyResultRow[];
}) {
  const data = yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
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
          Cumulative delivery cost compared with gross savings.
        </p>
      </div>

      <div className="h-52 w-full lg:h-64 xl:h-72">
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
              width={58}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
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

function PathwayImpactChart({
  results,
}: {
  results: ModelResults;
}) {
  const data = [
    { label: "Waiting list", value: results.waiting_list_reduction_total },
    { label: "Escalations", value: results.escalations_avoided_total },
    { label: "Admissions", value: results.admissions_avoided_total },
    { label: "Bed days", value: results.bed_days_avoided_total },
  ];

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Pathway impact
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Headline operational impact over the selected horizon.
        </p>
      </div>

      <div className="h-52 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => formatNumber(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={54}
            />
            <Tooltip content={<NumberTooltip />} />
            <Bar dataKey="value" name="Impact" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BoundedUncertaintyChart({
  uncertaintyRows,
  threshold,
}: {
  uncertaintyRows: UncertaintyRow[];
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
          Bounded uncertainty
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Low, base, and high cases against the current threshold.
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
              width={58}
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

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          Dark = at or below threshold
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          Light = above threshold
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          Dashed orange = threshold
        </span>
      </div>
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
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {help}
        </span>
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
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {help}
        </span>
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

function DesktopDecisionRail({
  decisionStatus,
  netCostLabel,
  netCostValue,
  costPerQaly,
  waitingListReduction,
  escalationsAvoided,
  mainDriver,
  interpretation,
}: {
  decisionStatus: string;
  netCostLabel: string;
  netCostValue: string;
  costPerQaly: string;
  waitingListReduction: string;
  escalationsAvoided: string;
  mainDriver: string;
  interpretation: {
    what_model_suggests: string;
    what_drives_result: string;
    what_looks_fragile: string;
    what_to_validate_next: string;
  };
}) {
  return (
    <div className="sticky top-6 space-y-4">
      <div className={PANEL_SHELL}>
        <p className={SECTION_KICKER}>Live result</p>
        <h2 className={SECTION_TITLE}>Current decision signal</h2>

        <div className="mt-3">
          <div
            className={cx(
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
              decisionStatus === "Appears cost-saving" &&
                "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
              decisionStatus === "Appears cost-effective" &&
                "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
              decisionStatus === "Above current threshold" &&
                "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
            )}
          >
            {decisionStatus}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <MetricCard label={netCostLabel} value={netCostValue} />
          <MetricCard
            label="Discounted cost per QALY"
            value={costPerQaly}
            tone="strong"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricCard label="Waiting list reduction" value={waitingListReduction} />
          <MetricCard label="Escalations avoided" value={escalationsAvoided} />
        </div>
      </div>

      <div className={PANEL_SHELL}>
        <p className={SECTION_KICKER}>Analyst note</p>
        <h2 className={SECTION_TITLE}>How to read the case</h2>

        <div className="mt-4 space-y-3">
          <MiniInsight label="Conclusion" value={interpretation.what_model_suggests} />
          <MiniInsight
            label="Main driver"
            value={`The result is currently most shaped by ${mainDriver}.`}
          />
          <MiniInsight label="Fragility" value={interpretation.what_looks_fragile} />
          <MiniInsight
            label="Validate next"
            value={interpretation.what_to_validate_next}
          />
        </div>
      </div>
    </div>
  );
}

export default function WaitWiseApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [openSections, setOpenSections] = useState<
    Record<AssumptionSectionKey, boolean>
  >({
    "advanced-delivery": false,
    "advanced-pathway": false,
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

  const interpretation = useMemo(
    () => generateInterpretation(results, inputs, uncertainty),
    [results, inputs, uncertainty],
  );

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setShowAdvancedMobile(false);
    setOpenSections({
      "advanced-delivery": false,
      "advanced-pathway": false,
      "advanced-economics": false,
    });
  };

  const toggleSection = (key: AssumptionSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const summaryMetrics = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Waiting list reduction"
        value={formatNumber(results.waiting_list_reduction_total)}
      />
      <MetricCard
        label="Escalations avoided"
        value={formatNumber(results.escalations_avoided_total)}
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
        label="Admissions avoided"
        value={formatNumber(results.admissions_avoided_total)}
      />
      <MetricCard
        label="Bed days avoided"
        value={formatNumber(results.bed_days_avoided_total)}
      />
      <MetricCard
        label="Programme cost"
        value={formatCurrency(results.programme_cost_total)}
      />
      <MetricCard
        label="Gross savings"
        value={formatCurrency(results.gross_savings_total)}
      />
    </div>
  );

  const interpretationPanel = (
    <div className="grid gap-3 lg:grid-cols-3">
      <MiniInsight label="Conclusion" value={interpretation.what_model_suggests} />
      <MiniInsight
        label="Main driver"
        value={`The result is currently most shaped by ${mainDriver}.`}
      />
      <MiniInsight label="Fragility" value={interpretation.what_looks_fragile} />
    </div>
  );

  const quickAssumptionNotice = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
      Start with reach, delivery cost, and the three intervention effects.
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
            help="Changes where value is concentrated."
          />

          <NumberInput
            label="Starting waiting list"
            value={inputs.starting_waiting_list_size}
            onChange={(value) => updateInput("starting_waiting_list_size", value)}
            step={100}
            help="Baseline backlog size."
          />

          <SliderInput
            label="Intervention reach"
            value={inputs.intervention_reach_rate}
            onChange={(value) => updateInput("intervention_reach_rate", value)}
            min={0}
            max={1}
            step={0.01}
            display={formatPercent(inputs.intervention_reach_rate)}
            help="Share of the list effectively reached."
          />

          <NumberInput
            label="Cost per patient"
            value={inputs.intervention_cost_per_patient_reached}
            onChange={(value) =>
              updateInput("intervention_cost_per_patient_reached", value)
            }
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
              help="Longer horizons can improve the case."
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Intervention effects
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          These sliders shape where the value comes from.
        </p>
        <div className="mt-3 grid gap-4">
          <SliderInput
            label="Demand reduction"
            value={inputs.demand_reduction_effect}
            onChange={(value) => updateInput("demand_reduction_effect", value)}
            min={0}
            max={0.5}
            step={0.01}
            display={formatPercent(inputs.demand_reduction_effect)}
            help="Lowers new demand entering the list."
          />

          <SliderInput
            label="Throughput increase"
            value={inputs.throughput_increase_effect}
            onChange={(value) => updateInput("throughput_increase_effect", value)}
            min={0}
            max={0.5}
            step={0.01}
            display={formatPercent(inputs.throughput_increase_effect)}
            help="Raises the number of patients processed."
          />

          <SliderInput
            label="Escalation reduction"
            value={inputs.escalation_reduction_effect}
            onChange={(value) => updateInput("escalation_reduction_effect", value)}
            min={0}
            max={0.5}
            step={0.01}
            display={formatPercent(inputs.escalation_reduction_effect)}
            help="Reduces deterioration while patients wait."
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
            Flow and persistence
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
              Use these to adjust flow pressure and how effects hold over time.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              <NumberInput
                label="Monthly inflow"
                value={inputs.monthly_inflow}
                onChange={(value) => updateInput("monthly_inflow", value)}
                step={25}
                help="New demand entering the list each month."
              />
              <NumberInput
                label="Baseline throughput"
                value={inputs.baseline_monthly_throughput}
                onChange={(value) => updateInput("baseline_monthly_throughput", value)}
                step={25}
                help="Patients processed before intervention."
              />
              <SliderInput
                label="Annual effect decay"
                value={inputs.effect_decay_rate}
                onChange={(value) => updateInput("effect_decay_rate", value)}
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.effect_decay_rate)}
                help="How quickly intervention effect weakens."
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
                help="How quickly effective reach falls."
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-pathway")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-pathway"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Escalation and pathway
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-pathway"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-pathway"] ? (
          <div className="border-t border-slate-200 p-4">
            <p className="mb-4 text-xs leading-5 text-slate-600">
              Use these to change deterioration risk, admissions, and health gain.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              <SliderInput
                label="Monthly escalation rate"
                value={inputs.monthly_escalation_rate}
                onChange={(value) => updateInput("monthly_escalation_rate", value)}
                min={0}
                max={0.2}
                step={0.005}
                display={formatPercent(inputs.monthly_escalation_rate)}
                help="Risk of deterioration while waiting."
              />
              <SliderInput
                label="Admission rate after escalation"
                value={inputs.admission_rate_after_escalation}
                onChange={(value) =>
                  updateInput("admission_rate_after_escalation", value)
                }
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.admission_rate_after_escalation)}
                help="Share of escalations leading to admission."
              />
              <NumberInput
                label="Average length of stay"
                value={inputs.average_length_of_stay}
                onChange={(value) => updateInput("average_length_of_stay", value)}
                step={0.5}
                help="Used to value bed-day impact."
              />
              <NumberInput
                label="QALY gain per escalation avoided"
                value={inputs.qaly_gain_per_escalation_avoided}
                onChange={(value) =>
                  updateInput("qaly_gain_per_escalation_avoided", value)
                }
                step={0.01}
                help="Health gain used in the economic case."
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
              Use these to change how value is counted and interpreted.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              <SelectInput
                label="Costing method"
                value={inputs.costing_method}
                options={COSTING_METHOD_OPTIONS}
                onChange={(value) => updateInput("costing_method", value)}
                help="Defines how avoided pressure is valued."
              />
              <NumberInput
                label="Threshold"
                value={inputs.cost_effectiveness_threshold}
                onChange={(value) =>
                  updateInput("cost_effectiveness_threshold", value)
                }
                step={1000}
                help="Used to interpret discounted cost per QALY."
              />
              <NumberInput
                label="Cost per escalation"
                value={inputs.cost_per_escalation}
                onChange={(value) => updateInput("cost_per_escalation", value)}
                step={50}
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
                step={25}
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
        label="Targeting mode"
        value={inputs.targeting_mode}
        note="Defines who is reached and how concentrated risk becomes."
      />
      <AssumptionReviewCard
        label="Costing method"
        value={inputs.costing_method}
      />
      <AssumptionReviewCard
        label="Starting waiting list"
        value={formatNumber(inputs.starting_waiting_list_size)}
      />
      <AssumptionReviewCard
        label="Monthly inflow"
        value={formatNumber(inputs.monthly_inflow)}
      />
      <AssumptionReviewCard
        label="Baseline throughput"
        value={formatNumber(inputs.baseline_monthly_throughput)}
      />
      <AssumptionReviewCard
        label="Intervention reach"
        value={formatPercent(inputs.intervention_reach_rate)}
      />
      <AssumptionReviewCard
        label="Demand reduction"
        value={formatPercent(inputs.demand_reduction_effect)}
      />
      <AssumptionReviewCard
        label="Throughput increase"
        value={formatPercent(inputs.throughput_increase_effect)}
      />
      <AssumptionReviewCard
        label="Escalation reduction"
        value={formatPercent(inputs.escalation_reduction_effect)}
      />
      <AssumptionReviewCard
        label="Cost per patient"
        value={formatCurrency(inputs.intervention_cost_per_patient_reached)}
      />
      <AssumptionReviewCard
        label="Time horizon"
        value={`${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"}`}
      />
      <AssumptionReviewCard
        label="Threshold"
        value={formatCurrency(inputs.cost_effectiveness_threshold)}
      />
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <WaitingListReductionChart yearlyResults={results.yearly_results} />

      <MobileAccordion title="Cost vs savings">
        <CostVsSavingsChart yearlyResults={results.yearly_results} />
      </MobileAccordion>

      <MobileAccordion title="Pathway impact">
        <PathwayImpactChart results={results} />
      </MobileAccordion>

      <MobileAccordion title="Bounded uncertainty">
        <BoundedUncertaintyChart
          uncertaintyRows={uncertainty}
          threshold={inputs.cost_effectiveness_threshold}
        />
      </MobileAccordion>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Health Economics Scenario Lab
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          WaitWise
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          Explore how waiting list interventions might reduce backlog pressure,
          escalations, admissions, bed use, and economic burden under different assumptions.
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

      <div className="lg:hidden">
        <div className={cx(mobileTab !== "summary" && "hidden")}>
          <SectionCard
            title="Headline view"
            description="Start with the current signal and the main outputs."
            dense
          >
            {summaryMetrics}
            <div className="mt-4">{interpretationPanel}</div>
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
                <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
                <MetricCard label="Break-even horizon" value={results.break_even_horizon} />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Interpretation</h3>
                <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-700">
                  <p>{interpretation.what_model_suggests}</p>
                  <p>{interpretation.what_to_validate_next}</p>
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
                      note={`${formatNumber(row.waiting_list_reduction_total)} waiting list reduction · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3">
                  <AssumptionReviewCard
                    label="Break-even cost"
                    value={formatCurrency(results.break_even_cost_per_patient)}
                  />
                  <AssumptionReviewCard
                    label="Required effect"
                    value={formatPercent(results.break_even_effect_required)}
                  />
                  <AssumptionReviewCard
                    label="Break-even horizon"
                    value={results.break_even_horizon}
                  />
                </div>
              </div>

              <MobileAccordion title="Review current assumptions">
                <div>{assumptionsReview}</div>
              </MobileAccordion>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.18fr)_392px] lg:gap-6 xl:grid-cols-[minmax(0,1.24fr)_408px]">
        <main className="min-w-0 space-y-5">
          <SectionCard
            title="Output workspace"
            description="Review the current conclusion, compare the main economic and operational outputs, then move down into trajectory and uncertainty."
            dense
          >
            {summaryMetrics}
            <div className="mt-3">{desktopSecondaryMetrics}</div>
            <div className="mt-4">{interpretationPanel}</div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <MetricCard
                label="Return on spend"
                value={formatRatio(results.roi)}
              />
              <MetricCard
                label="Break-even cost per patient"
                value={formatCurrency(results.break_even_cost_per_patient)}
              />
              <MetricCard
                label="Required intervention effect"
                value={formatPercent(results.break_even_effect_required)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Charts"
            description="Use the first row for trajectory and economics. Use the second row for operational impact and bounded sensitivity."
            dense
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <WaitingListReductionChart yearlyResults={results.yearly_results} />
              <CostVsSavingsChart yearlyResults={results.yearly_results} />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <PathwayImpactChart results={results} />
              <BoundedUncertaintyChart
                uncertaintyRows={uncertainty}
                threshold={inputs.cost_effectiveness_threshold}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Analysis"
            description="A compact analyst-style readout of the current assumption set, the bounded cases, and what should be validated next."
            dense
          >
            <div className="space-y-5">
              <div>
                <h3 className={SECTION_KICKER}>Assumption review</h3>
                <div className="mt-3">{assumptionsReview}</div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.waiting_list_reduction_total)} waiting list reduction · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <div className={SUBCARD}>
                  <p className={SECTION_KICKER}>Decision narrative</p>
                  <div className="mt-3 space-y-2.5">
                    <p className={SECTION_BODY}>{interpretation.what_model_suggests}</p>
                    <p className={SECTION_BODY}>{interpretation.what_drives_result}</p>
                  </div>
                </div>

                <div className={SUBCARD}>
                  <p className={SECTION_KICKER}>Validation note</p>
                  <div className="mt-3 space-y-2.5">
                    <p className={SECTION_BODY}>{interpretation.what_looks_fragile}</p>
                    <p className={SECTION_BODY}>{interpretation.what_to_validate_next}</p>
                    <p className={SECTION_BODY}>
                      Break-even horizon:{" "}
                      <span className="font-semibold text-slate-900">
                        {results.break_even_horizon}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </main>

        <aside className="min-w-0">
          <DesktopDecisionRail
            decisionStatus={decisionStatus}
            netCostLabel={netCostLabel}
            netCostValue={formatCurrency(Math.abs(results.discounted_net_cost_total))}
            costPerQaly={formatCurrency(results.discounted_cost_per_qaly)}
            waitingListReduction={formatNumber(results.waiting_list_reduction_total)}
            escalationsAvoided={formatNumber(results.escalations_avoided_total)}
            mainDriver={mainDriver}
            interpretation={interpretation}
          />

          <div className="mt-4 sticky top-[430px]">
            <SectionCard
              title="Control panel"
              description="Adjust the assumptions while keeping the current decision signal in view."
              action={
                <button
                  type="button"
                  onClick={resetToBaseCase}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to base case
                </button>
              }
              dense
            >
              <div className="space-y-4">
                <div className={SUBCARD}>
                  <p className={SECTION_KICKER}>Quick assumptions</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Start with the main levers most likely to change the result.
                  </p>
                  <div className="mt-3">{quickAssumptionNotice}</div>
                  <div className="mt-4">{assumptionsQuick}</div>
                </div>

                <div className={SUBCARD}>
                  <p className={SECTION_KICKER}>Advanced assumptions</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Use these for deeper stress-testing once the main case is stable.
                  </p>
                  <div className="mt-4">{advancedSections}</div>
                </div>
              </div>
            </SectionCard>
          </div>
        </aside>
      </div>
    </div>
  );
}