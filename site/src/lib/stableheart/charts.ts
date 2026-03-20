import type { ModelResults, UncertaintyRow, YearlyResultRow } from "@/lib/stableheart/types";

export function compactCurrencyAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1_000) return `£${(value / 1_000).toFixed(0)}k`;
  return `£${value.toFixed(0)}`;
}

export function buildEventsChartData(results: ModelResults) {
  return [
    { label: "Events avoided", value: results.events_avoided_total },
    { label: "Admissions avoided", value: results.admissions_avoided_total },
    { label: "Bed days avoided", value: results.bed_days_avoided_total },
    { label: "Patients reached", value: results.patients_reached_total },
  ];
}

export function buildEventCascadeChartData(results: ModelResults) {
  return [
    { label: "Events avoided", value: results.events_avoided_total },
    { label: "Admissions avoided", value: results.admissions_avoided_total },
    { label: "Bed days avoided", value: results.bed_days_avoided_total },
    { label: "QALYs gained", value: results.discounted_qalys_total },
  ];
}

export function buildCumulativeCostChartData(yearlyResults: YearlyResultRow[]) {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    programmeCost: row.cumulative_programme_cost,
    grossSavings: row.cumulative_gross_savings,
  }));
}

export function buildEventsByYearChartData(yearlyResults: YearlyResultRow[]) {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    eventsAvoided: row.events_avoided,
  }));
}

export function buildUncertaintyChartData(uncertaintyRows: UncertaintyRow[]) {
  return uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
    decisionStatus: row.decision_status,
  }));
}