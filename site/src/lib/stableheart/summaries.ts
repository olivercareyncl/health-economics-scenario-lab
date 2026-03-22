import {
  formatCurrency,
  formatPercent,
  formatRatio,
} from "@/lib/stableheart/formatters";
import type {
  Inputs,
  ModelResults,
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
  return results.discounted_net_cost_total < 0 ? "Net saving" : "Net cost";
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

function buildSensitivityFragilityText(
  sensitivity?: SensitivitySummary | null,
): string | null {
  const drivers = sensitivity?.top_drivers ?? [];
  if (!drivers.length) return null;

  const labels = drivers.slice(0, 3).map((driver) =>
    driver.parameter_label.toLowerCase(),
  );

  if (labels.length === 1) {
    return `The result moves most when ${labels[0]} is varied one way.`;
  }

  if (labels.length === 2) {
    return `The result moves most when ${labels[0]} and ${labels[1]} are varied one way.`;
  }

  return `The result moves most when ${labels[0]}, ${labels[1]}, and ${labels[2]} are varied one way.`;
}

function buildBoundedUncertaintyText(
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
  const boundedUncertaintyText = buildBoundedUncertaintyText(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );
  const sensitivityFragilityText = buildSensitivityFragilityText(sensitivity);

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
    mainDriver === "the core programme assumptions"
      ? "The result is mainly shaped by the core event-rate, effect, and delivery assumptions."
      : `The result is currently most shaped by ${mainDriver}.`;

  const whereValueIsComingFrom = buildValueMechanismText(inputs, results);

  const whatLooksFragile = sensitivityFragilityText
    ? `${boundedUncertaintyText} ${sensitivityFragilityText}`
    : boundedUncertaintyText;

  const whatToValidateNext =
    sensitivity?.primary_driver != null
      ? `Validate the local realism of ${sensitivity.primary_driver.parameter_label.toLowerCase()}, alongside sustained engagement, achievable delivery cost, and the link between avoided events and avoided admissions.`
      : "Validate local recurrent event risk, sustained engagement, achievable delivery cost, and the strength of the link between avoided events and avoided admissions.";

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