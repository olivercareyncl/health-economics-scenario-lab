import type { ModelResult, SafeStepInputs, UncertaintyRow } from "./types";

export function getDecisionStatus(
  results: ModelResult,
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

export function getNetCostLabel(results: ModelResult): string {
  return results.discounted_net_cost_total < 0
    ? "Discounted net saving"
    : "Discounted net cost";
}

export function getMainDriverText(inputs: SafeStepInputs): string {
  if (inputs.targeting_mode !== "Broad population") {
    return "targeting and baseline risk concentration";
  }
  if (inputs.costing_method === "Combined illustrative view") {
    return "the chosen costing method and intervention effectiveness";
  }
  if (inputs.intervention_cost_per_person >= 300) {
    return "delivery cost per participant";
  }
  if (inputs.relative_risk_reduction <= 0.15) {
    return "intervention effectiveness";
  }
  if (inputs.participation_dropoff_rate >= 0.15) {
    return "participation persistence over time";
  }
  if (inputs.effect_decay_rate >= 0.15) {
    return "how quickly the intervention effect decays over time";
  }
  return "a combination of intervention effectiveness, targeting, and delivery cost";
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
  results: ModelResult,
  inputs: SafeStepInputs,
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
  return `Currently weak as a decision case. The intervention delivers benefit, but the economics are not yet convincing. ${robustness}`;
}

export function generateStructuredRecommendation(
  inputs: SafeStepInputs,
  results: ModelResult,
  uncertaintyRows: UncertaintyRow[],
) {
  const threshold = inputs.cost_effectiveness_threshold;
  const robustness = assessUncertaintyRobustness(uncertaintyRows, threshold);
  const mainDependency = getMainDriverText(inputs);

  let mainFragility = "";
  if (inputs.costing_method === "Combined illustrative view") {
    mainFragility =
      "The result is sensitive to how impact is valued, especially if admission and bed-day savings overlap.";
  } else if (inputs.targeting_mode === "Broad population") {
    mainFragility =
      "The result may depend on whether broad delivery is diluting value that would look stronger in a higher-risk subgroup.";
  } else if (inputs.participation_dropoff_rate >= 0.1) {
    mainFragility =
      "The case may weaken if participation persistence is worse than assumed.";
  } else {
    mainFragility = robustness;
  }

  let bestNextStep = "";
  if (inputs.targeting_mode === "Broad population") {
    bestNextStep =
      "Test whether a more targeted delivery model improves value without losing too much impact.";
  } else if (inputs.costing_method === "Combined illustrative view") {
    bestNextStep =
      "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation.";
  } else if (results.discounted_cost_per_qaly > threshold) {
    bestNextStep =
      "Validate the highest-leverage assumptions locally, especially cost inputs and expected persistence of effect.";
  } else {
    bestNextStep =
      "Pressure-test the strongest assumptions locally before moving from exploratory use to decision support.";
  }

  return {
    mainDependency,
    mainFragility,
    bestNextStep,
  };
}

export function generateDecisionReadiness(
  inputs: SafeStepInputs,
  results: ModelResult,
) {
  const validateNext: string[] = [];

  if (inputs.costing_method === "Combined illustrative view") {
    validateNext.push(
      "Validate whether admission costs and bed-day values overlap under local costing rules.",
    );
  } else {
    validateNext.push("Validate the local cost inputs used in the economic framing.");
  }

  if (inputs.targeting_mode !== "Broad population") {
    validateNext.push(
      "Confirm the real prevalence and operational identifiability of the higher-risk subgroup.",
    );
  } else {
    validateNext.push(
      "Confirm whether a more targeted intervention strategy would be operationally feasible.",
    );
  }

  if (inputs.participation_dropoff_rate >= 0.1) {
    validateNext.push(
      "Check whether annual participation drop-off is realistic for the delivery model being considered.",
    );
  } else {
    validateNext.push(
      "Validate whether participation can realistically remain as stable as assumed.",
    );
  }

  if (inputs.effect_decay_rate >= 0.1) {
    validateNext.push(
      "Review whether the intervention effect is likely to decay at the assumed rate over time.",
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
    validateNext: validateNext.slice(0, 5),
    readinessNote:
      "This sandbox is best treated as decision-preparation support. The next step should be to validate the highest-leverage local assumptions before any real-world use.",
  };
}

export function generateOverviewSummary(
  results: ModelResult,
  inputs: SafeStepInputs,
  uncertaintyRows: UncertaintyRow[],
): string {
  const threshold = inputs.cost_effectiveness_threshold;
  const mainDriver = getMainDriverText(inputs);
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    threshold,
  );

  const falls = `${results.falls_avoided_total.toFixed(0)}`;
  const admissions = `${results.admissions_avoided_total.toFixed(0)}`;
  const horizon = inputs.time_horizon_years;
  const targeting = inputs.targeting_mode.toLowerCase();
  const costing = inputs.costing_method.toLowerCase();

  if (results.discounted_net_cost_total < 0) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, SafeStep suggests the programme could avoid around ${falls} falls and ${admissions} admissions while appearing cost-saving on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, SafeStep suggests the programme delivers meaningful health benefit, with around ${falls} falls avoided and ${admissions} admissions avoided. It does not appear cost-saving, but it does sit within the current threshold on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, SafeStep suggests the programme delivers measurable benefit, with around ${falls} falls avoided and ${admissions} admissions avoided, but the discounted economic case remains above the current threshold. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
}

export function generateInterpretation(
  results: ModelResult,
  inputs: SafeStepInputs,
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

  let whatModelSuggests = "";
  if (results.discounted_net_cost_total < 0) {
    whatModelSuggests = `SafeStep suggests the programme generates measurable health benefit and a discounted net saving over ${horizon} year${horizon !== 1 ? "s" : ""}. The current case is promising, but still depends on assumptions that remain partly illustrative.`;
  } else if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    whatModelSuggests = `SafeStep suggests the programme delivers measurable health benefit and appears cost-effective over ${horizon} year${horizon !== 1 ? "s" : ""}, although it does not appear cost-saving. The result looks promising, but still assumption-dependent.`;
  } else {
    whatModelSuggests = `SafeStep suggests the programme delivers measurable health benefit over ${horizon} year${horizon !== 1 ? "s" : ""}, but the discounted economic case remains above the current threshold.`;
  }

  const whatDrivesResult = `The current result depends most strongly on ${dependency}, as well as the chosen costing method, the quality of targeting, and whether participation and effect persist over time.`;

  let whatLooksFragile = "";
  if (inputs.costing_method === "Combined illustrative view") {
    whatLooksFragile =
      "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap.";
  } else if (inputs.targeting_mode === "Broad population") {
    whatLooksFragile =
      "The case may be fragile because broad delivery can dilute value if the highest-risk patients are only a subset of the eligible population.";
  } else {
    whatLooksFragile = uncertaintyText;
  }

  const whatToValidateNext = `Before using this in a real decision conversation, the most important next checks are: ${readiness.validateNext[0]} Then check whether the intervention would still look worthwhile over around ${breakEvenHorizon} under locally credible assumptions.`;

  const limitations =
    "This sandbox still does not capture full service pathway complexity, formal evidence synthesis, comparator trial data, or richer uncertainty modelling. It remains a structured exploratory tool rather than a formal appraisal model.";

  return {
    whatModelSuggests,
    whatDrivesResult,
    whatLooksFragile,
    whatToValidateNext,
    limitations,
  };
}