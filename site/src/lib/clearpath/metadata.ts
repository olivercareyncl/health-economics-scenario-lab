import type { Inputs } from "@/lib/clearpath/types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/clearpath/formatters";

type AssumptionMetaItem = {
  label: string;
  unit: string;
  formatter: (value: number | string) => string;
  description: string;
  source_type: string;
  confidence: "High confidence" | "Medium confidence" | "Low confidence";
};

export const ASSUMPTION_META: Record<keyof Inputs, AssumptionMetaItem> = {
  annual_incident_cases: {
    label: "Annual incident cases",
    unit: "cases",
    formatter: (x) => formatNumber(Number(x)),
    description: "Estimated annual number of incident cases entering the pathway.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },

  intervention_reach_rate: {
    label: "Intervention reach rate",
    unit: "%",
    formatter: (x) => formatPercent(Number(x)),
    description: "Estimated share of incident cases effectively reached by the intervention.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },

  current_late_diagnosis_rate: {
    label: "Current late diagnosis rate",
    unit: "%",
    formatter: (x) => formatPercent(Number(x)),
    description: "Estimated share of cases currently diagnosed later rather than earlier.",
    source_type: "Evidence-informed proxy",
    confidence: "Medium confidence",
  },

  achievable_reduction_in_late_diagnosis: {
    label: "Achievable reduction in late diagnosis",
    unit: "%",
    formatter: (x) => formatPercent(Number(x)),
    description: "Estimated absolute reduction in late diagnosis achieved by the intervention.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },

  late_emergency_presentation_rate: {
    label: "Emergency presentation rate, later diagnosis",
    unit: "%",
    formatter: (x) => formatPercent(Number(x)),
    description: "Estimated share of later diagnosis cases presenting as emergencies.",
    source_type: "Evidence-informed proxy",
    confidence: "Medium confidence",
  },

  early_emergency_presentation_rate: {
    label: "Emergency presentation rate, earlier diagnosis",
    unit: "%",
    formatter: (x) => formatPercent(Number(x)),
    description: "Estimated share of earlier diagnosis cases presenting as emergencies.",
    source_type: "Evidence-informed proxy",
    confidence: "Medium confidence",
  },

  admissions_per_emergency_presentation: {
    label: "Admissions per emergency presentation",
    unit: "ratio",
    formatter: (x) => Number(x).toFixed(1),
    description: "Estimated inpatient admissions generated per emergency presentation.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },

  average_length_of_stay: {
    label: "Average length of stay",
    unit: "days",
    formatter: (x) => Number(x).toFixed(1),
    description: "Average inpatient length of stay for emergency admissions.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },

  intervention_cost_per_case_reached: {
    label: "Intervention cost per case reached",
    unit: "GBP",
    formatter: (x) => formatCurrency(Number(x)),
    description: "Estimated intervention cost for each case reached.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },

  treatment_cost_early: {
    label: "Treatment cost, earlier diagnosis",
    unit: "GBP",
    formatter: (x) => formatCurrency(Number(x)),
    description: "Estimated treatment cost for a case diagnosed earlier.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },

  treatment_cost_late: {
    label: "Treatment cost, later diagnosis",
    unit: "GBP",
    formatter: (x) => formatCurrency(Number(x)),
    description: "Estimated treatment cost for a case diagnosed later.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },

  cost_per_emergency_admission: {
    label: "Cost per emergency admission",
    unit: "GBP",
    formatter: (x) => formatCurrency(Number(x)),
    description: "Estimated unit cost for an emergency admission.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },

  cost_per_bed_day: {
    label: "Cost per bed day",
    unit: "GBP",
    formatter: (x) => formatCurrency(Number(x)),
    description: "Illustrative bed-day value for exploratory costing.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },

  costing_method: {
    label: "Costing method",
    unit: "",
    formatter: (x) => String(x),
    description: "Method used to value the economic effect of earlier diagnosis.",
    source_type: "User override",
    confidence: "Medium confidence",
  },

  qaly_gain_per_case_shifted: {
    label: "QALY gain per case shifted earlier",
    unit: "QALYs",
    formatter: (x) => Number(x).toFixed(2),
    description:
      "Estimated quality-of-life gain for each case shifted from later to earlier diagnosis.",
    source_type: "Evidence-informed proxy",
    confidence: "Low confidence",
  },

  effect_decay_rate: {
    label: "Annual effect decay",
    unit: "%",
    formatter: (x) => formatPercent(Number(x)),
    description: "Estimated annual reduction in intervention effect over time.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },

  participation_dropoff_rate: {
    label: "Annual participation drop-off",
    unit: "%",
    formatter: (x) => formatPercent(Number(x)),
    description: "Estimated annual reduction in effective intervention reach over time.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },

  targeting_mode: {
    label: "Targeting mode",
    unit: "",
    formatter: (x) => String(x),
    description: "How broadly or narrowly the intervention is focused across the incident population.",
    source_type: "User override",
    confidence: "Medium confidence",
  },

  time_horizon_years: {
    label: "Time horizon",
    unit: "years",
    formatter: (x) => `${Number(x)}`,
    description: "Number of years over which costs and benefits are modelled.",
    source_type: "User override",
    confidence: "High confidence",
  },

  discount_rate: {
    label: "Discount rate",
    unit: "%",
    formatter: (x) => formatPercent(Number(x)),
    description: "Annual rate used to discount future costs and QALYs.",
    source_type: "Evidence-informed proxy",
    confidence: "High confidence",
  },

  cost_effectiveness_threshold: {
    label: "Cost-effectiveness threshold",
    unit: "GBP per QALY",
    formatter: (x) => formatCurrency(Number(x)),
    description: "Illustrative threshold used to interpret discounted cost per QALY.",
    source_type: "Illustrative default",
    confidence: "High confidence",
  },
};

export const ASSUMPTION_ORDER: Array<keyof Inputs> = [
  "annual_incident_cases",
  "current_late_diagnosis_rate",
  "achievable_reduction_in_late_diagnosis",
  "intervention_reach_rate",
  "late_emergency_presentation_rate",
  "early_emergency_presentation_rate",
  "admissions_per_emergency_presentation",
  "average_length_of_stay",
  "intervention_cost_per_case_reached",
  "treatment_cost_early",
  "treatment_cost_late",
  "cost_per_emergency_admission",
  "cost_per_bed_day",
  "costing_method",
  "qaly_gain_per_case_shifted",
  "effect_decay_rate",
  "participation_dropoff_rate",
  "targeting_mode",
  "time_horizon_years",
  "discount_rate",
  "cost_effectiveness_threshold",
];

export function getAssumptionConfidenceSummary(): {
  "High confidence": number;
  "Medium confidence": number;
  "Low confidence": number;
  summary_text: string;
} {
  const summary = {
    "High confidence": 0,
    "Medium confidence": 0,
    "Low confidence": 0,
  };

  for (const meta of Object.values(ASSUMPTION_META)) {
    const confidence = meta.confidence;
    summary[confidence] += 1;
  }

  return {
    ...summary,
    summary_text: `${summary["High confidence"]} high-confidence, ${summary["Medium confidence"]} medium-confidence, and ${summary["Low confidence"]} low-confidence assumptions are currently in play.`,
  };
}