export type TargetingMode =
  | "Broad pathway redesign"
  | "Higher-risk targeting"
  | "High-utiliser targeting";

export type CostingMethod =
  | "Admission and follow-up savings only"
  | "Bed-day value only"
  | "Combined illustrative view";

export type ComparatorOption =
  | "Follow-up reduction focus"
  | "Admission reduction focus"
  | "High-utiliser targeting"
  | "Lower-cost redesign"
  | "Targeted and stronger redesign";

export type MobileTab = "summary" | "assumptions" | "analysis";

export type AssumptionSectionKey =
  | "advanced-pathway"
  | "advanced-costs"
  | "advanced-outcomes";

export type Inputs = {
  annual_cohort_size: number;
  current_acute_managed_rate: number;
  current_admission_rate: number;
  current_follow_up_contacts_per_patient: number;
  current_average_length_of_stay: number;
  proportion_shifted_to_lower_cost_setting: number;
  reduction_in_admission_rate: number;
  reduction_in_follow_up_contacts: number;
  reduction_in_length_of_stay: number;
  implementation_reach_rate: number;
  redesign_cost_per_patient: number;
  effect_decay_rate: number;
  participation_dropoff_rate: number;
  cost_per_acute_managed_patient: number;
  cost_per_community_managed_patient: number;
  cost_per_follow_up_contact: number;
  cost_per_admission: number;
  cost_per_bed_day: number;
  costing_method: CostingMethod;
  qaly_gain_per_patient_improved: number;
  targeting_mode: TargetingMode;
  time_horizon_years: 1 | 3 | 5;
  discount_rate: number;
  cost_effectiveness_threshold: number;
};

export type TargetingAdjustment = {
  population_multiplier: number;
  reach_multiplier: number;
  risk_multiplier: number;
};

export type AdjustedTargetingValues = {
  adjusted_cohort: number;
  adjusted_reach_rate: number;
  adjusted_admission_rate: number;
};

export type YearlyResultRow = {
  year: number;
  patients_reached: number;
  patients_shifted_in_pathway: number;
  admissions_avoided: number;
  follow_ups_avoided: number;
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
  patients_shifted_total: number;
  admissions_avoided_total: number;
  follow_ups_avoided_total: number;
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
  patients_shifted_total: number;
  discounted_net_cost_total: number;
  discounted_cost_per_qaly: number;
  dominant_domain: string;
  decision_status: string;
};

export type ScenarioComparisonRow = {
  scenario: string;
  targeting: string;
  patients_shifted_in_pathway: number;
  admissions_avoided: number;
  programme_cost: number;
  discounted_net_cost: number;
  discounted_cost_per_qaly: number;
  decision_status: string;
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

export type ParameterSensitivityRow = {
  parameter_key: keyof Inputs;
  parameter_label: string;
  base_value: number;
  low_value: number;
  high_value: number;
  low_value_label: string;
  high_value_label: string;
  base_icer: number;
  low_icer: number;
  high_icer: number;
  low_delta: number;
  high_delta: number;
  max_abs_icer_change: number;
};

export type SensitivitySummary = {
  rows: ParameterSensitivityRow[];
  primary_driver: ParameterSensitivityRow | null;
  top_drivers: ParameterSensitivityRow[];
};

export type ComparatorDeltaRow = {
  label: string;
  delta: number;
  isCurrency: boolean;
};

export type Interpretation = {
  what_model_suggests: string;
  what_drives_result: string;
  what_looks_fragile: string;
  what_to_validate_next: string;
  limitations: string;
};

export type AssumptionMeta = {
  label: string;
  unit: string;
  formatter: (value: string | number) => string;
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