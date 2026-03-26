import { clampRate, runModel } from "@/lib/clearpath/calculations";
import { ASSUMPTION_META } from "@/lib/clearpath/metadata";
import type {
  Inputs,
  ParameterSensitivityRow,
  SensitivitySummary,
} from "@/lib/clearpath/types";

export const SENSITIVITY_VARIABLES: Array<keyof Inputs> = [
  "achievable_reduction_in_late_diagnosis",
  "intervention_cost_per_case_reached",
  "current_late_diagnosis_rate",
  "qaly_gain_per_case_shifted",
  "treatment_cost_late",
  "treatment_cost_early",
  "effect_decay_rate",
  "participation_dropoff_rate",
];

const RATE_VARIABLES = new Set<keyof Inputs>([
  "current_late_diagnosis_rate",
  "achievable_reduction_in_late_diagnosis",
  "late_emergency_presentation_rate",
  "early_emergency_presentation_rate",
  "intervention_reach_rate",
  "effect_decay_rate",
  "participation_dropoff_rate",
  "discount_rate",
]);

function applyVariation(
  value: number,
  variation: number,
  isRate: boolean,
): [number, number] {
  let low = value * (1 - variation);
  let high = value * (1 + variation);

  if (isRate) {
    low = clampRate(low);
    high = clampRate(high);
  }

  return [low, high];
}

function formatScenarioValue(value: number, isRate: boolean): string {
  if (isRate) {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (Math.abs(value) >= 1000) {
    return `£${Math.round(value).toLocaleString()}`;
  }

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(2);
}

export function runOneWaySensitivity(
  baseInputs: Inputs,
  variables: Array<keyof Inputs> = SENSITIVITY_VARIABLES,
  variation = 0.2,
  outcomeKey: keyof ReturnType<typeof runModel> = "discounted_cost_per_qaly",
): ParameterSensitivityRow[] {
  const baseResults = runModel(baseInputs);
  const baseOutcome = Number(baseResults[outcomeKey]);

  const rows: ParameterSensitivityRow[] = [];

  for (const variable of variables) {
    const meta = ASSUMPTION_META[variable];
    const baseValue = Number(baseInputs[variable]);
    const isRate = RATE_VARIABLES.has(variable);

    const [lowValue, highValue] = applyVariation(baseValue, variation, isRate);

    const lowCaseInputs: Inputs = { ...baseInputs, [variable]: lowValue };
    const highCaseInputs: Inputs = { ...baseInputs, [variable]: highValue };

    const lowCaseResults = runModel(lowCaseInputs);
    const highCaseResults = runModel(highCaseInputs);

    const lowOutcome = Number(lowCaseResults[outcomeKey]);
    const highOutcome = Number(highCaseResults[outcomeKey]);

    const lowDelta = lowOutcome - baseOutcome;
    const highDelta = highOutcome - baseOutcome;

    rows.push({
      parameter_key: variable,
      parameter_label: meta.label,
      base_value: baseValue,
      low_value: lowValue,
      high_value: highValue,
      low_value_label: formatScenarioValue(lowValue, isRate),
      high_value_label: formatScenarioValue(highValue, isRate),
      base_icer: baseOutcome,
      low_icer: lowOutcome,
      high_icer: highOutcome,
      low_delta: lowDelta,
      high_delta: highDelta,
      max_abs_icer_change: Math.max(Math.abs(lowDelta), Math.abs(highDelta)),
    });
  }

  return rows.sort((a, b) => b.max_abs_icer_change - a.max_abs_icer_change);
}

export function buildSensitivityTakeaways(
  sensitivityRows: ParameterSensitivityRow[],
): string[] {
  const top = [...sensitivityRows]
    .sort((a, b) => b.max_abs_icer_change - a.max_abs_icer_change)
    .slice(0, 3);

  const takeaways: string[] = [];

  if (top.length >= 1) {
    takeaways.push(
      `The result is most sensitive to ${top[0].parameter_label.toLowerCase()}.`,
    );
  }

  if (top.length >= 2) {
    takeaways.push(
      `${top[1].parameter_label} is the next biggest driver of movement in discounted cost per QALY.`,
    );
  }

  if (top.length >= 3) {
    takeaways.push(
      `Changes in ${top[2].parameter_label.toLowerCase()} still matter, but less than the leading two drivers.`,
    );
  }

  return takeaways;
}

export function runParameterSensitivity(
  baseInputs: Inputs,
  variables: Array<keyof Inputs> = SENSITIVITY_VARIABLES,
  variation = 0.2,
): SensitivitySummary {
  const rows = runOneWaySensitivity(
    baseInputs,
    variables,
    variation,
    "discounted_cost_per_qaly",
  );

  return {
    rows,
    primary_driver: rows[0] ?? null,
    top_drivers: rows.slice(0, 5),
  };
}