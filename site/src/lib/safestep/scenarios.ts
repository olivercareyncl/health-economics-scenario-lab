import type {
  CostingMethod,
  CostingMethodConfig,
} from "./types";

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Admission cost only",
  "Bed-day value only",
  "Combined illustrative view",
] as const;

export const COSTING_METHOD_MAP: Record<CostingMethod, CostingMethodConfig> = {
  "Admission cost only": {
    mode: "admission",
  },
  "Bed-day value only": {
    mode: "bed_day",
  },
  "Combined illustrative view": {
    mode: "combined",
  },
};