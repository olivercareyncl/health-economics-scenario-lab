import type {
  ComparatorOption,
  CostingMethod,
  Inputs,
  TargetingMode,
} from "@/lib/stableheart/types";

export const TARGETING_MODE_OPTIONS: readonly TargetingMode[] = [
  "Secondary prevention focus",
  "High-risk targeting",
  "Broad cardiovascular risk cohort",
];

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Event and admission savings only",
  "Bed-day value only",
  "Combined illustrative view",
];

export const COMPARATOR_OPTIONS: readonly ComparatorOption[] = [
  "Lower-cost delivery",
  "Stronger risk reduction",
  "High-risk targeting",
  "Secondary prevention focus",
  "Targeted high-impact intervention",
];

export const TARGETING_MODE_MAP: Record<
  TargetingMode,
  {
    population_multiplier: number;
    reach_multiplier: number;
    risk_multiplier: number;
  }
> = {
  "Broad cardiovascular risk cohort": {
    population_multiplier: 1,
    reach_multiplier: 1,
    risk_multiplier: 0.75,
  },
  "High-risk targeting": {
    population_multiplier: 0.7,
    reach_multiplier: 1.05,
    risk_multiplier: 1.15,
  },
  "Secondary prevention focus": {
    population_multiplier: 0.55,
    reach_multiplier: 1.1,
    risk_multiplier: 1.35,
  },
};

export const COSTING_METHOD_MAP: Record<
  CostingMethod,
  { mode: "event_admission" | "bed_day" | "combined" }
> = {
  "Event and admission savings only": { mode: "event_admission" },
  "Bed-day value only": { mode: "bed_day" },
  "Combined illustrative view": { mode: "combined" },
};

function getBaseCase(defaults: Inputs): Partial<Inputs> {
  return { ...defaults, targeting_mode: "Secondary prevention focus" };
}

function getLowerCostDelivery(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    intervention_cost_per_patient_reached:
      defaults.intervention_cost_per_patient_reached * 0.8,
    targeting_mode: "Secondary prevention focus",
  };
}

function getStrongerRiskReduction(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    risk_reduction_in_recurrent_events:
      defaults.risk_reduction_in_recurrent_events * 1.3,
    targeting_mode: "Secondary prevention focus",
  };
}

function getHighRiskTargeting(defaults: Inputs): Partial<Inputs> {
  return { ...defaults, targeting_mode: "High-risk targeting" };
}

function getSecondaryPreventionFocus(defaults: Inputs): Partial<Inputs> {
  return { ...defaults, targeting_mode: "Secondary prevention focus" };
}

function getTargetedHighImpactIntervention(
  defaults: Inputs,
): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Secondary prevention focus",
    risk_reduction_in_recurrent_events:
      defaults.risk_reduction_in_recurrent_events * 1.2,
    sustained_engagement_rate: Math.min(
      defaults.sustained_engagement_rate * 1.08,
      1,
    ),
    intervention_reach_rate: Math.min(
      defaults.intervention_reach_rate * 1.05,
      1,
    ),
  };
}

export const SCENARIO_MAP: Record<
  string,
  (defaults: Inputs) => Partial<Inputs>
> = {
  "Base case": getBaseCase,
  "Lower-cost delivery": getLowerCostDelivery,
  "Stronger risk reduction": getStrongerRiskReduction,
  "High-risk targeting": getHighRiskTargeting,
  "Secondary prevention focus": getSecondaryPreventionFocus,
  "Targeted high-impact intervention": getTargetedHighImpactIntervention,
};