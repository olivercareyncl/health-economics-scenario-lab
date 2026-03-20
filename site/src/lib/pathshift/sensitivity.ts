import { clampRate, runModel } from "@/lib/pathshift/calculations";
import { ASSUMPTION_META } from "@/lib/pathshift/metadata";
import type { Inputs, SensitivityRow } from "@/lib/pathshift/types";

export const SENSITIVITY_VARIABLES: Array<keyof Inputs> = [
  "proportion_shifted_to_lower_cost_setting",
  "reduction_in_admission_rate",
  "reduction_in_follow_up_contacts",
  "reduction_in_length_of_stay",
  "redesign_cost_per_patient",
  "qaly_gain_per_patient_improved",
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
  outcomeKey: keyof ReturnType<typeof runModel> = "discounted_cost_per_qaly",
): SensitivityRow[] {
  const baseResults = runModel(baseInputs);
  const baseValue = baseResults[outcomeKey] as number;

  const rows = variables.map((variable) => {
    const meta = ASSUMPTION_META[variable];
    const baseInputValue = baseInputs[variable] as number;

    const isRate = [
      "current_acute_managed_rate",
      "current_admission_rate",
      "proportion_shifted_to_lower_cost_setting",
      "reduction_in_admission_rate",
      "reduction_in_follow_up_contacts",
      "reduction_in_length_of_stay",
      "implementation_reach_rate",
      "effect_decay_rate",
      "participation_dropoff_rate",
      "discount_rate",
    ].includes(variable);

    const [lowInput, highInput] = applyVariation(
      baseInputValue,
      variation,
      isRate,
    );

    const lowCaseInputs: Inputs = { ...baseInputs, [variable]: lowInput };
    const highCaseInputs: Inputs = { ...baseInputs, [variable]: highInput };

    const lowCaseResults = runModel(lowCaseInputs);
    const highCaseResults = runModel(highCaseInputs);

    const lowOutcome = lowCaseResults[outcomeKey] as number;
    const highOutcome = highCaseResults[outcomeKey] as number;

    const low_delta = lowOutcome - baseValue;
    const high_delta = highOutcome - baseValue;
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
      low_delta,
      high_delta,
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