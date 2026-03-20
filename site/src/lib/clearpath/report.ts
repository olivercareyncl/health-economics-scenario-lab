import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/clearpath/formatters";
import {
  assessUncertaintyRobustness,
  generateInterpretation,
  generateOverviewSummary,
  generateOverallSignal,
  generateStructuredRecommendation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/clearpath/summaries";
import { buildSensitivityTakeaways } from "@/lib/clearpath/sensitivity";
import type {
  Inputs,
  ModelResults,
  UncertaintyRow,
} from "@/lib/clearpath/types";

type BuildReportArgs = {
  inputs: Inputs;
  results: ModelResults;
  uncertainty: UncertaintyRow[];
  exportedAt: string;
};

export type ClearPathReportData = {
  meta: {
    title: string;
    module: string;
    exportedAt: string;
    decisionStatus: string;
  };
  executiveSummary: {
    overview: string;
    overallSignal: string;
    whatModelSuggests: string;
    mainDependency: string;
    mainFragility: string;
    bestNextStep: string;
  };
  headlineMetrics: Array<{ label: string; value: string }>;
  assumptions: Array<{ label: string; value: string }>;
  uncertainty: Array<{ label: string; value: string; note: string }>;
  caveat: string;
};

export function buildClearPathReportData({
  inputs,
  results,
  uncertainty,
  exportedAt,
}: BuildReportArgs): ClearPathReportData {
  const interpretation = generateInterpretation(results, inputs, uncertainty);
  const overallSignal = generateOverallSignal(results, inputs, uncertainty);
  const structured = generateStructuredRecommendation(inputs, results, uncertainty);
  const overview = generateOverviewSummary(results, inputs, uncertainty);

  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );

  const netCostLabel = getNetCostLabel(results);
  const mainDriver = getMainDriverText(inputs);
  const uncertaintyReadout = assessUncertaintyRobustness(
    uncertainty,
    inputs.cost_effectiveness_threshold,
  );

  return {
    meta: {
      title: "ClearPath Report",
      module: "Health Economics Scenario Lab",
      exportedAt,
      decisionStatus,
    },
    executiveSummary: {
      overview,
      overallSignal,
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: `${structured.main_dependency} Main driver: ${mainDriver}.`,
      mainFragility: structured.main_fragility,
      bestNextStep: structured.best_next_step,
    },
    headlineMetrics: [
      {
        label: "Cases shifted earlier",
        value: formatNumber(results.cases_shifted_total),
      },
      {
        label: "Emergency presentations avoided",
        value: formatNumber(results.emergency_presentations_avoided_total),
      },
      {
        label: netCostLabel,
        value: formatCurrency(Math.abs(results.discounted_net_cost_total)),
      },
      {
        label: "Discounted cost per QALY",
        value: formatCurrency(results.discounted_cost_per_qaly),
      },
      {
        label: "Return on spend",
        value: formatRatio(results.roi),
      },
      {
        label: "Max intervention cost per case",
        value: formatCurrency(results.break_even_cost_per_case),
      },
      {
        label: "Required late diagnosis reduction",
        value: formatPercent(results.break_even_reduction_in_late_diagnosis),
      },
      {
        label: "Break-even horizon",
        value: results.break_even_horizon,
      },
    ],
    assumptions: [
      { label: "Targeting mode", value: inputs.targeting_mode },
      {
        label: "Annual incident cases",
        value: formatNumber(inputs.annual_incident_cases),
      },
      {
        label: "Current late diagnosis rate",
        value: formatPercent(inputs.current_late_diagnosis_rate),
      },
      {
        label: "Achievable reduction in late diagnosis",
        value: formatPercent(inputs.achievable_reduction_in_late_diagnosis),
      },
      {
        label: "Intervention reach",
        value: formatPercent(inputs.intervention_reach_rate),
      },
      {
        label: "Intervention cost per case",
        value: formatCurrency(inputs.intervention_cost_per_case_reached),
      },
      {
        label: "Time horizon",
        value: `${inputs.time_horizon_years} years`,
      },
      {
        label: "Discount rate",
        value: formatPercent(inputs.discount_rate),
      },
    ],
    uncertainty: uncertainty.map((row) => ({
      label: row.case,
      value: formatCurrency(row.discounted_cost_per_qaly),
      note: `${formatNumber(row.cases_shifted_total)} cases shifted earlier · ${row.decision_status}`,
    })),
    caveat:
      `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation or local validation. ${uncertaintyReadout}`,
  };
}