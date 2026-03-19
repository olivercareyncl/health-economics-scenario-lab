import type {
  CostingMethod,
  Inputs,
  TargetingAdjustment,
  TargetingMode,
} from "@/lib/waitwise/types";

export const DEFAULT_INPUTS: Inputs = {
  starting_waiting_list_size: 8000,
  monthly_inflow: 900,
  baseline_monthly_throughput: 800,
  average_wait_duration_months: 5.0,
  intervention_reach_rate: 0.4,
  demand_reduction_effect: 0.08,
  throughput_increase_effect: 0.1,
  escalation_reduction_effect: 0.12,
  intervention_cost_per_patient_reached: 180,
  effect_decay_rate: 0.1,
  participation_dropoff_rate: 0.05,
  monthly_escalation_rate: 0.03,
  admission_rate_after_escalation: 0.25,
  average_length_of_stay: 4.0,
  qaly_gain_per_escalation_avoided: 0.08,
  cost_per_escalation: 700,
  cost_per_admission: 3500,
  cost_per_bed_day: 400,
  costing_method: "Escalation and admission savings only",
  targeting_mode: "Broad waiting list",
  time_horizon_years: 3,
  discount_rate: 0.035,
  cost_effectiveness_threshold: 20000,
};

export const TARGETING_MODE_OPTIONS: readonly TargetingMode[] = [
  "Broad waiting list",
  "Higher-risk targeting",
  "Long-wait targeting",
] as const;

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Escalation and admission savings only",
  "Bed-day value only",
  "Combined illustrative view",
] as const;

export const TARGETING_MODE_MAP: Record<TargetingMode, TargetingAdjustment> = {
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

export const DESKTOP_RESULT_BADGE_STYLES = {
  saving: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  effective: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  threshold: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
} as const;