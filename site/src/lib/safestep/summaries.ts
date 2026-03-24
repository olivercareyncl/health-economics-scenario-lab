export type CostingMethod =
  | "Admission cost only"
  | "Bed-day value only"
  | "Combined illustrative view";

export type MobileTab = "summary" | "assumptions" | "analysis";

export type AssumptionSectionKey =
  | "advanced-delivery"
  | "advanced-pathway"
  | "advanced-economics";

export type ConfidenceLevel =
  | "High confidence"
  | "Medium confidence"
  | "Low confidence";

export type AssumptionFormatter =
  | "number"
  | "percent"
  | "currency"
  | "text"
  | "decimal1"
  | "decimal2"
  | "integer";

export type AssumptionKey =
  | "eligible_population"
  | "uptake_rate"
  | "adherence_rate"
  | "participation_dropoff_rate"
  | "target_population_multiplier"
  | "target_uptake_multiplier"
  | "target_fall_risk_multiplier"
  | "annual_fall_risk"
  | "admission_rate_after_fall"
  | "average_length_of_stay"
  | "intervention_cost_per_person"
  | "relative_risk_reduction"
  | "effect_decay_rate"
  | "costing_method"
  | "cost_per_admission"
  | "cost_per_bed_day"
  | "qaly_loss_per_serious_fall"
  | "cost_effectiveness_threshold"
  | "time_horizon_years"
  | "discount_rate";

export interface SafeStepInputs {
  eligible_population: number;
  uptake_rate: number;
  adherence_rate: number;
  participation_dropoff_rate: number;

  target_population_multiplier: number;
  target_uptake_multiplier: number;
  target_fall_risk_multiplier: number;

  annual_fall_risk: number;
  admission_rate_after_fall: number;
  average_length_of_stay: number;

  intervention_cost_per_person: number;
  relative_risk_reduction: number;
  effect_decay_rate: number;

  costing_method: CostingMethod;
  cost_per_admission: number;
  cost_per_bed_day: number;

  qaly_loss_per_serious_fall: number;
  cost_effectiveness_threshold: number;
  time_horizon_years: number;
  discount_rate: number;
}

export interface AssumptionMetaItem {
  label: string;
  unit: string;
  formatter: AssumptionFormatter;
  description: string;
  sourceType: string;
  confidence: ConfidenceLevel;
}

export interface TargetingAdjustmentsResult {
  adjusted_eligible_population: number;
  adjusted_annual_fall_risk: number;
  adjusted_uptake_rate: number;
}

export interface CostingMethodConfig {
  mode: "admission" | "bed_day" | "combined";
}

export interface YearlyResultRow {
  year: number;
  treated_population: number;
  annual_effectiveness: number;
  expected_falls_baseline: number;
  falls_after_intervention: number;
  falls_avoided: number;
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
}

export interface ModelResult {
  treated_population_year_1: number;
  adjusted_eligible_population: number;
  adjusted_annual_fall_risk: number;
  adjusted_uptake_rate: number;
  falls_avoided_total: number;
  admissions_avoided_total: number;
  bed_days_avoided_total: number;
  programme_cost_total: number;
  gross_savings_total: number;
  net_cost_total: number;
  discounted_programme_cost_total: number;
  discounted_gross_savings_total: number;
  discounted_net_cost_total: number;
  discounted_qalys_total: number;
  discounted_cost_per_qaly: number;
  roi: number;
  yearly_results: YearlyResultRow[];
  break_even_effectiveness: number;
  break_even_cost_per_participant: number;
  break_even_horizon: string;
}

export interface UncertaintyRow {
  case: "Low" | "Base" | "High";
  falls_avoided_total: number;
  discounted_net_cost_total: number;
  discounted_cost_per_qaly: number;
  dominant_domain: string;
  decision_status: string;
}

export interface ParameterSensitivityRow {
  parameter_key: keyof SafeStepInputs;
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
}

export interface SensitivitySummary {
  rows: ParameterSensitivityRow[];
  top_drivers: ParameterSensitivityRow[];
  primary_driver: ParameterSensitivityRow | null;
}

export interface StructuredRecommendation {
  main_dependency: string;
  main_fragility: string;
  best_next_step: string;
}

export interface DecisionReadiness {
  validate_next: string[];
  readiness_note: string;
}

export interface Interpretation {
  what_model_suggests: string;
  where_value_is_coming_from: string;
  what_looks_fragile: string;
  what_to_validate_next: string;
  limitations: string;
}