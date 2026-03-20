export type TargetingMode =
  | "Broad frailty cohort"
  | "Higher-risk targeting"
  | "Frequent-admitter targeting";

export type CostingMethod =
  | "Admission and crisis savings only"
  | "Bed-day value only"
  | "Combined illustrative view";

export type ComparatorOption =
  | "Crisis prevention focus"
  | "Admission reduction focus"
  | "Frequent-admitter targeting"
  | "Lower-cost support model"
  | "Targeted and stronger support";

export type MobileTab = "summary" | "assumptions" | "analysis";

export type AssumptionSectionKey =
  | "advanced-baseline"
  | "advanced-costs"
  | "advanced-outcomes";

export type Inputs = {
  annual_frailty_cohort_size: number;
  baseline_crisis_event_rate: number;
  baseline_non_elective_admission_rate: number;
  current_average_length_of_stay: number;
  implementation_reach_rate: number;
  reduction_in_crisis_event_rate: number;
  reduction_in_admission_rate: number;
  reduction_in_length_of_stay: number;
  support_cost_per_patient: number;
  effect_decay_rate: number;
  participation_dropoff_rate: number;
  cost_per_crisis_event: number;
  cost_per_admission: number;
  cost_per_bed_day: number;
  costing_method: CostingMethod;
  qaly_gain_per_patient_stabilised: number;
  targeting_mode: TargetingMode;
  time_horizon_years: 1 | 3 | 5;
  discount_rate: number;
  cost_effectiveness_threshold: number;
};

export type YearlyResultRow = {
  year: number;
  patients_reached: number;
  patients_stabilised: number;
  crisis_events_avoided: number;
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
  patients_stabilised_total: number;
  crisis_events_avoided_total: number;
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

export type UncertaintyRow = {
  case: "Low" | "Base" | "High";
  patients_stabilised_total: number;
  discounted_net_cost_total: number;
  discounted_cost_per_qaly: number;
  dominant_domain: string;
  decision_status: string;
};

export type AssumptionMeta = {
  label: string;
  unit: string;
  formatter: (value: string | number) => string;
  description: string;
  source_type: string;
  confidence: "High confidence" | "Medium confidence" | "Low confidence";
};
