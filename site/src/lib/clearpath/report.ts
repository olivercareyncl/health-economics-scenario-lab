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
  title: string;
  subtitle?: string;
  generatedAt?: string;
  decisionStatus?: string;
  purpose: string;
  scenarioQuestion: string;
  scenarioContext: Array<{ label: string; value: string }>;
  headlineMetrics: Array<{ label: string; value: string }>;
  summary: string;
  interpretation: Array<{ label: string; value: string }>;
  assumptions: Array<{
    section: string;
    items: Array<{ label: string; value: string; note?: string }>;
  }>;
  uncertainty: Array<{ label: string; value: string; note?: string }>;
  recommendations: Array<{ label: string; value: string }>;
  caveat?: string;
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
    title: "ClearPath scenario report",
    subtitle: "Health Economics Scenario Lab",
    generatedAt: exportedAt,
    decisionStatus,
    purpose:
      "ClearPath is an exploratory health economics scenario tool. It tests whether shifting a share of later diagnoses earlier could reduce emergency pathway pressure, admissions, bed use, and downstream economic burden under a defined set of assumptions.",
    scenarioQuestion:
      "This run explores whether earlier diagnosis, under the selected assumptions, appears capable of generating sufficient pathway and economic value to support further investigation or local validation.",
    scenarioContext: [
      {
        label: "Targeting mode",
        value: inputs.targeting_mode,
      },
      {
        label: "Annual incident cases",
        value: formatNumber(inputs.annual_incident_cases),
      },
      {
        label: "Current late diagnosis rate",
        value: formatPercent(inputs.current_late_diagnosis_rate),
      },
      {
        label: "Intervention reach",
        value: formatPercent(inputs.intervention_reach_rate),
      },
      {
        label: "Time horizon",
        value: `${inputs.time_horizon_years} years`,
      },
      {
        label: "Cost-effectiveness threshold",
        value: formatCurrency(inputs.cost_effectiveness_threshold),
      },
    ],
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
    summary: overview,
    interpretation: [
      {
        label: "Indicative economic signal",
        value: decisionStatus,
      },
      {
        label: "Overall signal",
        value: overallSignal,
      },
      {
        label: "What this scenario indicates",
        value: interpretation.what_model_suggests,
      },
      {
        label: "Main dependency",
        value: `${structured.main_dependency} Main driver: ${mainDriver}.`,
      },
      {
        label: "What could weaken the case",
        value: structured.main_fragility,
      },
      {
        label: "Best next step",
        value: structured.best_next_step,
      },
    ],
    assumptions: [
      {
        section: "Core scenario assumptions",
        items: [
          {
            label: "Targeting mode",
            value: inputs.targeting_mode,
            note: "How concentrated the opportunity is within the target population.",
          },
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
        ],
      },
      {
        section: "Pathway assumptions",
        items: [
          {
            label: "Emergency presentation rate, later diagnosis",
            value: formatPercent(inputs.late_emergency_presentation_rate),
          },
          {
            label: "Emergency presentation rate, earlier diagnosis",
            value: formatPercent(inputs.early_emergency_presentation_rate),
          },
          {
            label: "Admissions per emergency presentation",
            value: formatNumber(inputs.admissions_per_emergency_presentation),
          },
          {
            label: "Average length of stay",
            value: formatNumber(inputs.average_length_of_stay),
          },
        ],
      },
      {
        section: "Cost assumptions",
        items: [
          {
            label: "Costing method",
            value: inputs.costing_method,
          },
          {
            label: "Cost-effectiveness threshold",
            value: formatCurrency(inputs.cost_effectiveness_threshold),
          },
          {
            label: "Treatment cost, earlier diagnosis",
            value: formatCurrency(inputs.treatment_cost_early),
          },
          {
            label: "Treatment cost, later diagnosis",
            value: formatCurrency(inputs.treatment_cost_late),
          },
          {
            label: "Cost per emergency admission",
            value: formatCurrency(inputs.cost_per_emergency_admission),
          },
          {
            label: "Cost per bed day",
            value: formatCurrency(inputs.cost_per_bed_day),
          },
        ],
      },
      {
        section: "Outcome and persistence assumptions",
        items: [
          {
            label: "QALY gain per case shifted earlier",
            value: formatNumber(inputs.qaly_gain_per_case_shifted),
          },
          {
            label: "Annual effect decay",
            value: formatPercent(inputs.effect_decay_rate),
          },
          {
            label: "Annual participation drop-off",
            value: formatPercent(inputs.participation_dropoff_rate),
          },
          {
            label: "Discount rate",
            value: formatPercent(inputs.discount_rate),
          },
        ],
      },
    ],
    uncertainty: uncertainty.map((row) => ({
      label: row.case,
      value: formatCurrency(row.discounted_cost_per_qaly),
      note: `${formatNumber(row.cases_shifted_total)} cases shifted earlier · ${row.decision_status}`,
    })),
    recommendations: [
      {
        label: "Recommended next check 1",
        value: "Validate the local baseline for late diagnosis and emergency presentation rates.",
      },
      {
        label: "Recommended next check 2",
        value: "Test whether the assumed achievable reduction in late diagnosis is realistic for the intended target population.",
      },
      {
        label: "Recommended next check 3",
        value: "Compare broad implementation against more targeted deployment to see whether value is concentrated in higher-opportunity groups.",
      },
    ],
    caveat: `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data and validation work. ${uncertaintyReadout}`,
  };
}