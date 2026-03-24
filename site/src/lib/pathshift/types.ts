export type StructuredRecommendation = {
  main_dependency: string;
  main_fragility: string;
  best_next_step: string;
};

export type DecisionReadiness = {
  validate_next: string[];
  readiness_note: string;
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