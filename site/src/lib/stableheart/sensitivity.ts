import { clampRate, runModel } from "@/lib/stableheart/calculations";
import { ASSUMPTION_META } from "@/lib/stableheart/metadata";
import type { Inputs } from "@/lib/stableheart/types";

export const SENSITIVITY_VARIABLES = [
  "baseline_recurrent_event_rate",
  "risk_reduction_in_recurrent_events",
  "intervention_cost_per_patient_reached",
  "sustained_engagement_rate",
  "qaly_gain_per_event_avoided",
  "annual_effect_decay_rate",
  "annual_participation_dropoff_rate",
  "admission_probability_per_event",
] as const;

function applyVariation(value: number, variation: number, isRate: boolean) {
  let low = value * (1 - variation);
  let high = value * (1 + variation);

  if (isRate) {
    low = clampRate(low);
    high = clampRate(high);
  }

  return { low, high };
}

export function runOneWaySensitivity(
  baseInputs: Inputs,
  variables: readonly string[],
  variation = 0.2,
  outcomeKey: keyof ReturnType<typeof runModel> = "discounted_cost_per_qaly",
) {
  const baseResults = runModel(baseInputs);
  const baseValue = Number(baseResults[outcomeKey]);

  const rows = variables.map((variable) => {
    const meta = ASSUMPTION_META[variable];
    const baseInputValue = Number(baseInputs[variable as keyof Inputs]);

    const isRate = new Set([
      "baseline_recurrent_event_rate",
      "admission_probability_per_event",
      "intervention_reach_rate",
      "sustained_engagement_rate",
      "annual_participation_dropoff_rate",
      "risk_reduction_in_recurrent_events",
      "annual_effect_decay_rate",
      "discount_rate",
    ]).has(variable);

    const { low, high } = applyVariation(baseInputValue, variation, isRate);

    const lowInputs = { ...baseInputs, [variable]: low } as Inputs;
    const highInputs = { ...baseInputs, [variable]: high } as Inputs;

    const lowOutcome = Number(runModel(lowInputs)[outcomeKey]);
    const highOutcome = Number(runModel(highInputs)[outcomeKey]);

    return {
      variable,
      label: meta.label,
      base_input: baseInputValue,
      low_input: low,
      high_input: high,
      base_outcome: baseValue,
      low_outcome: lowOutcome,
      high_outcome: highOutcome,
      low_delta: lowOutcome - baseValue,
      high_delta: highOutcome - baseValue,
      swing: Math.abs(highOutcome - lowOutcome),
    };
  });

  return rows.sort((a, b) => b.swing - a.swing);
}

export function buildSensitivityTakeaways(
  sensitivityRows: Array<{ label: string; swing: number }>,
): string[] {
  const top = [...sensitivityRows].sort((a, b) => b.swing - a.swing).slice(0, 3);

  const takeaways: string[] = [];

  if (top[0]) {
    takeaways.push(`The result is most sensitive to ${top[0].label.toLowerCase()}.`);
  }
  if (top[1]) {
    takeaways.push(
      `${top[1].label} is the next biggest driver of movement in discounted cost per QALY.`,
    );
  }
  if (top[2]) {
    takeaways.push(
      `Changes in ${top[2].label.toLowerCase()} still matter, but less than the leading two drivers.`,
    );
  }

  return takeaways;
}