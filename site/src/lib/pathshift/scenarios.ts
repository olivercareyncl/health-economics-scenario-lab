import type { ComparatorOption, CostingMethod, Inputs, TargetingMode } from "@/lib/pathshift/types";

export const TARGETING_MODE_OPTIONS: TargetingMode[] = [
  "Broad pathway redesign",
  "Higher-risk targeting",
  "High-utiliser targeting",
];

export const COSTING_METHOD_OPTIONS: CostingMethod[] = [
  "Admission and follow-up savings only",
  "Bed-day value only",
  "Combined illustrative view",
];

export const COMPARATOR_OPTIONS: ComparatorOption[] = [
  "Follow-up reduction focus",
  "Admission reduction focus",
  "High-utiliser targeting",
  "Lower-cost redesign",
  "Targeted and stronger redesign",
];

export const TARGETING_MODE_MAP: Record<
  TargetingMode,
  {
    population_multiplier: number;
    reach_multiplier: number;
    risk_multiplier: number;
  }
> = {
  "Broad pathway redesign": {
    population_multiplier: 1.0,
    reach_multiplier: 1.0,
    risk_multiplier: 1.0,
  },
  "Higher-risk targeting": {
    population_multiplier: 0.65,
    reach_multiplier: 1.05,
    risk_multiplier: 1.3,
  },
  "High-utiliser targeting": {
    population_multiplier: 0.4,
    reach_multiplier: 1.1,
    risk_multiplier: 1.5,
  },
};

export const COSTING_METHOD_MAP: Record<
  CostingMethod,
  { mode: "admission_followup" | "bed_day" | "combined" }
> = {
  "Admission and follow-up savings only": { mode: "admission_followup" },
  "Bed-day value only": { mode: "bed_day" },
  "Combined illustrative view": { mode: "combined" },
};

export function getBaseCase(defaults: Inputs): Partial<Inputs> {
  return { ...defaults };
}

export function getFollowUpReductionFocus(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    reduction_in_follow_up_contacts: defaults.reduction_in_follow_up_contacts * 1.4,
    reduction_in_admission_rate: defaults.reduction_in_admission_rate * 0.8,
  };
}

export function getAdmissionReductionFocus(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    reduction_in_admission_rate: defaults.reduction_in_admission_rate * 1.4,
    reduction_in_follow_up_contacts: defaults.reduction_in_follow_up_contacts * 0.8,
  };
}

export function getHighUtiliserTargeting(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "High-utiliser targeting",
  };
}

export function getLowerCostRedesign(defaults: Inputs): Partial<Inputs> {
  return {
    ...defaults,
    redesign_cost_per_patient: defaults.redesign_cost_per_patient * 0.8,
  };
}

export function getTargetedAndStrongerRedesign(
  defaults: Inputs,
): Partial<Inputs> {
  return {
    ...defaults,
    targeting_mode: "Higher-risk targeting",
    proportion_shifted_to_lower_cost_setting:
      defaults.proportion_shifted_to_lower_cost_setting * 1.15,
    reduction_in_admission_rate: defaults.reduction_in_admission_rate * 1.15,
    reduction_in_follow_up_contacts: defaults.reduction_in_follow_up_contacts * 1.15,
    reduction_in_length_of_stay: defaults.reduction_in_length_of_stay * 1.15,
  };
}

export const SCENARIO_MAP: Record<string, (defaults: Inputs) => Partial<Inputs>> = {
  "Base case": getBaseCase,
  "Follow-up reduction focus": getFollowUpReductionFocus,
  "Admission reduction focus": getAdmissionReductionFocus,
  "High-utiliser targeting": getHighUtiliserTargeting,
  "Lower-cost redesign": getLowerCostRedesign,
  "Targeted and stronger redesign": getTargetedAndStrongerRedesign,
};