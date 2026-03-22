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
  "Lower-cost delivery",
  "Stronger shift",
  "Higher-risk targeting",
  "Tighter high-risk targeting",
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

export function getLowerCostDelivery(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    intervention_cost_per_case_reached:
      defaults.intervention_cost_per_case_reached * 0.8,
    intervention_reach_rate: Math.min(
      1,
      defaults.intervention_reach_rate * 1.02,
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
    effect_decay_rate: Math.max(0, defaults.effect_decay_rate * 0.85),
    participation_dropoff_rate: Math.max(
      0,
      defaults.participation_dropoff_rate * 0.9,
    ),
  };
}

export function getHigherRiskTargeting(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Higher-risk targeting",
    current_late_diagnosis_rate: Math.min(
      1,
      defaults.current_late_diagnosis_rate * 1.05,
    ),
    intervention_reach_rate: Math.min(
      1,
      defaults.intervention_reach_rate * 1.03,
    ),
  };
}

export function getTighterHighRiskTargeting(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Tighter high-risk targeting",
    current_late_diagnosis_rate: Math.min(
      1,
      defaults.current_late_diagnosis_rate * 1.08,
    ),
    intervention_reach_rate: Math.min(
      1,
      defaults.intervention_reach_rate * 1.05,
    ),
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
    effect_decay_rate: Math.max(0, defaults.effect_decay_rate * 0.9),
    participation_dropoff_rate: Math.max(
      0,
      defaults.participation_dropoff_rate * 0.9,
    ),
  };
}

export const SCENARIO_MAP: Record<string, (defaults: Inputs) => Partial<Inputs>> = {
  "Base case": getBaseCase,
  "Lower-cost delivery": getLowerCostDelivery,
  "Stronger shift": getStrongerShift,
  "Higher-risk targeting": getHigherRiskTargeting,
  "Tighter high-risk targeting": getTighterHighRiskTargeting,
  "Targeted and stronger shift": getTargetedAndStronger,
};