import type {
  ModelResults,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/frailtyforward/types";

export function compactCurrencyAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}k`;
  }
  return `£${value.toFixed(0)}`;
}

export function buildStabilisedPatientsChartData(yearlyResults: YearlyResultRow[]) {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    patientsStabilised: row.patients_stabilised,
  }));
}

export function buildCumulativeCostChartData(yearlyResults: YearlyResultRow[]) {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    programmeCost: row.cumulative_programme_cost,
    grossSavings: row.cumulative_gross_savings,
  }));
}

export function buildImpactBarChartData(results: ModelResults) {
  return [
    {
      label: "Patients stabilised",
      value: results.patients_stabilised_total,
    },
    {
      label: "Crisis events",
      value: results.crisis_events_avoided_total,
    },
    {
      label: "Admissions",
      value: results.admissions_avoided_total,
    },
    {
      label: "Bed days",
      value: results.bed_days_avoided_total,
    },
  ];
}

export function buildUncertaintyChartData(uncertaintyRows: UncertaintyRow[]) {
  return uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
    decisionStatus: row.decision_status,
  }));
}