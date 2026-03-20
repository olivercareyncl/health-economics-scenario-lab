import type {
  ComparatorOption,
  CostingMethod,
  Inputs,
  TargetingMode,
} from "@/lib/waitwise/types";

export const TARGETING_MODE_OPTIONS: readonly TargetingMode[] = [
  "Broad waiting list",
  "Higher-risk targeting",
  "Long-wait targeting",
];

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Escalation and admission savings only",
  "Bed-day value only",
  "Combined illustrative view",
];

export const COMPARATOR_OPTIONS: readonly ComparatorOption[] = [
  "Demand reduction focus",
  "Throughput boost",
  "Long-wait targeting",
  "Lower-cost delivery",
  "Targeted and stronger effect",
];

export type TargetingModeAdjustment = {
  population_multiplier: number;
  reach_multiplier: number;
  risk_multiplier: number;
};

export type CostingMethodConfig = {
  mode: "acute" | "bed_day" | "combined";
};

export const TARGETING_MODE_MAP: Record<TargetingMode, TargetingModeAdjustment> = {
  "Broad waiting list": {
    population_multiplier: 1.0,
    reach_multiplier: 1.0,
    risk_multiplier: 1.0,
  },
  "Higher-risk targeting": {
    population_multiplier: 0.6,
    reach_multiplier: 1.05,
    risk_multiplier: 1.3,
  },
  "Long-wait targeting": {
    population_multiplier: 0.45,
    reach_multiplier: 1.1,
    risk_multiplier: 1.45,
  },
};

export const COSTING_METHOD_MAP: Record<CostingMethod, CostingMethodConfig> = {
  "Escalation and admission savings only": { mode: "acute" },
  "Bed-day value only": { mode: "bed_day" },
  "Combined illustrative view": { mode: "combined" },
};

export function getBaseCase(defaults: Inputs): Partial<Inputs> {
  return { ...defaults };
}

export function getDemandReductionFocus(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    demand_reduction_effect: defaults.demand_reduction_effect * 1.4,
    throughput_increase_effect: defaults.throughput_increase_effect * 0.7,
  };
}

export function getThroughputBoost(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    throughput_increase_effect: defaults.throughput_increase_effect * 1.4,
    demand_reduction_effect: defaults.demand_reduction_effect * 0.7,
  };
}

export function getLongWaitTargeting(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Long-wait targeting",
  };
}

export function getLowerCostDelivery(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    intervention_cost_per_patient_reached:
      defaults.intervention_cost_per_patient_reached * 0.8,
  };
}

export function getTargetedAndStronger(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Higher-risk targeting",
    demand_reduction_effect: defaults.demand_reduction_effect * 1.15,
    throughput_increase_effect: defaults.throughput_increase_effect * 1.15,
    escalation_reduction_effect: defaults.escalation_reduction_effect * 1.15,
  };
}

export const SCENARIO_MAP: Record<string, (defaults: Inputs) => Partial<Inputs>> = {
  "Base case": getBaseCase,
  "Demand reduction focus": getDemandReductionFocus,
  "Throughput boost": getThroughputBoost,
  "Long-wait targeting": getLongWaitTargeting,
  "Lower-cost delivery": getLowerCostDelivery,
  "Targeted and stronger effect": getTargetedAndStronger,
};