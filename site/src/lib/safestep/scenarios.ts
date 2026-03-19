import type {
  CostingMethod,
  CostingMethodConfig,
  SafeStepInputs,
  ScenarioName,
  TargetingAdjustment,
  TargetingMode,
} from "./types";

export const TARGETING_MODE_OPTIONS: TargetingMode[] = [
  "Broad population",
  "Higher-risk targeting",
  "Tighter high-risk targeting",
];

export const COSTING_METHOD_OPTIONS: CostingMethod[] = [
  "Admission cost only",
  "Bed-day value only",
  "Combined illustrative view",
];

export const TARGETING_MODE_MAP: Record<TargetingMode, TargetingAdjustment> = {
  "Broad population": {
    population_multiplier: 1.0,
    risk_multiplier: 1.0,
    uptake_multiplier: 1.0,
  },
  "Higher-risk targeting": {
    population_multiplier: 0.6,
    risk_multiplier: 1.4,
    uptake_multiplier: 1.05,
  },
  "Tighter high-risk targeting": {
    population_multiplier: 0.35,
    risk_multiplier: 1.8,
    uptake_multiplier: 1.1,
  },
};

export const COSTING_METHOD_MAP: Record<CostingMethod, CostingMethodConfig> = {
  "Admission cost only": { mode: "admission" },
  "Bed-day value only": { mode: "bed_day" },
  "Combined illustrative view": { mode: "combined" },
};

function getBaseCase(defaults: SafeStepInputs): SafeStepInputs {
  return { ...defaults };
}

function getHigherRiskTargeting(defaults: SafeStepInputs): SafeStepInputs {
  return {
    ...defaults,
    targeting_mode: "Higher-risk targeting",
  };
}

function getTighterHighRiskTargeting(defaults: SafeStepInputs): SafeStepInputs {
  return {
    ...defaults,
    targeting_mode: "Tighter high-risk targeting",
  };
}

function getLowerCostDelivery(defaults: SafeStepInputs): SafeStepInputs {
  return {
    ...defaults,
    intervention_cost_per_person: defaults.intervention_cost_per_person * 0.8,
  };
}

function getStrongerEffect(defaults: SafeStepInputs): SafeStepInputs {
  return {
    ...defaults,
    relative_risk_reduction: Math.min(
      1,
      defaults.relative_risk_reduction * 1.25,
    ),
  };
}

function getTargetedAndStronger(defaults: SafeStepInputs): SafeStepInputs {
  return {
    ...defaults,
    targeting_mode: "Higher-risk targeting",
    relative_risk_reduction: Math.min(
      1,
      defaults.relative_risk_reduction * 1.15,
    ),
  };
}

export const SCENARIO_MAP: Record<
  ScenarioName,
  (defaults: SafeStepInputs) => SafeStepInputs
> = {
  "Base case": getBaseCase,
  "Higher-risk targeting": getHigherRiskTargeting,
  "Tighter high-risk targeting": getTighterHighRiskTargeting,
  "Lower-cost delivery": getLowerCostDelivery,
  "Stronger effect": getStrongerEffect,
  "Targeted and stronger effect": getTargetedAndStronger,
};