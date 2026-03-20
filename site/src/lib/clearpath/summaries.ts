import type {
  Inputs,
  ModelResults,
  ScenarioComparisonRow,
  UncertaintyRow,
} from "@/lib/clearpath/types";

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
  if (results.discounted_net_cost_total < 0) {
    return "Discounted net saving";
  }

  return "Discounted net cost";
}

export function getMainDriverText(inputs: Inputs): string {
  if (inputs.targeting_mode !== "Broad population") {
    return "targeting and concentration of later diagnosis";
  }

  if (inputs.costing_method === "Combined illustrative view") {
    return "the chosen costing method and the achievable diagnosis shift";
  }

  if (inputs.intervention_cost_per_case_reached >= 500) {
    return "delivery cost per case reached";
  }

  if (inputs.achievable_reduction_in_late_diagnosis <= 0.07) {
    return "the achievable reduction in late diagnosis";
  }

  if (inputs.participation_dropoff_rate >= 0.15) {
    return "participation persistence over time";
  }

  if (inputs.qaly_gain_per_case_shifted <= 0.15) {
    return "the assumed QALY gain from earlier diagnosis";
  }

  return "a combination of achievable shift, targeting, and delivery cost";
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

  return `Currently weak as a decision case. Earlier diagnosis delivers benefit, but the economics are not yet convincing. ${robustness}`;
}

export function generateStructuredRecommendation(
  inputs: Inputs,
  results: ModelResults,
  uncertaintyRows: UncertaintyRow[],
) {
  const threshold = inputs.cost_effectiveness_threshold;
  const robustness = assessUncertaintyRobustness(uncertaintyRows, threshold);
  const mainDependency = getMainDriverText(inputs);

  let mainFragility: string;

  if (inputs.costing_method === "Combined illustrative view") {
    mainFragility =
      "The result is sensitive to how value is counted, especially if treatment and acute savings overlap.";
  } else if (inputs.targeting_mode === "Broad population") {
    mainFragility =
      "The result may depend on whether broad implementation is diluting value that would look stronger in a higher-risk subgroup.";
  } else if (inputs.participation_dropoff_rate >= 0.1) {
    mainFragility =
      "The case may weaken if reach falls faster than assumed over time.";
  } else {
    mainFragility = robustness;
  }

  let bestNextStep: string;

  if (inputs.targeting_mode === "Broad population") {
    bestNextStep =
      "Test whether a more targeted implementation improves value without losing too much impact.";
  } else if (inputs.costing_method === "Combined illustrative view") {
    bestNextStep =
      "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation.";
  } else if (results.discounted_cost_per_qaly > threshold) {
    bestNextStep =
      "Validate the highest-leverage assumptions locally, especially shift size, cost inputs, and expected persistence of effect.";
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
  _uncertaintyRows: UncertaintyRow[],
) {
  const validateNext: string[] = [];

  if (inputs.costing_method === "Combined illustrative view") {
    validateNext.push(
      "Validate whether treatment and acute activity savings overlap under local costing rules.",
    );
  } else {
    validateNext.push(
      "Validate the local cost inputs used in the economic framing.",
    );
  }

  if (inputs.targeting_mode !== "Broad population") {
    validateNext.push(
      "Confirm the real prevalence and operational identifiability of the higher-risk group.",
    );
  } else {
    validateNext.push(
      "Confirm whether a more targeted implementation strategy would be operationally feasible.",
    );
  }

  if (inputs.achievable_reduction_in_late_diagnosis <= 0.07) {
    validateNext.push(
      "Check whether the assumed reduction in late diagnosis is realistic for the intervention being considered.",
    );
  } else {
    validateNext.push(
      "Validate whether the assumed shift from later to earlier diagnosis is achievable in practice.",
    );
  }

  if (inputs.participation_dropoff_rate >= 0.1) {
    validateNext.push(
      "Review whether effective reach is likely to fall at the assumed rate over time.",
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

export function summariseScenarioStrengths(
  scenarioRows: ScenarioComparisonRow[],
): string {
  if (!scenarioRows.length) {
    return "No scenario comparison is available yet.";
  }

  const bestValue = [...scenarioRows].sort(
    (a, b) => a.discounted_cost_per_qaly - b.discounted_cost_per_qaly,
  )[0];

  const bestEfficiency = [...scenarioRows].sort(
    (a, b) => a.discounted_net_cost - b.discounted_net_cost,
  )[0];

  const bestImpact = [...scenarioRows].sort(
    (a, b) => b.cases_shifted_earlier - a.cases_shifted_earlier,
  )[0];

  if (
    bestValue.scenario === bestEfficiency.scenario &&
    bestEfficiency.scenario === bestImpact.scenario
  ) {
    return `Under the current settings, ${bestValue.scenario} is simultaneously strongest for value, efficiency, and impact.`;
  }

  return `Under the current settings, ${bestValue.scenario} looks strongest for value, ${bestEfficiency.scenario} looks strongest for efficiency, and ${bestImpact.scenario} looks strongest for impact.`;
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

  const shifted = `${results.cases_shifted_total.toFixed(0)}`;
  const emergencies = `${results.emergency_presentations_avoided_total.toFixed(0)}`;
  const admissions = `${results.admissions_avoided_total.toFixed(0)}`;
  const horizon = inputs.time_horizon_years;
  const targeting = inputs.targeting_mode.toLowerCase();
  const costing = inputs.costing_method.toLowerCase();

  if (results.discounted_net_cost_total < 0) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, ClearPath suggests the intervention could shift around ${shifted} cases earlier, avoid ${emergencies} emergency presentations and ${admissions} admissions, while appearing cost-saving on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, ClearPath suggests the intervention creates meaningful pathway and outcome benefit, with around ${shifted} cases shifted earlier and ${admissions} admissions avoided. It does not appear cost-saving, but it does sit within the current threshold on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, ClearPath suggests the intervention creates measurable benefit, with around ${shifted} cases shifted earlier and ${admissions} admissions avoided, but the discounted economic case remains above the current threshold. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
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
  const readiness = generateDecisionReadiness(inputs, results, uncertaintyRows);

  let whatModelSuggests: string;

  if (results.discounted_net_cost_total < 0) {
    whatModelSuggests =
      `ClearPath suggests the intervention generates measurable pathway benefit and a discounted net saving over ${horizon} year${horizon !== 1 ? "s" : ""}. ` +
      "The current case is promising, but still depends on assumptions that remain partly illustrative.";
  } else if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    whatModelSuggests =
      `ClearPath suggests the intervention delivers measurable pathway and outcome benefit and appears cost-effective over ${horizon} year${horizon !== 1 ? "s" : ""}, ` +
      "although it does not appear cost-saving. The result looks promising, but still assumption-dependent.";
  } else {
    whatModelSuggests =
      `ClearPath suggests the intervention delivers measurable benefit over ${horizon} year${horizon !== 1 ? "s" : ""}, ` +
      "but the discounted economic case remains above the current threshold.";
  }

  const whatDrivesResult =
    `The current result depends most strongly on ${dependency}, as well as the chosen costing method, the quality of targeting, and whether intervention reach and effect persist over time.`;

  let whatLooksFragile: string;

  if (inputs.costing_method === "Combined illustrative view") {
    whatLooksFragile =
      "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap.";
  } else if (inputs.targeting_mode === "Broad population") {
    whatLooksFragile =
      "The case may be fragile because broad implementation can dilute value if the highest-opportunity patients are only a subset of the incident population.";
  } else {
    whatLooksFragile = uncertaintyText;
  }

  const firstValidationPoint =
    readiness.validate_next[0] ??
    "Validate the highest-leverage local assumptions before using the result.";

  const whatToValidateNext =
    `${firstValidationPoint} Then check whether the intervention would still look worthwhile over around ${breakEvenHorizon} under locally credible assumptions.`;

  const limitations =
    "This sandbox does not capture full staging complexity, disease progression, survival modelling, comparator trial evidence, or richer uncertainty modelling. It remains a structured exploratory tool rather than a formal appraisal model.";

  return {
    what_model_suggests: whatModelSuggests,
    what_drives_result: whatDrivesResult,
    what_looks_fragile: whatLooksFragile,
    what_to_validate_next: whatToValidateNext,
    limitations,
  };
}