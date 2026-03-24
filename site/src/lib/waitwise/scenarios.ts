import type { CostingMethod } from "@/lib/waitwise/types";

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Escalation and admission savings only",
  "Bed-day value only",
  "Combined illustrative view",
] as const;

export type CostingMethodConfig = {
  mode: "acute" | "bed_day" | "combined";
};

export const COSTING_METHOD_MAP: Record<CostingMethod, CostingMethodConfig> = {
  "Escalation and admission savings only": { mode: "acute" },
  "Bed-day value only": { mode: "bed_day" },
  "Combined illustrative view": { mode: "combined" },
};