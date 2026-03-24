import type { CostingMethod, TargetingMode } from "@/lib/pathshift/types";

export const TARGETING_MODE_OPTIONS: readonly TargetingMode[] = [
  "Broad pathway redesign",
  "Higher-risk targeting",
  "High-utiliser targeting",
] as const;

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Admission and follow-up savings only",
  "Bed-day value only",
  "Combined illustrative view",
] as const;

export type TargetingModeAdjustment = {
  population_multiplier: number;
  reach_multiplier: number;
  risk_multiplier: number;
};

export type CostingMethodConfig = {
  mode: "admission_followup" | "bed_day" | "combined";
};

export const TARGETING_MODE_MAP: Record<
  TargetingMode,
  TargetingModeAdjustment
> = {
  "Broad pathway redesign": {
    population_multiplier: 1.0,
    reach_multiplier: 1.0,
    risk_multiplier: 1.0,
  },
  "Higher-risk targeting": {
    population_multiplier: 0.65,
    reach_multiplier: 1.05,
    risk_multiplier: 1.3,
  },
  "High-utiliser targeting": {
    population_multiplier: 0.4,
    reach_multiplier: 1.1,
    risk_multiplier: 1.5,
  },
};

export const COSTING_METHOD_MAP: Record<
  CostingMethod,
  CostingMethodConfig
> = {
  "Admission and follow-up savings only": {
    mode: "admission_followup",
  },
  "Bed-day value only": {
    mode: "bed_day",
  },
  "Combined illustrative view": {
    mode: "combined",
  },
};