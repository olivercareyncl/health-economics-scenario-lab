import type { CostingMethod } from "@/lib/stableheart/types";

export const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Event and admission savings only",
  "Bed-day value only",
  "Combined illustrative view",
];

export const COSTING_METHOD_MAP: Record<
  CostingMethod,
  { mode: "event_admission" | "bed_day" | "combined" }
> = {
  "Event and admission savings only": { mode: "event_admission" },
  "Bed-day value only": { mode: "bed_day" },
  "Combined illustrative view": { mode: "combined" },
};