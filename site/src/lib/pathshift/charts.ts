import type {
  ComparatorDeltaRow,
  ModelResults,
  ScenarioComparisonRow,
  SensitivityRow,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/pathshift/types";

export type PathShiftBarChartRow = {
  label: string;
  value: number;
  valueLabel: string;
};

export type PathShiftLineChartRow = {
  year: string;
  programmeCost: number;
  grossSavings: number;
  cumulativeNetCost: number;
};

export type PathShiftUncertaintyChartRow = {
  case: string;
  discountedCostPerQaly: number;
  decisionStatus: string;
};

export type PathShiftScenarioNetCostRow = {
  scenario: string;
  discountedNetCost: number;
  discountedCostPerQaly: number;
  decisionStatus: string;
};

export type PathShiftScenarioOutcomeRow = {
  scenario: string;
  patientsShiftedInPathway: number;
  admissionsAvoided: number;
};

export type PathShiftTornadoRow = {
  label: string;
  lowDelta: number;
  highDelta: number;
};

export function compactCurrencyAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}k`;
  }
  return `£${value.toFixed(0)}`;
}

export function buildImpactBarChartData(
  results: ModelResults,
): PathShiftBarChartRow[] {
  return [
    {
      label: "Patients shifted",
      value: results.patients_shifted_total,
      valueLabel: results.patients_shifted_total.toLocaleString(),
    },
    {
      label: "Admissions avoided",
      value: results.admissions_avoided_total,
      valueLabel: results.admissions_avoided_total.toLocaleString(),
    },
    {
      label: "Follow-ups avoided",
      value: results.follow_ups_avoided_total,
      valueLabel: results.follow_ups_avoided_total.toLocaleString(),
    },
    {
      label: "Bed days avoided",
      value: results.bed_days_avoided_total,
      valueLabel: results.bed_days_avoided_total.toLocaleString(),
    },
  ];
}

export function buildPathwayShiftChartData(
  yearlyResults: YearlyResultRow[],
): Array<{ year: string; patientsShiftedInPathway: number }> {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    patientsShiftedInPathway: row.patients_shifted_in_pathway,
  }));
}

export function buildCumulativeCostChartData(
  yearlyResults: YearlyResultRow[],
): PathShiftLineChartRow[] {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    programmeCost: row.cumulative_programme_cost,
    grossSavings: row.cumulative_gross_savings,
    cumulativeNetCost: row.cumulative_net_cost,
  }));
}

export function buildUncertaintyChartData(
  uncertaintyRows: UncertaintyRow[],
): PathShiftUncertaintyChartRow[] {
  return uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
    decisionStatus: row.decision_status,
  }));
}

export function buildScenarioNetCostChartData(
  scenarioRows: ScenarioComparisonRow[],
): PathShiftScenarioNetCostRow[] {
  return scenarioRows.map((row) => ({
    scenario: row.scenario,
    discountedNetCost: row.discounted_net_cost,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
    decisionStatus: row.decision_status,
  }));
}

export function buildScenarioOutcomeChartData(
  scenarioRows: ScenarioComparisonRow[],
): PathShiftScenarioOutcomeRow[] {
  return scenarioRows.map((row) => ({
    scenario: row.scenario,
    patientsShiftedInPathway: row.patients_shifted_in_pathway,
    admissionsAvoided: row.admissions_avoided,
  }));
}

export function buildTornadoChartData(
  sensitivityRows: SensitivityRow[],
): PathShiftTornadoRow[] {
  return [...sensitivityRows]
    .sort((a, b) => a.swing - b.swing)
    .map((row) => ({
      label: row.label,
      lowDelta: row.low_delta,
      highDelta: row.high_delta,
    }));
}

export function buildComparatorDeltaChartData(
  baseResults: ModelResults,
  comparatorResults: ModelResults,
): ComparatorDeltaRow[] {
  return [
    {
      label: "Patients shifted",
      delta:
        comparatorResults.patients_shifted_total - baseResults.patients_shifted_total,
      isCurrency: false,
    },
    {
      label: "Admissions avoided",
      delta:
        comparatorResults.admissions_avoided_total -
        baseResults.admissions_avoided_total,
      isCurrency: false,
    },
    {
      label: "Discounted net cost",
      delta:
        comparatorResults.discounted_net_cost_total -
        baseResults.discounted_net_cost_total,
      isCurrency: true,
    },
    {
      label: "Discounted cost per QALY",
      delta:
        comparatorResults.discounted_cost_per_qaly -
        baseResults.discounted_cost_per_qaly,
      isCurrency: true,
    },
  ];
}