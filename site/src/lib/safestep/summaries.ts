import type {
  ModelResult,
  SafeStepInputs,
  SensitivitySummary,
  UncertaintyRow,
} from "./types";

type DecisionStatus =
  | "Appears cost-saving"
  | "Appears cost-effective"
  | "Appears high-cost for value gained";

type UncertaintyRobustness =
  | "Robust across bounded range"
  | "Borderline across bounded range"
  | "Not robust across bounded range";

type StructuredRecommendation = {
  current_case_suggests: string;
  driving_result: string;
  fragile_point: string;
  validate_next: string;
  recommendation_line: string;
};

type OverviewSummary = {
  headline: string;
  subheadline: string;
};

type InterpretationSummary = {
  what_model_suggests: string;
  where_value_is_coming_from: string;
  what_looks_fragile: string;
  what_to_validate_next: string;
};

export function getDecisionStatus(
  results: ModelResult,
  threshold: number,
): DecisionStatus {
  if (results.discounted_net_cost_total < 0) {
    return "Appears cost-saving";
  }

  if (results.discounted_cost_per_qaly <= threshold) {
    return "Appears cost-effective";
  }

  return "Appears high-cost for value gained";
}

export function getNetCostLabel(results: ModelResult): string {
  return results.discounted_net_cost_total < 0
    ? "Net savings"
    : "Net cost";
}

export function getMainDriverText(
  sensitivity: SensitivitySummary,
): string {
  const driver = sensitivity.primary_driver;

  if (!driver) {
    return "The result is mainly shaped by fall risk, effect size, and delivery cost.";
  }

  return `The result is currently most shaped by ${driver.parameter_label.toLowerCase()}.`;
}

export function assessUncertaintyRobustness(
  uncertaintyRows: UncertaintyRow[],
  threshold: number,
): UncertaintyRobustness {
  if (!uncertaintyRows.length) {
    return "Borderline across bounded range";
  }

  const allBelowThreshold = uncertaintyRows.every(
    (row) => row.discounted_cost_per_qaly <= threshold,
  );
  const allAboveThreshold = uncertaintyRows.every(
    (row) => row.discounted_cost_per_qaly > threshold,
  );

  if (allBelowThreshold) {
    return "Robust across bounded range";
  }

  if (allAboveThreshold) {
    return "Not robust across bounded range";
  }

  return "Borderline across bounded range";
}

export function generateStructuredRecommendation(
  results: ModelResult,
  inputs: SafeStepInputs,
  uncertaintyRows: UncertaintyRow[],
  sensitivity: SensitivitySummary,
): StructuredRecommendation {
  const decision = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const robustness = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );
  const mainDriver = sensitivity.primary_driver;
  const topDrivers = sensitivity.top_drivers ?? [];

  const current_case_suggests =
    decision === "Appears cost-saving"
      ? "The current case suggests avoided falls with a net saving signal."
      : decision === "Appears cost-effective"
        ? "The current case suggests a plausible value case at the current threshold."
        : "The current case suggests clinical benefit, but the economic case is not yet persuasive at the current threshold.";

  const driving_result = mainDriver
    ? `The result is currently most influenced by ${mainDriver.parameter_label.toLowerCase()}.`
    : "The result is mainly being shaped by baseline risk, intervention effect, and delivery cost.";

  const fragile_point =
    robustness === "Robust across bounded range"
      ? "The conclusion looks relatively stable across the bounded low, base, and high cases."
      : robustness === "Borderline across bounded range"
        ? `The conclusion changes across the bounded range, so moderate shifts in assumptions could alter the decision signal${
            topDrivers[0]
              ? `, especially around ${topDrivers[0].parameter_label.toLowerCase()}`
              : ""
          }.`
        : "The case remains above threshold across the bounded range, so the current value proposition looks weak under these assumptions.";

  const validate_next =
    topDrivers.length > 1
      ? `Validate local estimates for ${topDrivers[0].parameter_label.toLowerCase()} and ${topDrivers[1].parameter_label.toLowerCase()} before treating this case as decision-ready.`
      : topDrivers.length === 1
        ? `Validate local estimates for ${topDrivers[0].parameter_label.toLowerCase()} before treating this case as decision-ready.`
        : "Validate local risk, delivery cost, and achievable effect size before treating this case as decision-ready.";

  const recommendation_line =
    decision === "Appears cost-saving"
      ? "This scenario is worth treating as a strong candidate for further local validation."
      : decision === "Appears cost-effective"
        ? "This scenario is worth refining further, especially around the most decision-sensitive assumptions."
        : "This scenario likely needs stronger targeting, lower delivery cost, or greater effect to become decision-attractive.";

  return {
    current_case_suggests,
    driving_result,
    fragile_point,
    validate_next,
    recommendation_line,
  };
}

export function generateOverviewSummary(
  results: ModelResult,
  inputs: SafeStepInputs,
): OverviewSummary {
  const decision = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const netLabel = getNetCostLabel(results);

  const headline =
    decision === "Appears cost-saving"
      ? "SafeStep currently indicates a cost-saving falls prevention case."
      : decision === "Appears cost-effective"
        ? "SafeStep currently indicates a potentially cost-effective falls prevention case."
        : "SafeStep currently indicates clinical value, but limited economic attractiveness.";

  const subheadline = `${netLabel} of ${Math.abs(
    results.discounted_net_cost_total,
  ).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  })} and discounted cost per QALY of ${results.discounted_cost_per_qaly.toLocaleString(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    },
  )}.`;

  return { headline, subheadline };
}

export function generateInterpretation(
  results: ModelResult,
  inputs: SafeStepInputs,
  uncertaintyRows: UncertaintyRow[],
  sensitivity: SensitivitySummary,
): InterpretationSummary {
  const decision = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const robustness = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );

  const what_model_suggests =
    decision === "Appears cost-saving"
      ? "The model suggests that falls prevention could reduce activity and release more value than it costs under the current assumptions."
      : decision === "Appears cost-effective"
        ? "The model suggests that the intervention could offer reasonable value for money under the current assumptions."
        : "The model suggests that the intervention may reduce falls and admissions, but the economic return is weak under the current assumptions.";

  const what_looks_fragile =
    robustness === "Robust across bounded range"
      ? "The main conclusion remains broadly stable across the bounded low, base, and high cases."
      : robustness === "Borderline across bounded range"
        ? "The result sits near a decision boundary, so moderate assumption changes could materially alter the conclusion."
        : "The result remains unfavourable across the bounded range, suggesting the case is not yet robust.";

  const what_to_validate_next =
    sensitivity.primary_driver
      ? `The next priority is to validate local assumptions around ${sensitivity.primary_driver.parameter_label.toLowerCase()}.`
      : "The next priority is to validate local assumptions around risk, intervention effect, and delivery cost.";

  return {
    what_model_suggests,
    where_value_is_coming_from: getMainDriverText(sensitivity),
    what_looks_fragile,
    what_to_validate_next,
  };
}