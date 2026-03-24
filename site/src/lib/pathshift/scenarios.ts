import type { CostingMethod } from "@/lib/pathshift/types";

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Admission and follow-up savings only",
  "Bed-day value only",
  "Combined illustrative view",
] as const;

export type CostingMethodConfig = {
  mode: "admission_followup" | "bed_day" | "combined";
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
