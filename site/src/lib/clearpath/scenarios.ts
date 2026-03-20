import type {
  ComparatorOption,
  CostingMethod,
  Inputs,
  TargetingAdjustment,
  TargetingMode,
} from "@/lib/clearpath/types";

export const TARGETING_MODE_OPTIONS: TargetingMode[] = [
  "Broad population",
  "Higher-risk targeting",
  "Tighter high-risk targeting",
];

export const COSTING_METHOD_OPTIONS: CostingMethod[] = [
  "Treatment cost difference only",
  "Emergency/admission savings only",
  "Combined illustrative view",
];

export const COMPARATOR_OPTIONS: ComparatorOption[] = [
  "Higher-risk targeting",
  "Tighter high-risk targeting",
  "Modest shift",
  "Stronger shift",
  "Lower-cost delivery",
  "Targeted and stronger shift",
];

export type CostingMethodConfig = {
  mode: "treatment" | "acute" | "combined";
};

export const TARGETING_MODE_MAP: Record<TargetingMode, TargetingAdjustment> = {
  "Broad population": {
    population_multiplier: 1.0,
    late_rate_multiplier: 1.0,
    reach_multiplier: 1.0,
    shift_multiplier: 1.0,
  },
  "Higher-risk targeting": {
    population_multiplier: 0.7,
    late_rate_multiplier: 1.25,
    reach_multiplier: 1.05,
    shift_multiplier: 1.1,
  },
  "Tighter high-risk targeting": {
    population_multiplier: 0.45,
    late_rate_multiplier: 1.5,
    reach_multiplier: 1.1,
    shift_multiplier: 1.2,
  },
};

export const COSTING_METHOD_MAP: Record<CostingMethod, CostingMethodConfig> = {
  "Treatment cost difference only": { mode: "treatment" },
  "Emergency/admission savings only": { mode: "acute" },
  "Combined illustrative view": { mode: "combined" },
};

export function getBaseCase(defaults: Inputs): Partial<Inputs> {
  return { ...defaults };
}

export function getModestShift(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    achievable_reduction_in_late_diagnosis: Math.max(
      0,
      defaults.achievable_reduction_in_late_diagnosis * 0.7,
    ),
  };
}

export function getStrongerShift(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    achievable_reduction_in_late_diagnosis: Math.min(
      0.5,
      defaults.achievable_reduction_in_late_diagnosis * 1.3,
    ),
  };
}

export function getHigherRiskTargeting(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Higher-risk targeting",
  };
}

export function getTighterHighRiskTargeting(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Tighter high-risk targeting",
  };
}

export function getLowerCostDelivery(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    intervention_cost_per_case_reached:
      defaults.intervention_cost_per_case_reached * 0.8,
  };
}

export function getTargetedAndStronger(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Higher-risk targeting",
    achievable_reduction_in_late_diagnosis: Math.min(
      0.5,
      defaults.achievable_reduction_in_late_diagnosis * 1.2,
    ),
  };
}

export const SCENARIO_MAP: Record<string, (defaults: Inputs) => Partial<Inputs>> = {
  "Base case": getBaseCase,
  "Modest shift": getModestShift,
  "Stronger shift": getStrongerShift,
  "Higher-risk targeting": getHigherRiskTargeting,
  "Tighter high-risk targeting": getTighterHighRiskTargeting,
  "Lower-cost delivery": getLowerCostDelivery,
  "Targeted and stronger shift": getTargetedAndStronger,
};