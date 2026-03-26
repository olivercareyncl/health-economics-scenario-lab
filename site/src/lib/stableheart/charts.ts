import type {
  ModelResults,
  ParameterSensitivityRow,
  SensitivitySummary,
  YearlyResultRow,
} from "@/lib/stableheart/types";

export type StableHeartBarChartRow = {
  label: string;
  value: number;
  valueLabel: string;
};

export type StableHeartLineChartRow = {
  year: string;
  programmeCost: number;
  grossSavings: number;
  cumulativeNetCost: number;
  eventsAvoided: number;
};

export type StableHeartUncertaintyChartRow = {
  case: string;
  discountedCostPerQaly: number;
};

export function compactCurrencyAxis(value: number): string {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}m`;
  }

  if (absolute >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}k`;
  }

  return `£${value.toFixed(0)}`;
}

export function buildEventsByYearChartData(
  yearlyResults: YearlyResultRow[],
): Array<{ year: string; eventsAvoided: number }> {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    eventsAvoided: row.events_avoided,
  }));
}

export function buildCumulativeCostChartData(
  yearlyResults: YearlyResultRow[],
): StableHeartLineChartRow[] {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    programmeCost: row.cumulative_programme_cost,
    grossSavings: row.cumulative_gross_savings,
    cumulativeNetCost: row.cumulative_net_cost,
    eventsAvoided: row.events_avoided,
  }));
}

export function buildImpactBarChartData(
  results: ModelResults,
): StableHeartBarChartRow[] {
  return [
    {
      label: "Events avoided",
      value: results.events_avoided_total,
      valueLabel: results.events_avoided_total.toLocaleString(),
    },
    {
      label: "Admissions avoided",
      value: results.admissions_avoided_total,
      valueLabel: results.admissions_avoided_total.toLocaleString(),
    },
    {
      label: "Bed days avoided",
      value: results.bed_days_avoided_total,
      valueLabel: results.bed_days_avoided_total.toLocaleString(),
    },
    {
      label: "Patients reached",
      value: results.patients_reached_total,
      valueLabel: results.patients_reached_total.toLocaleString(),
    },
  ];
}

export function buildUncertaintyChartData(
  uncertaintyRows: Array<{
    case: string;
    discounted_cost_per_qaly: number;
  }>,
): StableHeartUncertaintyChartRow[] {
  return uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
  }));
}

function shortenSensitivityLabel(label: string) {
  switch (label) {
    case "Baseline recurrent event rate":
      return "Baseline event rate";
    case "Risk reduction in recurrent events":
      return "Risk reduction";
    case "Intervention cost per patient":
      return "Cost per patient";
    case "Sustained engagement":
      return "Engagement";
    case "Intervention reach":
      return "Reach";
    case "Admission probability per event":
      return "Admission probability";
    case "Average length of stay":
      return "Length of stay";
    case "QALY gain per event avoided":
      return "QALY gain";
    case "Annual effect decay":
      return "Effect decay";
    case "Annual participation drop-off":
      return "Participation drop-off";
    case "Cost per cardiovascular event":
      return "Cost per event";
    case "Cost per admission":
      return "Cost per admission";
    case "Cost per bed day":
      return "Cost per bed day";
    case "Eligible population":
      return "Eligible population";
    default:
      return label;
  }
}

export function buildParameterSensitivityChartData(
  sensitivity: SensitivitySummary | null | undefined,
) {
  if (!sensitivity?.rows?.length) return [];

  return [...sensitivity.rows]
    .sort((a, b) => b.max_abs_icer_change - a.max_abs_icer_change)
    .slice(0, 10)
    .map((row: ParameterSensitivityRow) => {
      const lowDelta = row.low_icer - row.base_icer;
      const highDelta = row.high_icer - row.base_icer;

      return {
        parameterKey: row.parameter_key,
        label: row.parameter_label,
        shortLabel: shortenSensitivityLabel(row.parameter_label),
        lowCaseLabel: row.low_value_label,
        highCaseLabel: row.high_value_label,
        lowIcer: row.low_icer,
        baseIcer: row.base_icer,
        highIcer: row.high_icer,
        lowDelta,
        highDelta,
        minDelta: Math.min(lowDelta, highDelta, 0),
        maxDelta: Math.max(lowDelta, highDelta, 0),
        maxAbsDelta: row.max_abs_icer_change,
      };
    });
}

export function buildTopSensitivityDriverCards(
  sensitivity: SensitivitySummary | null | undefined,
) {
  if (!sensitivity?.top_drivers?.length) return [];

  return sensitivity.top_drivers.slice(0, 3).map((row, index) => ({
    rank: index + 1,
    parameterKey: row.parameter_key,
    label: row.parameter_label,
    shortLabel: shortenSensitivityLabel(row.parameter_label),
    lowCaseLabel: row.low_value_label,
    highCaseLabel: row.high_value_label,
    lowIcer: row.low_icer,
    baseIcer: row.base_icer,
    highIcer: row.high_icer,
    lowNetCost: row.low_net_cost,
    baseNetCost: row.base_net_cost,
    highNetCost: row.high_net_cost,
    swing: row.max_abs_icer_change,
  }));
}