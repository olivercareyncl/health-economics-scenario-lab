import type { SafeStepInputs } from "./types";

export const defaultInputs: SafeStepInputs = {
  eligible_population: 5000,
  uptake_rate: 0.5,
  adherence_rate: 0.75,
  participation_dropoff_rate: 0.06,

  target_population_multiplier: 1.0,
  target_uptake_multiplier: 1.0,
  target_fall_risk_multiplier: 1.0,

  annual_fall_risk: 0.24,
  admission_rate_after_fall: 0.2,
  average_length_of_stay: 7,

  intervention_cost_per_person: 250,
  relative_risk_reduction: 0.16,
  effect_decay_rate: 0.1,

  costing_method: "Admission cost only",
  cost_per_admission: 3500,
  cost_per_bed_day: 400,

  qaly_loss_per_serious_fall: 0.05,
  cost_effectiveness_threshold: 20000,
  time_horizon_years: 3,
  discount_rate: 0.035,
};