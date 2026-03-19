import type {
  AssumptionKey,
  AssumptionMetaItem,
  ConfidenceLevel,
} from "./types";

export const ASSUMPTION_META: Record<AssumptionKey, AssumptionMetaItem> = {
  eligible_population: {
    label: "Eligible population",
    unit: "people",
    formatter: "number",
    description: "Population considered eligible for the intervention.",
    sourceType: "Operational estimate",
    confidence: "Medium confidence",
  },
  uptake_rate: {
    label: "Programme uptake",
    unit: "%",
    formatter: "percent",
    description:
      "Share of the eligible population that starts the intervention.",
    sourceType: "Operational estimate",
    confidence: "Medium confidence",
  },
  adherence_rate: {
    label: "Programme completion",
    unit: "%",
    formatter: "percent",
    description:
      "Share of those taking up the intervention who complete it.",
    sourceType: "Operational estimate",
    confidence: "Medium confidence",
  },
  participation_dropoff_rate: {
    label: "Annual participation drop-off",
    unit: "%",
    formatter: "percent",
    description:
      "Estimated year-on-year drop in the number of people still effectively receiving the intervention.",
    sourceType: "Illustrative default",
    confidence: "Low confidence",
  },
  targeting_mode: {
    label: "Targeting mode",
    unit: "",
    formatter: "text",
    description:
      "How broadly or narrowly the intervention is focused across the eligible population.",
    sourceType: "User override",
    confidence: "Medium confidence",
  },
  annual_fall_risk: {
    label: "Annual fall risk",
    unit: "%",
    formatter: "percent",
    description:
      "Estimated annual probability of a fall before any targeting uplift is applied.",
    sourceType: "Evidence-informed proxy",
    confidence: "Medium confidence",
  },
  admission_rate_after_fall: {
    label: "Falls leading to admission",
    unit: "%",
    formatter: "percent",
    description:
      "Estimated share of falls that result in hospital admission.",
    sourceType: "Evidence-informed proxy",
    confidence: "Medium confidence",
  },
  average_length_of_stay: {
    label: "Average length of stay",
    unit: "days",
    formatter: "decimal1",
    description:
      "Average inpatient length of stay for admissions linked to falls.",
    sourceType: "Operational estimate",
    confidence: "Medium confidence",
  },
  intervention_cost_per_person: {
    label: "Cost per participant",
    unit: "GBP",
    formatter: "currency",
    description:
      "Estimated delivery cost per person receiving the intervention.",
    sourceType: "Operational estimate",
    confidence: "Medium confidence",
  },
  relative_risk_reduction: {
    label: "Reduction in falls",
    unit: "%",
    formatter: "percent",
    description:
      "Estimated relative reduction in falls among participants in year 1.",
    sourceType: "Evidence-informed proxy",
    confidence: "Medium confidence",
  },
  effect_decay_rate: {
    label: "Annual effect decay",
    unit: "%",
    formatter: "percent",
    description:
      "Estimated year-on-year reduction in intervention effect after the first year.",
    sourceType: "Illustrative default",
    confidence: "Low confidence",
  },
  costing_method: {
    label: "Costing method",
    unit: "",
    formatter: "text",
    description:
      "Method used to value the impact of avoided admissions and bed days.",
    sourceType: "User override",
    confidence: "Medium confidence",
  },
  cost_per_admission: {
    label: "Cost per admission",
    unit: "GBP",
    formatter: "currency",
    description:
      "Average hospital cost associated with a fall-related admission.",
    sourceType: "Operational estimate",
    confidence: "Medium confidence",
  },
  cost_per_bed_day: {
    label: "Cost per bed day",
    unit: "GBP",
    formatter: "currency",
    description: "Illustrative cost value for an inpatient bed day.",
    sourceType: "Illustrative default",
    confidence: "Low confidence",
  },
  qaly_loss_per_serious_fall: {
    label: "QALY loss per serious fall",
    unit: "QALYs",
    formatter: "decimal2",
    description:
      "Simple quality-of-life loss proxy applied to avoided serious falls.",
    sourceType: "Evidence-informed proxy",
    confidence: "Medium confidence",
  },
  cost_effectiveness_threshold: {
    label: "Cost-effectiveness threshold",
    unit: "GBP per QALY",
    formatter: "currency",
    description:
      "Illustrative threshold used to interpret discounted cost per QALY.",
    sourceType: "Illustrative default",
    confidence: "High confidence",
  },
  time_horizon_years: {
    label: "Time horizon",
    unit: "years",
    formatter: "integer",
    description:
      "Number of years over which costs and benefits are modelled.",
    sourceType: "User override",
    confidence: "High confidence",
  },
  discount_rate: {
    label: "Discount rate",
    unit: "%",
    formatter: "percent",
    description:
      "Annual rate used to discount future costs and QALYs.",
    sourceType: "Evidence-informed proxy",
    confidence: "High confidence",
  },
};

export const ASSUMPTION_ORDER: AssumptionKey[] = [
  "eligible_population",
  "uptake_rate",
  "adherence_rate",
  "participation_dropoff_rate",
  "targeting_mode",
  "annual_fall_risk",
  "admission_rate_after_fall",
  "average_length_of_stay",
  "intervention_cost_per_person",
  "relative_risk_reduction",
  "effect_decay_rate",
  "costing_method",
  "cost_per_admission",
  "cost_per_bed_day",
  "qaly_loss_per_serious_fall",
  "cost_effectiveness_threshold",
  "time_horizon_years",
  "discount_rate",
];

export function getAssumptionConfidenceSummary(): Record<ConfidenceLevel, number> {
  const summary: Record<ConfidenceLevel, number> = {
    "High confidence": 0,
    "Medium confidence": 0,
    "Low confidence": 0,
  };

  for (const meta of Object.values(ASSUMPTION_META)) {
    summary[meta.confidence] += 1;
  }

  return summary;
}