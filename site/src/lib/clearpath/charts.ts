import type {
  ComparatorDeltaRow,
  ModelResults,
  ParameterSensitivityRow,
  ScenarioComparisonRow,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/clearpath/types";

export type ClearPathBarChartRow = {
  label: string;
  value: number;
  valueLabel: string;
};

export type ClearPathLineChartRow = {
  year: string;
  programmeCost: number;
  grossSavings: number;
  cumulativeNetCost: number;
  casesShiftedEarlier: number;
};

export type ClearPathUncertaintyChartRow = {
  case: string;
  discountedCostPerQaly: number;
  decisionStatus: string;
};

export type ClearPathScenarioNetCostRow = {
  scenario: string;
  discountedNetCost: number;
  discountedCostPerQaly: number;
  decisionStatus: string;
};

export type ClearPathScenarioOutcomeRow = {
  scenario: string;
  casesShiftedEarlier: number;
  emergencyPresentationsAvoided: number;
};

export type ClearPathTornadoRow = {
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
): ClearPathBarChartRow[] {
  return [
    {
      label: "Cases shifted earlier",
      value: results.cases_shifted_total,
      valueLabel: results.cases_shifted_total.toLocaleString(),
    },
    {
      label: "Emergency presentations avoided",
      value: results.emergency_presentations_avoided_total,
      valueLabel: results.emergency_presentations_avoided_total.toLocaleString(),
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
): ClearPathBarChartRow[] {
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

export function buildCasesShiftedChartData(
  yearlyResults: YearlyResultRow[],
): Array<{ year: string; casesShiftedEarlier: number }> {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    casesShiftedEarlier: row.cases_shifted_earlier,
  }));
}

export function buildCumulativeCostChartData(
  yearlyResults: YearlyResultRow[],
): ClearPathLineChartRow[] {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    programmeCost: row.cumulative_programme_cost,
    grossSavings: row.cumulative_gross_savings,
    cumulativeNetCost: row.cumulative_net_cost,
    casesShiftedEarlier: row.cases_shifted_earlier,
  }));
}

export function buildUncertaintyChartData(
  uncertaintyRows: UncertaintyRow[],
): ClearPathUncertaintyChartRow[] {
  return uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
    decisionStatus: row.decision_status,
  }));
}

export function buildScenarioNetCostChartData(
  scenarioRows: ScenarioComparisonRow[],
): ClearPathScenarioNetCostRow[] {
  return scenarioRows.map((row) => ({
    scenario: row.scenario,
    discountedNetCost: row.discounted_net_cost,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
    decisionStatus: row.decision_status,
  }));
}

export function buildScenarioOutcomeChartData(
  scenarioRows: ScenarioComparisonRow[],
): ClearPathScenarioOutcomeRow[] {
  return scenarioRows.map((row) => ({
    scenario: row.scenario,
    casesShiftedEarlier: row.cases_shifted_earlier,
    emergencyPresentationsAvoided: row.emergency_presentations_avoided,
  }));
}

export function buildTornadoChartData(
  sensitivityRows: ParameterSensitivityRow[],
): ClearPathTornadoRow[] {
  return [...sensitivityRows]
    .sort((a, b) => a.max_abs_icer_change - b.max_abs_icer_change)
    .map((row) => ({
      label: row.parameter_label,
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
      label: "Cases shifted earlier",
      delta: comparatorResults.cases_shifted_total - baseResults.cases_shifted_total,
      isCurrency: false,
    },
    {
      label: "Emergency presentations avoided",
      delta:
        comparatorResults.emergency_presentations_avoided_total -
        baseResults.emergency_presentations_avoided_total,
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