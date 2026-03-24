import type {
  ModelResults,
  SensitivityRow,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/waitwise/types";

export type WaitwiseBarChartRow = {
  label: string;
  value: number;
  valueLabel: string;
};

export type WaitwiseLineChartRow = {
  year: string;
  programmeCost: number;
  grossSavings: number;
  cumulativeNetCost: number;
  waitingListReduction: number;
};

export type WaitwiseUncertaintyChartRow = {
  case: string;
  discountedCostPerQaly: number;
  decisionStatus: string;
};

export type WaitwiseTornadoRow = {
  label: string;
  lowDelta: number;
  highDelta: number;
};

export function compactCurrencyAxis(value: number): string {
  const numeric = Number(value);

  if (Math.abs(numeric) >= 1_000_000) {
    return `£${(numeric / 1_000_000).toFixed(1)}m`;
  }

  if (Math.abs(numeric) >= 1_000) {
    return `£${(numeric / 1_000).toFixed(0)}k`;
  }

  return `£${numeric.toFixed(0)}`;
}

export function buildImpactBarChartData(
  results: ModelResults,
): WaitwiseBarChartRow[] {
  return [
    {
      label: "Waiting list reduction",
      value: results.waiting_list_reduction_total,
      valueLabel: results.waiting_list_reduction_total.toLocaleString(),
    },
    {
      label: "Escalations avoided",
      value: results.escalations_avoided_total,
      valueLabel: results.escalations_avoided_total.toLocaleString(),
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
  ];
}

export function buildWaterfallChartData(
  results: ModelResults,
): WaitwiseBarChartRow[] {
  return [
    {
      label: "Programme cost",
      value: results.discounted_programme_cost_total,
      valueLabel: `£${Math.round(
        results.discounted_programme_cost_total,
      ).toLocaleString()}`,
    },
    {
      label: "Gross savings",
      value: -results.discounted_gross_savings_total,
      valueLabel: `£${Math.round(
        results.discounted_gross_savings_total,
      ).toLocaleString()}`,
    },
    {
      label: "Net impact",
      value: results.discounted_net_cost_total,
      valueLabel: `£${Math.round(
        results.discounted_net_cost_total,
      ).toLocaleString()}`,
    },
  ];
}

export function buildBacklogReductionChartData(
  yearlyResults: YearlyResultRow[],
): Array<{ year: string; waitingListReduction: number }> {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    waitingListReduction: row.waiting_list_reduction,
  }));
}

export function buildCumulativeCostChartData(
  yearlyResults: YearlyResultRow[],
): WaitwiseLineChartRow[] {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    programmeCost: row.cumulative_programme_cost,
    grossSavings: row.cumulative_gross_savings,
    cumulativeNetCost: row.cumulative_net_cost,
    waitingListReduction: row.waiting_list_reduction,
  }));
}

export function buildUncertaintyChartData(
  uncertaintyRows: UncertaintyRow[],
): WaitwiseUncertaintyChartRow[] {
  return uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
    decisionStatus: row.decision_status,
  }));
}

export function buildTornadoChartData(
  sensitivityRows: SensitivityRow[],
): WaitwiseTornadoRow[] {
  return [...sensitivityRows]
    .sort((a, b) => a.swing - b.swing)
    .map((row) => ({
      label: row.label,
      lowDelta: row.low_delta,
      highDelta: row.high_delta,
    }));
}