import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/pathshift/formatters";

export type ConfidenceLevel =
  | "High confidence"
  | "Medium confidence"
  | "Low confidence";

export type AssumptionMetaItem = {
  label: string;
  unit: string;
  formatter: (value: string | number) => string;
  description: string;
  source_type: string;
  confidence: ConfidenceLevel;
};

export const ASSUMPTION_META: Record<string, AssumptionMetaItem> = {
  annual_cohort_size: {
    label: "Annual cohort size",
    unit: "patients",
    formatter: (value) => formatNumber(Number(value)),
    description:
      "Estimated annual number of patients moving through the pathway.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  current_acute_managed_rate: {
    label: "Current acute-managed rate",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description:
      "Estimated share of the cohort currently managed in a higher-cost acute setting.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  current_admission_rate: {
    label: "Current admission rate",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description: "Estimated baseline admission rate in the current pathway.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  current_follow_up_contacts_per_patient: {
    label: "Current follow-up contacts per patient",
    unit: "contacts",
    formatter: (value) => `${Number(value).toFixed(1)}`,
    description:
      "Average number of follow-up contacts per patient in the current pathway.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  current_average_length_of_stay: {
    label: "Current average length of stay",
    unit: "days",
    formatter: (value) => `${Number(value).toFixed(1)}`,
    description: "Average inpatient length of stay in the current pathway.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  proportion_shifted_to_lower_cost_setting: {
    label: "Proportion shifted to lower-cost setting",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description:
      "Estimated share of the reached population shifted to a lower-cost setting.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },
  reduction_in_admission_rate: {
    label: "Reduction in admission rate",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description:
      "Estimated relative reduction in admissions under the redesigned pathway.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },
  reduction_in_follow_up_contacts: {
    label: "Reduction in follow-up contacts",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description:
      "Estimated reduction in follow-up contacts under the redesigned pathway.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },
  reduction_in_length_of_stay: {
    label: "Reduction in length of stay",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description:
      "Estimated reduction in length of stay under the redesigned pathway.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },
  implementation_reach_rate: {
    label: "Implementation reach rate",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description:
      "Estimated share of the cohort effectively reached by the redesign.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  redesign_cost_per_patient: {
    label: "Redesign cost per patient",
    unit: "GBP",
    formatter: (value) => formatCurrency(Number(value)),
    description:
      "Estimated implementation cost per patient reached by the redesign.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  effect_decay_rate: {
    label: "Annual effect decay",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description: "Estimated annual reduction in redesign effect over time.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },
  participation_dropoff_rate: {
    label: "Annual participation / implementation drop-off",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description:
      "Estimated annual reduction in effective redesign reach over time.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },
  cost_per_acute_managed_patient: {
    label: "Cost per acute-managed patient",
    unit: "GBP",
    formatter: (value) => formatCurrency(Number(value)),
    description: "Estimated cost per patient managed in the acute setting.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  cost_per_community_managed_patient: {
    label: "Cost per community-managed patient",
    unit: "GBP",
    formatter: (value) => formatCurrency(Number(value)),
    description:
      "Estimated cost per patient managed in the lower-cost setting.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  cost_per_follow_up_contact: {
    label: "Cost per follow-up contact",
    unit: "GBP",
    formatter: (value) => formatCurrency(Number(value)),
    description: "Estimated unit cost of a follow-up contact.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  cost_per_admission: {
    label: "Cost per admission",
    unit: "GBP",
    formatter: (value) => formatCurrency(Number(value)),
    description: "Estimated cost per admission in the pathway.",
    source_type: "Operational estimate",
    confidence: "Medium confidence",
  },
  cost_per_bed_day: {
    label: "Cost per bed day",
    unit: "GBP",
    formatter: (value) => formatCurrency(Number(value)),
    description: "Illustrative bed-day value for exploratory costing.",
    source_type: "Illustrative default",
    confidence: "Low confidence",
  },
  costing_method: {
    label: "Costing method",
    unit: "",
    formatter: (value) => String(value),
    description: "Method used to value the economic effect of redesign.",
    source_type: "User override",
    confidence: "Medium confidence",
  },
  qaly_gain_per_patient_improved: {
    label: "QALY gain per patient meaningfully improved",
    unit: "QALYs",
    formatter: (value) => Number(value).toFixed(2),
    description:
      "Estimated QALY gain for patients meaningfully improved by the redesigned pathway.",
    source_type: "Evidence-informed proxy",
    confidence: "Low confidence",
  },
  targeting_mode: {
    label: "Targeting mode",
    unit: "",
    formatter: (value) => String(value),
    description:
      "How broadly or narrowly the redesign is focused across the pathway population.",
    source_type: "User override",
    confidence: "Medium confidence",
  },
  time_horizon_years: {
    label: "Time horizon",
    unit: "years",
    formatter: (value) => String(Number(value)),
    description: "Number of years over which costs and benefits are modelled.",
    source_type: "User override",
    confidence: "High confidence",
  },
  discount_rate: {
    label: "Discount rate",
    unit: "%",
    formatter: (value) => formatPercent(Number(value)),
    description: "Annual rate used to discount future costs and QALYs.",
    source_type: "Evidence-informed proxy",
    confidence: "High confidence",
  },
  cost_effectiveness_threshold: {
    label: "Cost-effectiveness threshold",
    unit: "GBP per QALY",
    formatter: (value) => formatCurrency(Number(value)),
    description:
      "Illustrative threshold used to interpret discounted cost per QALY.",
    source_type: "Illustrative default",
    confidence: "High confidence",
  },
};

export const ASSUMPTION_ORDER = [
  "annual_cohort_size",
  "current_acute_managed_rate",
  "current_admission_rate",
  "current_follow_up_contacts_per_patient",
  "current_average_length_of_stay",
  "proportion_shifted_to_lower_cost_setting",
  "reduction_in_admission_rate",
  "reduction_in_follow_up_contacts",
  "reduction_in_length_of_stay",
  "implementation_reach_rate",
  "redesign_cost_per_patient",
  "effect_decay_rate",
  "participation_dropoff_rate",
  "cost_per_acute_managed_patient",
  "cost_per_community_managed_patient",
  "cost_per_follow_up_contact",
  "cost_per_admission",
  "cost_per_bed_day",
  "costing_method",
  "qaly_gain_per_patient_improved",
  "targeting_mode",
  "time_horizon_years",
  "discount_rate",
  "cost_effectiveness_threshold",
] as const;

export function getAssumptionConfidenceSummary(): {
  "High confidence": number;
  "Medium confidence": number;
  "Low confidence": number;
  summary_text: string;
} {
  const summary: Record<ConfidenceLevel, number> = {
    "High confidence": 0,
    "Medium confidence": 0,
    "Low confidence": 0,
  };

  Object.values(ASSUMPTION_META).forEach((meta) => {
    summary[meta.confidence] += 1;
  });

  return {
    ...summary,
    summary_text: `${summary["High confidence"]} high-confidence, ${summary["Medium confidence"]} medium-confidence, and ${summary["Low confidence"]} low-confidence assumptions are currently in play.`,
  };
}