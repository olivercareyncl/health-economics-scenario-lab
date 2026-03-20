import type { Inputs } from "@/lib/stableheart/types";

export const DEFAULT_INPUTS: Inputs = {
  eligible_population: 4000,
  baseline_recurrent_event_rate: 0.18,
  admission_probability_per_event: 0.85,
  average_length_of_stay: 5.5,
  intervention_reach_rate: 0.65,
  sustained_engagement_rate: 0.8,
  annual_participation_dropoff_rate: 0.06,
  risk_reduction_in_recurrent_events: 0.18,
  annual_effect_decay_rate: 0.08,
  intervention_cost_per_patient_reached: 260,
  cost_per_cardiovascular_event: 3200,
  cost_per_admission: 5400,
  cost_per_bed_day: 420,
  costing_method: "Event and admission savings only",
  qaly_gain_per_event_avoided: 0.1,
  targeting_mode: "Secondary prevention focus",
  time_horizon_years: 3,
  discount_rate: 0.035,
  cost_effectiveness_threshold: 20000,
};