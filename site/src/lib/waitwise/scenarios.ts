import type { CostingMethod, TargetingMode } from "@/lib/waitwise/types";

export const TARGETING_MODE_OPTIONS: readonly TargetingMode[] = [
  "Broad waiting list",
  "Higher-risk targeting",
  "Long-wait targeting",
] as const;

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Escalation and admission savings only",
  "Bed-day value only",
  "Combined illustrative view",
] as const;

export type TargetingModeAdjustment = {
  population_multiplier: number;
  reach_multiplier: number;
  risk_multiplier: number;
};

export type CostingMethodConfig = {
  mode: "acute" | "bed_day" | "combined";
};

export const TARGETING_MODE_MAP: Record<TargetingMode, TargetingModeAdjustment> = {
  "Broad waiting list": {
    population_multiplier: 1.0,
    reach_multiplier: 1.0,
    risk_multiplier: 1.0,
  },
  "Higher-risk targeting": {
    population_multiplier: 0.6,
    reach_multiplier: 1.05,
    risk_multiplier: 1.3,
  },
  "Long-wait targeting": {
    population_multiplier: 0.45,
    reach_multiplier: 1.1,
    risk_multiplier: 1.45,
  },
};

export const COSTING_METHOD_MAP: Record<CostingMethod, CostingMethodConfig> = {
  "Escalation and admission savings only": { mode: "acute" },
  "Bed-day value only": { mode: "bed_day" },
  "Combined illustrative view": { mode: "combined" },
};