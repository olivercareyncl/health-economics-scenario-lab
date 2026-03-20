import type { TargetingMode } from "@/lib/pathshift/types";
import { TARGETING_MODE_OPTIONS } from "@/lib/pathshift/scenarios";

type PresetOption =
  | "Base case"
  | "Conservative case"
  | "Optimistic case"
  | "High-admission pressure"
  | "Lower-cost setting shift"
  | "Targeted high-utiliser redesign";

type PresetDefinition = {
  description: string;
  apply: () => Partial<Inputs>;
};

const PRESET_OPTIONS: readonly PresetOption[] = [
  "Base case",
  "Conservative case",
  "Optimistic case",
  "High-admission pressure",
  "Lower-cost setting shift",
  "Targeted high-utiliser redesign",
] as const;

const baseTargetingMode = TARGETING_MODE_OPTIONS[0] as TargetingMode;
const secondaryTargetingMode =
  (TARGETING_MODE_OPTIONS[1] ?? TARGETING_MODE_OPTIONS[0]) as TargetingMode;
const tertiaryTargetingMode =
  (TARGETING_MODE_OPTIONS[2] ??
    TARGETING_MODE_OPTIONS[1] ??
    TARGETING_MODE_OPTIONS[0]) as TargetingMode;

const PATHSHIFT_PRESETS: Record<PresetOption, PresetDefinition> = {
  "Base case": {
    description: "Restores the default pathway redesign starting point.",
    apply: () => ({
      ...DEFAULT_INPUTS,
    }),
  },

  "Conservative case": {
    description:
      "Lower reach, smaller shift, and more cautious redesign effects.",
    apply: () => ({
      targeting_mode: baseTargetingMode,
      implementation_reach_rate: 0.42,
      redesign_cost_per_patient: 260,
      proportion_shifted_to_lower_cost_setting: 0.18,
      reduction_in_admission_rate: 0.08,
      reduction_in_follow_up_contacts: 0.08,
      annual_effect_decay_rate: 0.14,
      participation_dropoff_rate: 0.12,
    }),
  },

  "Optimistic case": {
    description:
      "Higher reach, stronger pathway shift, and better persistence.",
    apply: () => ({
      targeting_mode: baseTargetingMode,
      implementation_reach_rate: 0.7,
      redesign_cost_per_patient: 170,
      proportion_shifted_to_lower_cost_setting: 0.4,
      reduction_in_admission_rate: 0.18,
      reduction_in_follow_up_contacts: 0.16,
      annual_effect_decay_rate: 0.05,
      participation_dropoff_rate: 0.05,
    }),
  },

  "High-admission pressure": {
    description:
      "Represents a pathway where admission risk is high and redesign value is concentrated.",
    apply: () => ({
      targeting_mode: secondaryTargetingMode,
      current_admission_rate: 0.28,
      implementation_reach_rate: 0.58,
      proportion_shifted_to_lower_cost_setting: 0.32,
      reduction_in_admission_rate: 0.18,
      reduction_in_follow_up_contacts: 0.1,
    }),
  },

  "Lower-cost setting shift": {
    description:
      "Tests whether value improves under a stronger shift into lower-cost settings.",
    apply: () => ({
      targeting_mode: baseTargetingMode,
      implementation_reach_rate: 0.62,
      redesign_cost_per_patient: 190,
      proportion_shifted_to_lower_cost_setting: 0.42,
      reduction_in_admission_rate: 0.12,
      reduction_in_follow_up_contacts: 0.12,
    }),
  },

  "Targeted high-utiliser redesign": {
    description:
      "Focuses redesign on the highest-opportunity, higher-utilisation subgroup.",
    apply: () => ({
      targeting_mode: tertiaryTargetingMode,
      implementation_reach_rate: 0.54,
      redesign_cost_per_patient: 210,
      proportion_shifted_to_lower_cost_setting: 0.36,
      reduction_in_admission_rate: 0.2,
      reduction_in_follow_up_contacts: 0.14,
    }),
  },
};