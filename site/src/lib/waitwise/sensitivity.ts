import { runModel, clampRate } from "@/lib/waitwise/model";
import { ASSUMPTION_META } from "@/lib/waitwise/metadata";
import type { Inputs, SensitivityRow } from "@/lib/waitwise/types";

export const SENSITIVITY_VARIABLES: Array<keyof Inputs> = [
  "demand_reduction_effect",
  "throughput_increase_effect",
  "escalation_reduction_effect",
  "intervention_cost_per_patient_reached",
  "monthly_escalation_rate",
  "qaly_gain_per_escalation_avoided",
  "effect_decay_rate",
  "participation_dropoff_rate",
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

export function runOneWaySensitivity(
  baseInputs: Inputs,
  variables: Array<keyof Inputs>,
  variation = 0.2,
  outcomeKey: "discounted_cost_per_qaly" = "discounted_cost_per_qaly",
): SensitivityRow[] {
  const baseResults = runModel(baseInputs);
  const baseValue = baseResults[outcomeKey];

  const rateVariables = new Set<keyof Inputs>([
    "intervention_reach_rate",
    "demand_reduction_effect",
    "throughput_increase_effect",
    "escalation_reduction_effect",
    "effect_decay_rate",
    "participation_dropoff_rate",
    "monthly_escalation_rate",
    "admission_rate_after_escalation",
    "discount_rate",
  ]);

  const rows: SensitivityRow[] = variables.map((variable) => {
    const meta = ASSUMPTION_META[variable];
    const baseInputValue = baseInputs[variable];

    if (typeof baseInputValue !== "number") {
      return {
        variable,
        label: meta.label,
        base_input: 0,
        low_input: 0,
        high_input: 0,
        base_outcome: baseValue,
        low_outcome: baseValue,
        high_outcome: baseValue,
        low_delta: 0,
        high_delta: 0,
        swing: 0,
      };
    }

    const [lowInput, highInput] = applyVariation(
      baseInputValue,
      variation,
      rateVariables.has(variable),
    );

    const lowCaseInputs: Inputs = {
      ...baseInputs,
      [variable]: lowInput,
    };

    const highCaseInputs: Inputs = {
      ...baseInputs,
      [variable]: highInput,
    };

    const lowOutcome = runModel(lowCaseInputs)[outcomeKey];
    const highOutcome = runModel(highCaseInputs)[outcomeKey];

    const lowDelta = lowOutcome - baseValue;
    const highDelta = highOutcome - baseValue;
    const swing = Math.abs(highOutcome - lowOutcome);

    return {
      variable,
      label: meta.label,
      base_input: baseInputValue,
      low_input: lowInput,
      high_input: highInput,
      base_outcome: baseValue,
      low_outcome: lowOutcome,
      high_outcome: highOutcome,
      low_delta: lowDelta,
      high_delta: highDelta,
      swing,
    };
  });

  return rows.sort((a, b) => b.swing - a.swing);
}

export function buildSensitivityTakeaways(
  sensitivityRows: SensitivityRow[],
): string[] {
  const top = [...sensitivityRows].sort((a, b) => b.swing - a.swing).slice(0, 3);

  const takeaways: string[] = [];

  if (top[0]) {
    takeaways.push(
      `The result is most sensitive to ${top[0].label.toLowerCase()}.`,
    );
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