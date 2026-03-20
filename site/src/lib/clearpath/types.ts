export type TargetingMode =
  | "Broad population"
  | "Higher-risk targeting"
  | "Tighter high-risk targeting";

export type CostingMethod =
  | "Treatment cost difference only"
  | "Emergency/admission savings only"
  | "Combined illustrative view";

export type ComparatorOption =
  | "Higher-risk targeting"
  | "Tighter high-risk targeting"
  | "Modest shift"
  | "Stronger shift"
  | "Lower-cost delivery"
  | "Targeted and stronger shift";

export type MobileTab = "summary" | "assumptions" | "analysis";

export type AssumptionSectionKey =
  | "advanced-pathway"
  | "advanced-costs"
  | "advanced-outcomes";

export type Inputs = {
  annual_incident_cases: number;
  current_late_diagnosis_rate: number;
  achievable_reduction_in_late_diagnosis: number;
  intervention_reach_rate: number;
  time_horizon_years: 1 | 3 | 5;
  discount_rate: number;
  cost_effectiveness_threshold: number;
  late_emergency_presentation_rate: number;
  early_emergency_presentation_rate: number;
  admissions_per_emergency_presentation: number;
  average_length_of_stay: number;
  intervention_cost_per_case_reached: number;
  treatment_cost_early: number;
  treatment_cost_late: number;
  cost_per_emergency_admission: number;
  cost_per_bed_day: number;
  costing_method: CostingMethod;
  qaly_gain_per_case_shifted: number;
  effect_decay_rate: number;
  participation_dropoff_rate: number;
  targeting_mode: TargetingMode;
};

export type TargetingAdjustment = {
  population_multiplier: number;
  late_rate_multiplier: number;
  reach_multiplier: number;
  shift_multiplier: number;
};

export type AdjustedTargetingValues = {
  adjusted_incident_cases: number;
  adjusted_late_diagnosis_rate: number;
  adjusted_reach_rate: number;
  adjusted_reduction: number;
};

export type YearlyResultRow = {
  year: number;
  cases_reached: number;
  cases_shifted_earlier: number;
  emergency_presentations_avoided: number;
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
  cases_reached_year_1: number;
  adjusted_incident_cases: number;
  adjusted_late_diagnosis_rate: number;
  adjusted_reach_rate: number;
  adjusted_reduction: number;
  cases_shifted_total: number;
  emergency_presentations_avoided_total: number;
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
  break_even_reduction_in_late_diagnosis: number;
  break_even_cost_per_case: number;
  break_even_horizon: string;
};

export type UncertaintyCase = "Low" | "Base" | "High";

export type UncertaintyRow = {
  case: UncertaintyCase;
  cases_shifted_total: number;
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

export type ScenarioComparisonRow = {
  scenario: string;
  targeting: string;
  cases_shifted_earlier: number;
  emergency_presentations_avoided: number;
  programme_cost: number;
  discounted_net_cost: number;
  discounted_cost_per_qaly: number;
  decision_status: string;
};

export type ComparatorDeltaRow = {
  label: string;
  delta: number;
  isCurrency: boolean;
};

export type SensitivityRow = {
  variable: string;
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