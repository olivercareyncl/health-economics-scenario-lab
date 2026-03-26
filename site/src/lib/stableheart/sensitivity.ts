import { clampRate, runModel } from "@/lib/stableheart/calculations";
import { ASSUMPTION_META } from "@/lib/stableheart/metadata";
import type {
  Inputs,
  ParameterSensitivityRow,
  SensitivitySummary,
} from "@/lib/stableheart/types";

export const SENSITIVITY_VARIABLES: Array<keyof Inputs> = [
  "baseline_recurrent_event_rate",
  "risk_reduction_in_recurrent_events",
  "intervention_cost_per_patient_reached",
  "sustained_engagement_rate",
  "qaly_gain_per_event_avoided",
  "annual_effect_decay_rate",
  "annual_participation_dropoff_rate",
  "admission_probability_per_event",
];

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
  variables: Array<keyof Inputs>,
  variation = 0.2,
  outcomeKey: keyof ReturnType<typeof runModel> = "discounted_cost_per_qaly",
): ParameterSensitivityRow[] {
  const baseResults = runModel(baseInputs);
  const baseIcer = Number(baseResults[outcomeKey]);

  const rows: ParameterSensitivityRow[] = [];

  for (const variable of variables) {
    const meta = ASSUMPTION_META[variable];
    const baseValue = Number(baseInputs[variable]);

    const isRate = new Set<keyof Inputs>([
      "baseline_recurrent_event_rate",
      "admission_probability_per_event",
      "intervention_reach_rate",
      "sustained_engagement_rate",
      "annual_participation_dropoff_rate",
      "risk_reduction_in_recurrent_events",
      "annual_effect_decay_rate",
      "discount_rate",
    ]).has(variable);

    const [lowValue, highValue] = applyVariation(baseValue, variation, isRate);

    const lowInputs: Inputs = { ...baseInputs, [variable]: lowValue };
    const highInputs: Inputs = { ...baseInputs, [variable]: highValue };

    const lowResults = runModel(lowInputs);
    const highResults = runModel(highInputs);

    const lowIcer = Number(lowResults[outcomeKey]);
    const highIcer = Number(highResults[outcomeKey]);

    rows.push({
      parameter_key: variable,
      parameter_label: meta.label,
      low_value_label: formatScenarioValue(lowValue, isRate),
      high_value_label: formatScenarioValue(highValue, isRate),
      low_icer: lowIcer,
      base_icer: baseIcer,
      high_icer: highIcer,
      low_net_cost: lowResults.discounted_net_cost_total,
      base_net_cost: baseResults.discounted_net_cost_total,
      high_net_cost: highResults.discounted_net_cost_total,
      max_abs_icer_change: Math.max(
        Math.abs(lowIcer - baseIcer),
        Math.abs(highIcer - baseIcer),
      ),
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