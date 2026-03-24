import { clampRate, runModel } from "@/lib/waitwise/calculations";
import { ASSUMPTION_META } from "@/lib/waitwise/metadata";
import type { Inputs, SensitivityRow } from "@/lib/waitwise/types";

export const SENSITIVITY_VARIABLES: Array<keyof Inputs> = [
  "demand_reduction_effect",
  "throughput_increase_effect",
  "escalation_reduction_effect",
  "intervention_cost_per_patient_reached",
  "monthly_escalation_rate",
  "qaly_gain_per_escalation_avoided",
  "cost_per_admission",
  "cost_per_escalation",
  "effect_decay_rate",
  "participation_dropoff_rate",
];

const RATE_VARIABLES = new Set<keyof Inputs>([
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

function applyVariation(
  value: number,
  variation: number,
  isRate: boolean,
): { low: number; high: number } {
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
  variables: Array<keyof Inputs>,
  variation = 0.2,
  outcomeKey: keyof ReturnType<typeof runModel> = "discounted_cost_per_qaly",
): SensitivityRow[] {
  const baseResults = runModel(baseInputs);
  const baseValue = Number(baseResults[outcomeKey]);

  return variables
    .map((variable): SensitivityRow => {
      const meta = ASSUMPTION_META[variable];
      const baseInputValue = Number(baseInputs[variable]);
      const isRate = RATE_VARIABLES.has(variable);

      const { low, high } = applyVariation(baseInputValue, variation, isRate);

      const lowCaseInputs: Inputs = { ...baseInputs, [variable]: low };
      const highCaseInputs: Inputs = { ...baseInputs, [variable]: high };

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