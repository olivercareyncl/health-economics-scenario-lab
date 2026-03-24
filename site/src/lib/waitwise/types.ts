export type CostingMethod =
  | "Escalation and admission savings only"
  | "Bed-day value only"
  | "Combined illustrative view";

export type MobileTab = "summary" | "assumptions" | "analysis";

export type AssumptionSectionKey =
  | "advanced-delivery"
  | "advanced-pathway"
  | "advanced-economics";

export type Inputs = {
  starting_waiting_list_size: number;
  monthly_inflow: number;
  baseline_monthly_throughput: number;
  average_wait_duration_months: number;

  intervention_reach_rate: number;
  target_population_multiplier: number;
  target_reach_multiplier: number;
  target_escalation_risk_multiplier: number;

  demand_reduction_effect: number;
  throughput_increase_effect: number;
  escalation_reduction_effect: number;

  intervention_cost_per_patient_reached: number;
  effect_decay_rate: number;
  participation_dropoff_rate: number;

  monthly_escalation_rate: number;
  admission_rate_after_escalation: number;
  average_length_of_stay: number;
  qaly_gain_per_escalation_avoided: number;

  cost_per_escalation: number;
  cost_per_admission: number;
  cost_per_bed_day: number;
  costing_method: CostingMethod;

  time_horizon_years: 1 | 3 | 5;
  discount_rate: number;
  cost_effectiveness_threshold: number;
};

export type AdjustedTargetingValues = {
  adjusted_waiting_list: number;
  adjusted_reach_rate: number;
  adjusted_escalation_rate: number;
};

export type YearlyResultRow = {
  year: number;
  waiting_list_start: number;
  waiting_list_end: number;
  waiting_list_reduction: number;
  escalations_avoided: number;
  admissions_avoided: number;
  bed_days_avoided: number;
  patients_reached: number;
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
  waiting_list_start_year_1: number;
  waiting_list_end_final: number;
  waiting_list_reduction_total: number;
  escalations_avoided_total: number;
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
  break_even_effect_required: number;
  break_even_cost_per_patient: number;
  break_even_horizon: string;
};

export type UncertaintyCase = "Low" | "Base" | "High";

export type UncertaintyRow = {
  case: UncertaintyCase;
  waiting_list_reduction_total: number;
  discounted_net_cost_total: number;
  discounted_cost_per_qaly: number;
  dominant_domain: string;
  decision_status: string;
};

export type Interpretation = {
  what_model_suggests: string;
  what_drives_result: string;
  what_looks_fragile: string;
  what_to_validate_next: string;
  limitations: string;
};

export type SensitivityRow = {
  variable: keyof Inputs;
  label: string;
  base_input: number;
  low_input: number;
  high_input: number;
  base_outcome: number;
  low_outcome: number;
  high_outcome: number;
  low_delta: number;
  high_delta: number;
  swing: number;
};

export type ParameterSensitivityRow = {
  parameter_key: keyof Inputs;
  parameter_label: string;
  base_value: number;
  low_value: number;
  high_value: number;
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

export type StructuredRecommendation = {
  main_dependency: string;
  main_fragility: string;
  best_next_step: string;
};

export type DecisionReadiness = {
  validate_next: string[];
  readiness_note: string;
};

export type AssumptionMeta = {
  label: string;
  unit: string;
  formatter: (value: number | string) => string;
  description: string;
  source_type: string;
  confidence: "High confidence" | "Medium confidence" | "Low confidence";
};

export type AssumptionConfidenceSummary = {
  "High confidence": number;
  "Medium confidence": number;
  "Low confidence": number;
  summary_text: string;
};