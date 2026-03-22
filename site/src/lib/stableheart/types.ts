export type TargetingMode =
  | "Secondary prevention focus"
  | "High-risk targeting"
  | "Broad cardiovascular risk cohort";

export type CostingMethod =
  | "Event and admission savings only"
  | "Bed-day value only"
  | "Combined illustrative view";

export type ComparatorOption =
  | "Lower-cost delivery"
  | "Stronger risk reduction"
  | "High-risk targeting"
  | "Secondary prevention focus"
  | "Targeted high-impact intervention";

export type MobileTab = "summary" | "assumptions" | "analysis";

export type AssumptionSectionKey =
  | "advanced-baseline"
  | "advanced-costs"
  | "advanced-outcomes";

export type Inputs = {
  eligible_population: number;
  baseline_recurrent_event_rate: number;
  admission_probability_per_event: number;
  average_length_of_stay: number;
  intervention_reach_rate: number;
  sustained_engagement_rate: number;
  annual_participation_dropoff_rate: number;
  risk_reduction_in_recurrent_events: number;
  annual_effect_decay_rate: number;
  intervention_cost_per_patient_reached: number;
  cost_per_cardiovascular_event: number;
  cost_per_admission: number;
  cost_per_bed_day: number;
  costing_method: CostingMethod;
  qaly_gain_per_event_avoided: number;
  targeting_mode: TargetingMode;
  time_horizon_years: 1 | 3 | 5;
  discount_rate: number;
  cost_effectiveness_threshold: number;
};

export type YearlyResultRow = {
  year: number;
  patients_reached: number;
  effective_patients: number;
  baseline_events: number;
  events_avoided: number;
  admissions_avoided: number;
  bed_days_avoided: number;
  programme_cost: number;
  gross_savings: number;
  net_cost: number;
  qalys_gained: number;
  discount_factor: number;
  discounted_programme_cost: number;
  discounted_gross_savings: number;
  discounted_net_cost: number;
  discounted_qalys: number;
  cumulative_programme_cost: number;
  cumulative_gross_savings: number;
  cumulative_net_cost: number;
};

export type ModelResults = {
  patients_reached_total: number;
  events_avoided_total: number;
  admissions_avoided_total: number;
  bed_days_avoided_total: number;
  programme_cost_total: number;
  gross_savings_total: number;
  discounted_programme_cost_total: number;
  discounted_gross_savings_total: number;
  discounted_net_cost_total: number;
  discounted_qalys_total: number;
  discounted_cost_per_qaly: number;
  roi: number;
  yearly_results: YearlyResultRow[];
  break_even_risk_reduction_required: number;
  break_even_cost_per_patient: number;
  break_even_horizon: string;
  break_even_baseline_event_rate_required: number;
  break_even_qaly_gain_required: number;
};

export type UncertaintyRow = {
  case: "Low" | "Base" | "High";
  events_avoided_total: number;
  discounted_net_cost_total: number;
  discounted_cost_per_qaly: number;
  dominant_domain: string;
  decision_status: string;
};

export type ParameterSensitivityRow = {
  parameter_key: keyof Inputs;
  parameter_label: string;
  low_value_label: string;
  high_value_label: string;
  low_icer: number;
  base_icer: number;
  high_icer: number;
  low_net_cost: number;
  base_net_cost: number;
  high_net_cost: number;
  max_abs_icer_change: number;
};

export type SensitivitySummary = {
  rows: ParameterSensitivityRow[];
  top_drivers: ParameterSensitivityRow[];
  primary_driver: ParameterSensitivityRow | null;
};

export type OneWaySensitivityRow = {
  parameter: string;
  lowCaseValue?: number | string;
  highCaseValue?: number | string;
  lowCaseResult?: number;
  highCaseResult?: number;
  swing?: number;
  note?: string;
  rank?: number;
};

export type AssumptionMeta = {
  label: string;
  unit: string;
  formatter: (value: string | number) => string;
  description: string;
  source_type: string;
  confidence_level: "High" | "Medium" | "Low";
};