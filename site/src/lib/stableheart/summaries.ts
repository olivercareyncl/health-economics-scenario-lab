import {
  formatCurrency,
  formatPercent,
  formatRatio,
} from "@/lib/stableheart/formatters";
import type {
  Inputs,
  ModelResults,
  ParameterSensitivityRow,
  SensitivitySummary,
  UncertaintyRow,
} from "@/lib/stableheart/types";

function normalizeDecisionStatus(status: string) {
  return status.trim().toLowerCase();
}

export function getDecisionStatus(
  results: ModelResults,
  threshold: number,
): string {
  if (results.discounted_net_cost_total < 0) {
    return "Appears cost-saving";
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    return "Appears cost-effective";
  }

  return "Above current threshold";
}

export function getNetCostLabel(results: ModelResults): string {
  return results.discounted_net_cost_total < 0
    ? "Discounted net saving"
    : "Discounted net cost";
}

export function getMainDriverText(
  inputs: Inputs,
  sensitivity?: SensitivitySummary | null,
): string {
  const primaryDriver = sensitivity?.primary_driver;

  if (primaryDriver) {
    return primaryDriver.parameter_label.toLowerCase();
  }

  if (inputs.intervention_cost_per_patient_reached >= 250) {
    return "intervention cost per patient";
  }

  if (inputs.baseline_recurrent_event_rate >= 0.25) {
    return "baseline recurrent event rate";
  }

  if (inputs.risk_reduction_in_recurrent_events >= 0.2) {
    return "risk reduction in recurrent events";
  }

  if (inputs.sustained_engagement_rate < 0.6) {
    return "sustained engagement";
  }

  if (inputs.admission_probability_per_event >= 0.35) {
    return "admission probability per event";
  }

  return "the core programme assumptions";
}

export function assessUncertaintyRobustness(
  uncertaintyRows: UncertaintyRow[],
  threshold: number,
): string {
  if (!uncertaintyRows.length) {
    return "Bounded uncertainty has not yet been characterised.";
  }

  const statuses = uncertaintyRows.map((row) =>
    normalizeDecisionStatus(row.decision_status),
  );

  const allCostSaving = statuses.every((status) =>
    status.includes("cost-saving"),
  );
  if (allCostSaving) {
    return "The bounded uncertainty range stays cost-saving across the low, base, and high cases.";
  }

  const allCostEffective = statuses.every(
    (status) =>
      status.includes("cost-effective") || status.includes("cost-saving"),
  );
  if (allCostEffective) {
    return `The bounded uncertainty range stays at or below the ${formatCurrency(
      threshold,
    )} threshold across the low, base, and high cases.`;
  }

  const anyBelowThreshold = uncertaintyRows.some(
    (row) =>
      row.discounted_net_cost_total < 0 ||
      (row.discounted_cost_per_qaly > 0 &&
        row.discounted_cost_per_qaly <= threshold),
  );

  if (anyBelowThreshold) {
    return "The bounded uncertainty range crosses decision categories, so moderate changes in assumptions could change the conclusion.";
  }

  return `The bounded uncertainty range remains above the ${formatCurrency(
    threshold,
  )} threshold across the low, base, and high cases.`;
}

function buildSensitivityLead(topDrivers: ParameterSensitivityRow[]): string {
  const labels = topDrivers
    .slice(0, 3)
    .map((driver) => driver.parameter_label.toLowerCase());

  if (!labels.length) {
    return "The result is most likely to move when the core event-rate, effect, and delivery assumptions change.";
  }

  if (labels.length === 1) {
    return `The result is most sensitive to ${labels[0]}.`;
  }

  if (labels.length === 2) {
    return `The result is most sensitive to ${labels[0]} and ${labels[1]}.`;
  }

  return `The result is most sensitive to ${labels[0]}, ${labels[1]}, and ${labels[2]}.`;
}

function buildValueMechanismText(
  inputs: Inputs,
  results: ModelResults,
): string {
  if (inputs.costing_method === "Bed-day value only") {
    return `Most modelled value is coming through avoided bed use, with ${formatCurrency(
      results.gross_savings_total,
    )} in gross savings driven primarily by reduced admissions and length of stay.`;
  }

  if (inputs.costing_method === "Event and admission savings only") {
    return `Most modelled value is coming through avoided recurrent events and admissions, generating ${formatCurrency(
      results.gross_savings_total,
    )} in gross savings before programme cost is considered.`;
  }

  return `Modelled value is coming through a combination of avoided recurrent events, fewer admissions, and reduced bed use, with total gross savings of ${formatCurrency(
    results.gross_savings_total,
  )}.`;
}

function buildFragilityFromSensitivity(
  uncertaintyRows: UncertaintyRow[],
  sensitivity?: SensitivitySummary | null,
): string {
  const low = uncertaintyRows.find((row) => row.case === "Low");
  const high = uncertaintyRows.find((row) => row.case === "High");
  const topDrivers = sensitivity?.top_drivers ?? [];

  if (!low || !high) {
    return "The result should be interpreted cautiously because bounded uncertainty has not been fully characterised.";
  }

  if (low.decision_status !== high.decision_status) {
    if (topDrivers.length > 0) {
      return `The bounded uncertainty range crosses decision categories, and one-way sensitivity suggests the result is particularly exposed to ${topDrivers[0].parameter_label.toLowerCase()}.`;
    }

    return "The bounded uncertainty range crosses decision categories, so moderate changes in baseline risk, achieved effect, or delivery cost could change the conclusion.";
  }

  if (topDrivers.length > 0) {
    return `The bounded range is more stable, but the result still moves most when ${topDrivers[0].parameter_label.toLowerCase()} and related core assumptions are varied.`;
  }

  return "The bounded uncertainty range is directionally stable, but the case still depends on realistic assumptions about baseline risk, sustained engagement, achieved effect, and delivery cost.";
}

export function generateOverallSignal(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
): string {
  const robustness = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );

  if (results.discounted_net_cost_total < 0) {
    return `Promising for further exploration. The current configuration appears cost-saving. ${robustness}`;
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
  ) {
    return `Promising, but still assumption-dependent. The current configuration appears cost-effective rather than cost-saving. ${robustness}`;
  }

  return `Currently weak as a decision case. The model suggests operational benefit, but the economics are not yet convincing. ${robustness}`;
}

export function generateStructuredRecommendation(
  inputs: Inputs,
  results: ModelResults,
  uncertaintyRows: UncertaintyRow[],
  sensitivity?: SensitivitySummary | null,
) {
  const robustness = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );
  const mainDependency = getMainDriverText(inputs, sensitivity);
  const topDrivers = sensitivity?.top_drivers ?? [];

  let mainFragility: string;

  if (inputs.costing_method === "Combined illustrative view") {
    mainFragility =
      "The result is sensitive to how value is counted, especially if event, admission, and bed-day savings overlap.";
  } else if (topDrivers.length > 0) {
    mainFragility = buildFragilityFromSensitivity(uncertaintyRows, sensitivity);
  } else if (inputs.sustained_engagement_rate < 0.6) {
    mainFragility =
      "The case may weaken if sustained engagement is lower than assumed in practice.";
  } else if (inputs.annual_participation_dropoff_rate >= 0.1) {
    mainFragility =
      "The case may weaken if participation falls faster than assumed over time.";
  } else {
    mainFragility = robustness;
  }

  let bestNextStep: string;

  if (topDrivers.length > 0) {
    const first = topDrivers[0].parameter_label.toLowerCase();
    const second = topDrivers[1]?.parameter_label.toLowerCase();

    bestNextStep = second
      ? `Validate local ${first} and ${second} before using the result in a live decision conversation.`
      : `Validate local ${first} before using the result in a live decision conversation.`;
  } else if (inputs.costing_method === "Combined illustrative view") {
    bestNextStep =
      "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation.";
  } else if (
    results.discounted_cost_per_qaly > inputs.cost_effectiveness_threshold
  ) {
    bestNextStep =
      "Validate the highest-leverage assumptions locally, especially baseline event risk, effect size, engagement, and delivery cost.";
  } else {
    bestNextStep =
      "Pressure-test the strongest assumptions locally before moving from exploratory use to decision support.";
  }

  return {
    main_dependency: mainDependency,
    main_fragility: mainFragility,
    best_next_step: bestNextStep,
  };
}

export function generateDecisionReadiness(
  inputs: Inputs,
  results: ModelResults,
  sensitivity?: SensitivitySummary | null,
) {
  const validateNext: string[] = [];
  const topDrivers = sensitivity?.top_drivers ?? [];

  if (inputs.costing_method === "Combined illustrative view") {
    validateNext.push(
      "Validate whether event, admission, and bed-day savings overlap under local costing rules.",
    );
  } else {
    validateNext.push(
      "Validate the local cost inputs used in the economic framing.",
    );
  }

  if (topDrivers.length > 0) {
    validateNext.push(
      `Validate the local realism of ${topDrivers[0].parameter_label.toLowerCase()}.`,
    );

    if (topDrivers[1]) {
      validateNext.push(
        `Then validate ${topDrivers[1].parameter_label.toLowerCase()} under locally credible assumptions.`,
      );
    }
  } else if (inputs.risk_reduction_in_recurrent_events <= 0.15) {
    validateNext.push(
      "Check whether the assumed reduction in recurrent events is realistic for the intervention being considered.",
    );
  } else {
    validateNext.push(
      "Validate whether the assumed reduction in recurrent events is achievable in practice.",
    );
  }

  if (inputs.sustained_engagement_rate < 0.7) {
    validateNext.push(
      "Review whether sustained engagement is likely to be lower than assumed in the local setting.",
    );
  }

  if (results.break_even_horizon.startsWith(">")) {
    validateNext.push(
      "The model does not reach threshold within the tested horizon, so local cost and effect assumptions should be reviewed first.",
    );
  } else {
    validateNext.push(
      "Check whether the implied break-even horizon is realistic in the local planning context.",
    );
  }

  return {
    validate_next: validateNext.slice(0, 5),
    readiness_note:
      "This sandbox is best treated as decision-preparation support. The next step should be to validate the highest-leverage local assumptions before any real-world use.",
  };
}

export function generateOverviewSummary(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
  sensitivity?: SensitivitySummary | null,
): string {
  const mainDriver = getMainDriverText(inputs, sensitivity);
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );

  const events = `${results.events_avoided_total.toFixed(0)}`;
  const admissions = `${results.admissions_avoided_total.toFixed(0)}`;
  const bedDays = `${results.bed_days_avoided_total.toFixed(0)}`;
  const horizon = inputs.time_horizon_years;
  const costing = inputs.costing_method.toLowerCase();

  if (results.discounted_net_cost_total < 0) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, StableHeart suggests the intervention could avoid around ${events} recurrent cardiovascular events, ${admissions} admissions, and ${bedDays} bed days, while appearing cost-saving on a discounted basis. The current case uses ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
  ) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, StableHeart suggests the intervention creates meaningful pathway and outcome benefit, with around ${events} recurrent events avoided and ${admissions} admissions avoided. It does not appear cost-saving, but it does sit within the current threshold on a discounted basis. The current case uses ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, StableHeart suggests the intervention creates measurable benefit, with around ${events} recurrent events avoided and ${admissions} admissions avoided, but the discounted economic case remains above the current threshold. The current case uses ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
}

export function generateInterpretation(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
  sensitivity?: SensitivitySummary | null,
) {
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const mainDriver = getMainDriverText(inputs, sensitivity);
  const boundedUncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );
  const topDrivers = sensitivity?.top_drivers ?? [];

  const whatModelSuggests =
    decisionStatus === "Appears cost-saving"
      ? `The current case suggests avoided recurrent cardiovascular events with a discounted net saving over ${inputs.time_horizon_years} year${
          inputs.time_horizon_years === 1 ? "" : "s"
        }.`
      : decisionStatus === "Appears cost-effective"
        ? `The current case suggests a plausible value case over ${inputs.time_horizon_years} year${
            inputs.time_horizon_years === 1 ? "" : "s"
          }, with a discounted cost per QALY of ${formatCurrency(
            results.discounted_cost_per_qaly,
          )}.`
        : `The current case suggests operational benefit, but the discounted cost per QALY of ${formatCurrency(
            results.discounted_cost_per_qaly,
          )} remains above the current threshold over ${inputs.time_horizon_years} year${
            inputs.time_horizon_years === 1 ? "" : "s"
          }.`;

  const whatDrivesResult =
    topDrivers.length > 0
      ? `${buildSensitivityLead(topDrivers)} In practical terms, the result depends most strongly on ${mainDriver}, as well as the realism of sustained patient engagement and the strength of the link between avoided events and avoided admissions.`
      : mainDriver === "the core programme assumptions"
        ? "The result is mainly shaped by the core event-rate, effect, and delivery assumptions."
        : `The result is currently most shaped by ${mainDriver}.`;

  const whereValueIsComingFrom = buildValueMechanismText(inputs, results);

  const whatLooksFragile =
    inputs.costing_method === "Combined illustrative view"
      ? "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap."
      : topDrivers.length > 0
        ? buildFragilityFromSensitivity(uncertaintyRows, sensitivity)
        : boundedUncertaintyText;

  const readiness = generateDecisionReadiness(inputs, results, sensitivity);
  const firstValidationPoint =
    readiness.validate_next[0] ??
    "Validate the highest-leverage local assumptions before using the result.";

  const whatToValidateNext = `${firstValidationPoint} Then check whether the intervention would still look worthwhile over around ${results.break_even_horizon} under locally credible assumptions.`;

  return {
    what_model_suggests: whatModelSuggests,
    what_drives_result: whatDrivesResult,
    where_value_is_coming_from: whereValueIsComingFrom,
    what_looks_fragile: whatLooksFragile,
    what_to_validate_next: whatToValidateNext,
    roi_summary: `Return on spend is ${formatRatio(results.roi)}.`,
    threshold_summary: `The current threshold is ${formatCurrency(
      inputs.cost_effectiveness_threshold,
    )}, and the required risk reduction for break-even is ${formatPercent(
      results.break_even_risk_reduction_required,
    )}.`,
  };
}