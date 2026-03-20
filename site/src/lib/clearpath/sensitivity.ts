import { clampRate, runModel } from "@/lib/clearpath/calculations";
import { ASSUMPTION_META } from "@/lib/clearpath/metadata";
import type { Inputs, SensitivityRow } from "@/lib/clearpath/types";

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
  const baseValue = Number(baseResults[outcomeKey]);

  const rows: SensitivityRow[] = [];

  for (const variable of variables) {
    const meta = ASSUMPTION_META[variable];
    const baseInputValue = Number(baseInputs[variable]);

    const isRate = new Set<keyof Inputs>([
      "current_late_diagnosis_rate",
      "achievable_reduction_in_late_diagnosis",
      "late_emergency_presentation_rate",
      "early_emergency_presentation_rate",
      "effect_decay_rate",
      "participation_dropoff_rate",
      "discount_rate",
    ]).has(variable);

    const [lowInput, highInput] = applyVariation(
      baseInputValue,
      variation,
      isRate,
    );

    const lowCaseInputs: Inputs = { ...baseInputs, [variable]: lowInput };
    const highCaseInputs: Inputs = { ...baseInputs, [variable]: highInput };

    const lowCaseResults = runModel(lowCaseInputs);
    const highCaseResults = runModel(highCaseInputs);

    const lowOutcome = Number(lowCaseResults[outcomeKey]);
    const highOutcome = Number(highCaseResults[outcomeKey]);

    const lowDelta = lowOutcome - baseValue;
    const highDelta = highOutcome - baseValue;
    const swing = Math.abs(highOutcome - lowOutcome);

    rows.push({
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
    });
  }

  return rows.sort((a, b) => b.swing - a.swing);
}

export function buildSensitivityTakeaways(
  sensitivityRows: SensitivityRow[],
): string[] {
  const top = [...sensitivityRows].sort((a, b) => b.swing - a.swing).slice(0, 3);

  const takeaways: string[] = [];

  if (top.length >= 1) {
    takeaways.push(
      `The result is most sensitive to ${top[0].label.toLowerCase()}.`,
    );
  }

  if (top.length >= 2) {
    takeaways.push(
      `${top[1].label} is the next biggest driver of movement in discounted cost per QALY.`,
    );
  }

  if (top.length >= 3) {
    takeaways.push(
      `Changes in ${top[2].label.toLowerCase()} still matter, but less than the leading two drivers.`,
    );
  }

  return takeaways;
}