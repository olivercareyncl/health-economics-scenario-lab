import type {
  Inputs,
  ModelResults,
  UncertaintyRow,
} from "@/lib/pathshift/types";

export function getDecisionStatus(
  results: ModelResults,
  threshold: number,
): string {
  if (results.discounted_net_cost_total < 0) return "Appears cost-saving";

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

export function getMainDriverText(inputs: Inputs): string {
  if (inputs.targeting_mode !== "Broad pathway redesign") {
    return "targeting and concentration of admission risk";
  }

  if (inputs.costing_method === "Combined illustrative view") {
    return "the chosen costing method and the blend of redesign effects";
  }

  if (inputs.redesign_cost_per_patient >= 300) {
    return "implementation cost per patient";
  }

  if (
    inputs.reduction_in_admission_rate >=
    inputs.reduction_in_follow_up_contacts
  ) {
    return "admission reduction";
  }

  if (
    inputs.reduction_in_follow_up_contacts >=
    inputs.reduction_in_admission_rate
  ) {
    return "follow-up reduction";
  }

  if (inputs.participation_dropoff_rate >= 0.15) {
    return "implementation persistence over time";
  }

  return "care setting shift";
}

export function assessUncertaintyRobustness(
  uncertaintyRows: UncertaintyRow[],
  threshold: number,
): string {
  const allBelow = uncertaintyRows.every(
    (row) => row.discounted_cost_per_qaly <= threshold,
  );
  const allCostSaving = uncertaintyRows.every(
    (row) => row.discounted_net_cost_total < 0,
  );
  const anyBelow = uncertaintyRows.some(
    (row) => row.discounted_cost_per_qaly <= threshold,
  );

  if (allCostSaving) {
    return "The case appears robustly cost-saving across bounded low, base, and high cases.";
  }

  if (allBelow) {
    return "The case appears fairly robust across bounded low, base, and high cases.";
  }

  if (anyBelow) {
    return "The case looks fragile: some bounded cases are below threshold, while others are not.";
  }

  return "The case remains above threshold across the bounded cases.";
}

export function generateOverallSignal(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
): string {
  const threshold = inputs.cost_effectiveness_threshold;
  const robustness = assessUncertaintyRobustness(uncertaintyRows, threshold);

  if (results.discounted_net_cost_total < 0) {
    return `Promising for further exploration. The current configuration appears cost-saving. ${robustness}`;
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    return `Promising, but still assumption-dependent. The current configuration appears cost-effective rather than cost-saving. ${robustness}`;
  }

  return `Currently weak as a decision case. The redesign improves the pathway, but the economics are not yet convincing. ${robustness}`;
}

export function generateStructuredRecommendation(
  inputs: Inputs,
  results: ModelResults,
  uncertaintyRows: UncertaintyRow[],
) {
  const threshold = inputs.cost_effectiveness_threshold;
  const robustness = assessUncertaintyRobustness(uncertaintyRows, threshold);
  const main_dependency = getMainDriverText(inputs);

  let main_fragility: string;

  if (inputs.costing_method === "Combined illustrative view") {
    main_fragility =
      "The result is sensitive to how value is counted, especially if admission, follow-up, and bed-day effects overlap.";
  } else if (inputs.targeting_mode === "Broad pathway redesign") {
    main_fragility =
      "The result may depend on whether broad implementation is diluting value that would look stronger in a higher-risk or high-utiliser subgroup.";
  } else if (inputs.participation_dropoff_rate >= 0.1) {
    main_fragility =
      "The case may weaken if effective redesign reach falls faster than assumed over time.";
  } else {
    main_fragility = robustness;
  }

  let best_next_step: string;

  if (inputs.targeting_mode === "Broad pathway redesign") {
    best_next_step =
      "Test whether a more targeted redesign improves value without losing too much pathway impact.";
  } else if (inputs.costing_method === "Combined illustrative view") {
    best_next_step =
      "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation.";
  } else if (results.discounted_cost_per_qaly > threshold) {
    best_next_step =
      "Validate the highest-leverage assumptions locally, especially redesign effect, admission risk, and implementation cost.";
  } else {
    best_next_step =
      "Pressure-test the strongest assumptions locally before moving from exploratory use to decision support.";
  }

  return {
    main_dependency,
    main_fragility,
    best_next_step,
  };
}

export function generateDecisionReadiness(
  inputs: Inputs,
  results: ModelResults,
) {
  const validate_next: string[] = [];

  if (inputs.costing_method === "Combined illustrative view") {
    validate_next.push(
      "Validate whether admission, follow-up, and bed-day savings overlap under local costing rules.",
    );
  } else {
    validate_next.push(
      "Validate the local cost inputs used in the economic framing.",
    );
  }

  if (inputs.targeting_mode !== "Broad pathway redesign") {
    validate_next.push(
      "Confirm the real prevalence and operational identifiability of the targeted subgroup.",
    );
  } else {
    validate_next.push(
      "Confirm whether a more targeted redesign strategy would be operationally feasible.",
    );
  }

  if (inputs.current_admission_rate <= 0.1) {
    validate_next.push(
      "Check whether the assumed baseline admission rate is realistic in the local pathway.",
    );
  } else {
    validate_next.push(
      "Validate whether admission risk is concentrated among higher-risk or high-utiliser patients.",
    );
  }

  if (inputs.participation_dropoff_rate >= 0.1) {
    validate_next.push(
      "Review whether effective redesign reach is likely to fall at the assumed rate over time.",
    );
  }

  if (results.break_even_horizon.startsWith(">")) {
    validate_next.push(
      "The model does not reach threshold within the tested horizon, so local cost and effect assumptions should be reviewed first.",
    );
  } else {
    validate_next.push(
      "Check whether the implied break-even horizon is realistic in the local planning context.",
    );
  }

  return {
    validate_next: validate_next.slice(0, 5),
    readiness_note:
      "This sandbox is best treated as decision-preparation support. The next step should be to validate the highest-leverage local assumptions before any real-world use.",
  };
}

export function generateOverviewSummary(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
): string {
  const threshold = inputs.cost_effectiveness_threshold;
  const mainDriver = getMainDriverText(inputs);
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    threshold,
  );

  const shifted = `${results.patients_shifted_total.toFixed(0)}`;
  const admissions = `${results.admissions_avoided_total.toFixed(0)}`;
  const followups = `${results.follow_ups_avoided_total.toFixed(0)}`;
  const horizon = inputs.time_horizon_years;
  const targeting = inputs.targeting_mode.toLowerCase();
  const costing = inputs.costing_method.toLowerCase();

  if (results.discounted_net_cost_total < 0) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, PathShift suggests the redesign could shift around ${shifted} patients in the pathway, avoid ${admissions} admissions and ${followups} follow-ups, while appearing cost-saving on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, PathShift suggests the redesign creates meaningful pathway and outcome benefit, with around ${shifted} patients shifted and ${admissions} admissions avoided. It does not appear cost-saving, but it does sit within the current threshold on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, PathShift suggests the redesign creates measurable benefit, with around ${shifted} patients shifted and ${admissions} admissions avoided, but the discounted economic case remains above the current threshold. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
}

export function generateInterpretation(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
) {
  const threshold = inputs.cost_effectiveness_threshold;
  const horizon = inputs.time_horizon_years;
  const breakEvenHorizon = results.break_even_horizon;
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    threshold,
  );
  const dependency = getMainDriverText(inputs);
  const readiness = generateDecisionReadiness(inputs, results);

  let what_model_suggests: string;

  if (results.discounted_net_cost_total < 0) {
    what_model_suggests =
      `PathShift suggests the redesign generates measurable pathway benefit and a discounted net saving over ${horizon} year${horizon !== 1 ? "s" : ""}. ` +
      "The current case is promising, but still depends on assumptions that remain partly illustrative.";
  } else if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    what_model_suggests =
      `PathShift suggests the redesign delivers measurable pathway and outcome benefit and appears cost-effective over ${horizon} year${horizon !== 1 ? "s" : ""}, ` +
      "although it does not appear cost-saving. The result looks promising, but still assumption-dependent.";
  } else {
    what_model_suggests =
      `PathShift suggests the redesign delivers measurable benefit over ${horizon} year${horizon !== 1 ? "s" : ""}, ` +
      "but the discounted economic case remains above the current threshold.";
  }

  const what_drives_result =
    `The current result depends most strongly on ${dependency}, as well as the chosen costing method, the quality of targeting, ` +
    "and whether redesign reach and effect persist over time.";

  let what_looks_fragile: string;

  if (inputs.costing_method === "Combined illustrative view") {
    what_looks_fragile =
      "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap.";
  } else if (inputs.targeting_mode === "Broad pathway redesign") {
    what_looks_fragile =
      "The case may be fragile because broad redesign can dilute value if the highest-opportunity patients are only a subset of the pathway population.";
  } else {
    what_looks_fragile = uncertaintyText;
  }

  const firstValidationPoint =
    readiness.validate_next[0] ??
    "Validate the highest-leverage local assumptions before using the result.";

  const what_to_validate_next =
    `${firstValidationPoint} Then check whether the redesign would still look worthwhile over around ${breakEvenHorizon} ` +
    "under locally credible assumptions.";

  const limitations =
    "This sandbox does not capture detailed pathway states, disease-specific progression, patient-level heterogeneity, or richer uncertainty modelling. " +
    "It remains a structured exploratory tool rather than a formal appraisal model.";

  return {
    what_model_suggests,
    what_drives_result,
    what_looks_fragile,
    what_to_validate_next,
    limitations,
  };
}