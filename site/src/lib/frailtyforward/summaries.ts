import type { Inputs, ModelResults, UncertaintyRow } from "@/lib/frailtyforward/types";

export function getDecisionStatus(results: ModelResults, threshold: number): string {
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

export function getMainDriverText(inputs: Inputs): string {
  if (inputs.targeting_mode !== "Broad frailty cohort") {
    return "targeting and concentration of crisis and admission risk";
  }
  if (inputs.costing_method === "Combined illustrative view") {
    return "the chosen costing method and the blend of support effects";
  }
  if (inputs.support_cost_per_patient >= 450) {
    return "support cost per patient";
  }
  if (inputs.reduction_in_admission_rate >= inputs.reduction_in_crisis_event_rate) {
    return "admission reduction";
  }
  if (inputs.reduction_in_crisis_event_rate >= inputs.reduction_in_admission_rate) {
    return "crisis prevention";
  }
  if (inputs.participation_dropoff_rate >= 0.15) {
    return "support persistence over time";
  }
  return "length-of-stay reduction";
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

export function generateInterpretation(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
) {
  const threshold = inputs.cost_effectiveness_threshold;
  const horizon = inputs.time_horizon_years;
  const breakEvenHorizon = results.break_even_horizon;
  const uncertaintyText = assessUncertaintyRobustness(uncertaintyRows, threshold);
  const dependency = getMainDriverText(inputs);

  let whatModelSuggests = "";
  if (results.discounted_net_cost_total < 0) {
    whatModelSuggests =
      `FrailtyForward suggests the support model generates measurable community and acute benefit and a discounted net saving over ${horizon} year` +
      `${horizon === 1 ? "" : "s"}. The current case is promising, but still depends on assumptions that remain partly illustrative.`;
  } else if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    whatModelSuggests =
      `FrailtyForward suggests the support model delivers measurable benefit and appears cost-effective over ${horizon} year` +
      `${horizon === 1 ? "" : "s"}, although it does not appear cost-saving. The result looks promising, but still assumption-dependent.`;
  } else {
    whatModelSuggests =
      `FrailtyForward suggests the support model delivers measurable benefit over ${horizon} year` +
      `${horizon === 1 ? "" : "s"}, but the discounted economic case remains above the current threshold.`;
  }

  const whatDrivesResult =
    `The current result depends most strongly on ${dependency}, as well as the chosen costing method, the quality of targeting, ` +
    `and whether support reach and effect persist over time.`;

  let whatLooksFragile = "";
  if (inputs.costing_method === "Combined illustrative view") {
    whatLooksFragile =
      "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap.";
  } else if (inputs.targeting_mode === "Broad frailty cohort") {
    whatLooksFragile =
      "The case may be fragile because broad implementation can dilute value if the highest-opportunity patients are only a subset of the frailty cohort.";
  } else {
    whatLooksFragile = uncertaintyText;
  }

  const whatToValidateNext =
    "Before using this in a real decision conversation, the most important next checks are: " +
    `${generateDecisionReadiness(inputs, results).validate_next[0]} ` +
    `Then check whether the support model would still look worthwhile over around ${breakEvenHorizon} under locally credible assumptions.`;

  const limitations =
    "This sandbox does not capture detailed frailty progression, patient-level heterogeneity, social care system interactions, or richer uncertainty modelling. " +
    "It remains a structured exploratory tool rather than a formal appraisal model.";

  return {
    what_model_suggests: whatModelSuggests,
    what_drives_result: whatDrivesResult,
    what_looks_fragile: whatLooksFragile,
    what_to_validate_next: whatToValidateNext,
    limitations: limitations,
  };
}

export function generateDecisionReadiness(
  inputs: Inputs,
  results: ModelResults,
) {
  const validateNext: string[] = [];

  if (inputs.costing_method === "Combined illustrative view") {
    validateNext.push(
      "Validate whether crisis, admission, and bed-day savings overlap under local costing rules.",
    );
  } else {
    validateNext.push("Validate the local cost inputs used in the economic framing.");
  }

  if (inputs.targeting_mode !== "Broad frailty cohort") {
    validateNext.push(
      "Confirm the real prevalence and operational identifiability of the targeted subgroup.",
    );
  } else {
    validateNext.push(
      "Confirm whether a more targeted support strategy would be operationally feasible.",
    );
  }

  if (inputs.baseline_non_elective_admission_rate <= 0.12) {
    validateNext.push(
      "Check whether the assumed baseline admission rate is realistic in the local frailty cohort.",
    );
  } else {
    validateNext.push(
      "Validate whether admission risk is concentrated among higher-risk or frequent-admitter patients.",
    );
  }

  if (inputs.baseline_crisis_event_rate <= 0.2) {
    validateNext.push(
      "Check whether the assumed crisis event rate is realistic in the local frailty cohort.",
    );
  } else {
    validateNext.push(
      "Validate whether crisis risk is concentrated among the highest-need frailty patients.",
    );
  }

  if (inputs.participation_dropoff_rate >= 0.1) {
    validateNext.push(
      "Review whether effective support reach is likely to fall at the assumed rate over time.",
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
    validate_next: validateNext.slice(0, 6),
    readiness_note:
      "This sandbox is best treated as decision-preparation support. The next step should be to validate the highest-leverage local assumptions before any real-world use.",
  };
}