import type { Inputs, ModelResults, UncertaintyRow } from "@/lib/stableheart/types";

export function getDecisionStatus(results: ModelResults, threshold: number): string {
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
  if (inputs.targeting_mode === "Secondary prevention focus") {
    return "concentrated recurrent event risk in a secondary prevention population";
  }
  if (inputs.costing_method === "Combined illustrative view") {
    return "the chosen costing method and the blend of avoided-event savings";
  }
  if (inputs.intervention_cost_per_patient_reached >= 350) {
    return "intervention cost per patient";
  }
  if (inputs.risk_reduction_in_recurrent_events >= 0.2) {
    return "recurrent event risk reduction";
  }
  if (inputs.sustained_engagement_rate <= 0.7) {
    return "sustained engagement and persistence";
  }
  return "baseline recurrent event risk";
}

export function assessUncertaintyRobustness(
  uncertaintyRows: UncertaintyRow[],
  threshold: number,
): string {
  const allBelow = uncertaintyRows.every((row) => row.discounted_cost_per_qaly <= threshold);
  const allCostSaving = uncertaintyRows.every((row) => row.discounted_net_cost_total < 0);
  const anyBelow = uncertaintyRows.some((row) => row.discounted_cost_per_qaly <= threshold);

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
  const robustness = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );

  if (results.discounted_net_cost_total < 0) {
    return `Promising for further exploration. The current configuration appears cost-saving. ${robustness}`;
  }
  if (results.discounted_cost_per_qaly > 0 && results.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold) {
    return `Promising, but still assumption-dependent. The current configuration appears cost-effective rather than cost-saving. ${robustness}`;
  }
  return `Currently weak as a decision case. The intervention improves outcomes, but the economics are not yet convincing. ${robustness}`;
}

export function generateStructuredRecommendation(
  inputs: Inputs,
  results: ModelResults,
  uncertaintyRows: UncertaintyRow[],
) {
  const robustness = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );
  const main_dependency = getMainDriverText(inputs);

  let main_fragility: string;
  if (inputs.costing_method === "Combined illustrative view") {
    main_fragility =
      "The result is sensitive to how value is counted, especially if event, admission, and bed-day effects overlap.";
  } else if (inputs.targeting_mode === "Broad cardiovascular risk cohort") {
    main_fragility =
      "The result may weaken if baseline recurrent event risk is too diluted in a broader cardiovascular risk population.";
  } else if (
    inputs.sustained_engagement_rate <= 0.7 ||
    inputs.annual_participation_dropoff_rate >= 0.1
  ) {
    main_fragility =
      "The case may weaken if sustained engagement falls faster than assumed over time.";
  } else {
    main_fragility = robustness;
  }

  let best_next_step: string;
  if (inputs.targeting_mode !== "Secondary prevention focus") {
    best_next_step =
      "Test whether the intervention looks stronger when focused on a more clearly identifiable secondary prevention population.";
  } else if (inputs.costing_method === "Combined illustrative view") {
    best_next_step =
      "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation.";
  } else if (results.discounted_cost_per_qaly > inputs.cost_effectiveness_threshold) {
    best_next_step =
      "Validate the highest-leverage assumptions locally, especially recurrent event risk, risk reduction, and delivery cost.";
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
  _uncertaintyRows: UncertaintyRow[],
) {
  const validate_next: string[] = [];

  if (inputs.costing_method === "Combined illustrative view") {
    validate_next.push(
      "Validate whether event, admission, and bed-day savings overlap under local costing rules.",
    );
  } else {
    validate_next.push("Validate the local cost inputs used in the economic framing.");
  }

  if (inputs.targeting_mode === "Broad cardiovascular risk cohort") {
    validate_next.push(
      "Check whether the intervention should be modelled more credibly as high-risk or secondary prevention rather than broad risk management.",
    );
  } else {
    validate_next.push(
      "Confirm the real prevalence and operational identifiability of the intended high-risk or secondary prevention cohort.",
    );
  }

  validate_next.push("Validate the baseline recurrent cardiovascular event rate in the local population.");
  validate_next.push(
    "Check whether the assumed admission probability per event is realistic for the event mix being proxied.",
  );
  validate_next.push(
    "Review whether sustained engagement and participation drop-off are plausible in real delivery conditions.",
  );

  if (results.break_even_horizon.startsWith(">")) {
    validate_next.push(
      "The model does not reach threshold within the tested horizon, so baseline risk, effect size, and delivery cost should be reviewed first.",
    );
  } else {
    validate_next.push(
      "Check whether the implied break-even horizon is realistic in the local planning context.",
    );
  }

  return {
    validate_next: validate_next.slice(0, 6),
    readiness_note:
      "This sandbox is best treated as decision-preparation support. The next step should be to validate the highest-leverage local assumptions before any real-world use.",
  };
}

export function summariseScenarioStrengths(scenarioRows: Array<Record<string, string | number>>) {
  const bestValue = [...scenarioRows].sort(
    (a, b) =>
      Number(a["Discounted cost per QALY"]) - Number(b["Discounted cost per QALY"]),
  )[0];
  const bestEfficiency = [...scenarioRows].sort(
    (a, b) => Number(a["Discounted net cost"]) - Number(b["Discounted net cost"]),
  )[0];
  const bestImpact = [...scenarioRows].sort(
    (a, b) => Number(b["Events avoided"]) - Number(a["Events avoided"]),
  )[0];

  if (
    bestValue["Scenario"] === bestEfficiency["Scenario"] &&
    bestEfficiency["Scenario"] === bestImpact["Scenario"]
  ) {
    return `Under the current settings, **${bestValue["Scenario"]}** is simultaneously strongest for value, efficiency, and avoided recurrent events.`;
  }

  return `Under the current settings, **${bestValue["Scenario"]}** looks strongest for value, **${bestEfficiency["Scenario"]}** looks strongest for efficiency, and **${bestImpact["Scenario"]}** looks strongest for recurrent events avoided.`;
}

export function generateOverviewSummary(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
): string {
  const mainDriver = getMainDriverText(inputs);
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );

  const events = `${results.events_avoided_total.toFixed(0)}`;
  const admissions = `${results.admissions_avoided_total.toFixed(0)}`;
  const bedDays = `${results.bed_days_avoided_total.toFixed(0)}`;
  const horizon = inputs.time_horizon_years;
  const targeting = inputs.targeting_mode.toLowerCase();
  const costing = inputs.costing_method.toLowerCase();

  if (results.discounted_net_cost_total < 0) {
    return `Over ${horizon} year${horizon === 1 ? "" : "s"}, StableHeart suggests the intervention could avoid around ${events} recurrent acute cardiovascular events, ${admissions} admissions, and ${bedDays} bed days while appearing cost-saving on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
  ) {
    return `Over ${horizon} year${horizon === 1 ? "" : "s"}, StableHeart suggests the intervention creates meaningful clinical and economic benefit, with around ${events} recurrent events avoided and ${admissions} admissions avoided. It does not appear cost-saving, but it does sit within the current threshold on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  return `Over ${horizon} year${horizon === 1 ? "" : "s"}, StableHeart suggests the intervention creates measurable benefit, with around ${events} recurrent events avoided and ${admissions} admissions avoided, but the discounted economic case remains above the current threshold. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
}

export function generateInterpretation(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
) {
  const horizon = inputs.time_horizon_years;
  const breakEvenHorizon = results.break_even_horizon;
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    inputs.cost_effectiveness_threshold,
  );
  const dependency = getMainDriverText(inputs);
  const readiness = generateDecisionReadiness(inputs, results, uncertaintyRows);

  let what_model_suggests: string;
  if (results.discounted_net_cost_total < 0) {
    what_model_suggests = `StableHeart suggests the intervention generates measurable benefit and a discounted net saving over ${horizon} year${horizon === 1 ? "" : "s"}. The current case is promising, but still depends on assumptions that remain partly illustrative.`;
  } else if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
  ) {
    what_model_suggests = `StableHeart suggests the intervention delivers measurable benefit and appears cost-effective over ${horizon} year${horizon === 1 ? "" : "s"}, although it does not appear cost-saving. The result looks promising, but still assumption-dependent.`;
  } else {
    what_model_suggests = `StableHeart suggests the intervention delivers measurable benefit over ${horizon} year${horizon === 1 ? "" : "s"}, but the discounted economic case remains above the current threshold.`;
  }

  const what_drives_result = `The current result depends most strongly on ${dependency}, as well as the baseline recurrent event rate, the quality of targeting, and whether meaningful engagement and effect persist over time.`;

  const where_value_is_coming_from =
    "The core value mechanism in StableHeart is avoided recurrent acute cardiovascular events. Those avoided events drive admissions avoided, bed days avoided, QALYs gained, and the largest share of economic benefit.";

  let what_looks_fragile: string;
  if (inputs.costing_method === "Combined illustrative view") {
    what_looks_fragile =
      "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap.";
  } else if (inputs.targeting_mode === "Broad cardiovascular risk cohort") {
    what_looks_fragile =
      "The case may be fragile because a broad cardiovascular risk cohort can dilute recurrent event risk, making it harder for avoided events to offset programme costs.";
  } else {
    what_looks_fragile = uncertaintyText;
  }

  const what_to_validate_next = `Before using this in a real decision conversation, the most important next checks are: ${readiness.validate_next[0]} Then check whether the intervention would still look worthwhile over around ${breakEvenHorizon} under locally credible assumptions.`;

  const limitations =
    "This sandbox uses a simplified composite cardiovascular event proxy and does not distinguish MI, stroke, heart failure, or other event types. It does not model disease progression, mortality, patient-level heterogeneity, or richer uncertainty and therefore remains a structured exploratory tool rather than a formal appraisal model.";

  return {
    what_model_suggests,
    what_drives_result,
    where_value_is_coming_from,
    what_looks_fragile,
    what_to_validate_next,
    limitations,
  };
}