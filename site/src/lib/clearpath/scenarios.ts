import type { CostingMethod } from "@/lib/clearpath/types";

export const COSTING_METHOD_OPTIONS: CostingMethod[] = [
  "Treatment cost difference only",
  "Emergency/admission savings only",
  "Combined illustrative view",
];

export type CostingMethodConfig = {
  mode: "treatment" | "acute" | "combined";
};

export const COSTING_METHOD_MAP: Record<CostingMethod, CostingMethodConfig> = {
  "Treatment cost difference only": { mode: "treatment" },
  "Emergency/admission savings only": { mode: "acute" },
  "Combined illustrative view": { mode: "combined" },
};