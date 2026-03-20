import { clampRate, runModel } from "@/lib/frailtyforward/calculations";
import { ASSUMPTION_META } from "@/lib/frailtyforward/metadata";
import type { Inputs } from "@/lib/frailtyforward/types";

export const SENSITIVITY_VARIABLES = [
  "reduction_in_crisis_event_rate",
  "reduction_in_admission_rate",
  "reduction_in_length_of_stay",
  "support_cost_per_patient",
  "baseline_non_elective_admission_rate",
  "qaly_gain_per_patient_stabilised",
  "effect_decay_rate",
  "participation_dropoff_rate",
] as const;

export type SensitivityRow = {
  variable: string;
  label: string;
  base_input: number;
  low_input: number;
  high_input: number;
  base_outcome: number;
  low_outcome: number;
  high_outcome: number;
  low_delta: number;
  high_delta: number;
  swing: number;
};

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
): SensitivityRow[] {
  const baseResults = runModel(baseInputs);
  const baseValue = Number(baseResults[outcomeKey]);

  return variables
    .map((variable) => {
      const meta = ASSUMPTION_META[variable];
      const baseInputValue = Number(baseInputs[variable as keyof Inputs]);

      const isRate = new Set([
        "baseline_crisis_event_rate",
        "baseline_non_elective_admission_rate",
        "implementation_reach_rate",
        "reduction_in_crisis_event_rate",
        "reduction_in_admission_rate",
        "reduction_in_length_of_stay",
        "effect_decay_rate",
        "participation_dropoff_rate",
        "discount_rate",
      ]).has(variable);

      const { low, high } = applyVariation(baseInputValue, variation, isRate);

      const lowCaseInputs = { ...baseInputs, [variable]: low } as Inputs;
      const highCaseInputs = { ...baseInputs, [variable]: high } as Inputs;

      const lowOutcome = Number(runModel(lowCaseInputs)[outcomeKey]);
      const highOutcome = Number(runModel(highCaseInputs)[outcomeKey]);

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
    })
    .sort((a, b) => b.swing - a.swing);
}

export function buildSensitivityTakeaways(sensitivityRows: SensitivityRow[]) {
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