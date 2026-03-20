import type {
  ComparatorOption,
  CostingMethod,
  Inputs,
  TargetingMode,
} from "@/lib/frailtyforward/types";

export const TARGETING_MODE_OPTIONS: readonly TargetingMode[] = [
  "Broad frailty cohort",
  "Higher-risk targeting",
  "Frequent-admitter targeting",
];

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Admission and crisis savings only",
  "Bed-day value only",
  "Combined illustrative view",
];

export const COMPARATOR_OPTIONS: readonly ComparatorOption[] = [
  "Crisis prevention focus",
  "Admission reduction focus",
  "Frequent-admitter targeting",
  "Lower-cost support model",
  "Targeted and stronger support",
];

export const TARGETING_MODE_MAP: Record<
  TargetingMode,
  {
    population_multiplier: number;
    reach_multiplier: number;
    risk_multiplier: number;
  }
> = {
  "Broad frailty cohort": {
    population_multiplier: 1.0,
    reach_multiplier: 1.0,
    risk_multiplier: 1.0,
  },
  "Higher-risk targeting": {
    population_multiplier: 0.65,
    reach_multiplier: 1.05,
    risk_multiplier: 1.3,
  },
  "Frequent-admitter targeting": {
    population_multiplier: 0.4,
    reach_multiplier: 1.1,
    risk_multiplier: 1.55,
  },
};

export const COSTING_METHOD_MAP: Record<
  CostingMethod,
  { mode: "admission_crisis" | "bed_day" | "combined" }
> = {
  "Admission and crisis savings only": { mode: "admission_crisis" },
  "Bed-day value only": { mode: "bed_day" },
  "Combined illustrative view": { mode: "combined" },
};

export const SCENARIO_MAP: Record<ComparatorOption | "Base case", (defaults: Inputs) => Partial<Inputs>> = {
  "Base case": (defaults) => ({ ...defaults }),
  "Crisis prevention focus": (defaults) => ({
    reduction_in_crisis_event_rate: defaults.reduction_in_crisis_event_rate * 1.4,
    reduction_in_admission_rate: defaults.reduction_in_admission_rate * 0.9,
    reduction_in_length_of_stay: defaults.reduction_in_length_of_stay * 0.9,
  }),
  "Admission reduction focus": (defaults) => ({
    reduction_in_admission_rate: defaults.reduction_in_admission_rate * 1.4,
    reduction_in_crisis_event_rate: defaults.reduction_in_crisis_event_rate * 0.9,
    reduction_in_length_of_stay: defaults.reduction_in_length_of_stay * 1.05,
  }),
  "Frequent-admitter targeting": () => ({
    targeting_mode: "Frequent-admitter targeting",
  }),
  "Lower-cost support model": (defaults) => ({
    support_cost_per_patient: defaults.support_cost_per_patient * 0.8,
  }),
  "Targeted and stronger support": (defaults) => ({
    targeting_mode: "Higher-risk targeting",
    reduction_in_crisis_event_rate: defaults.reduction_in_crisis_event_rate * 1.15,
    reduction_in_admission_rate: defaults.reduction_in_admission_rate * 1.15,
    reduction_in_length_of_stay: defaults.reduction_in_length_of_stay * 1.15,
    implementation_reach_rate: Math.min(defaults.implementation_reach_rate * 1.05, 1),
  }),
};