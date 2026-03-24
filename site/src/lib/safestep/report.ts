
import type {
  ModelResult,
  ParameterSensitivityRow,
  SafeStepInputs,
  SensitivitySummary,
  UncertaintyRow,
} from "@/lib/safestep/types";

type BuildReportArgs = {
  inputs: SafeStepInputs;
  results: ModelResult;
  uncertainty: UncertaintyRow[];
  oneWaySensitivity: SensitivitySummary;
  exportedAt: string;
};

type ReportMetric = {
  label: string;
  value: string;
};

type ReportTableRow = {
  assumption: string;
  value: string;
  rationale: string;
};

type ReportTableSection = {
  title: string;
  rows: ReportTableRow[];
};

type ReportNarrativeBlock = {
  title?: string;
  body: string;
};

export type SafeStepReportData = {
  cover: {
    title: string;
    subtitle: string;
    module: string;
    generatedAt: string;
    decisionStatus: string;
    signalLabel: string;
  };
  purpose: {
    question: string;
    context: string;
  };
  executiveSummary: {
    overview: string;
    overallSignal: string;
    whatModelSuggests: string;
    mainDependency: string;
    mainFragility: string;
    bestNextStep: string;
  };
  scenario: {
    interventionConcept: string;
    targetPopulationLogic: string;
    economicMechanism: string;
  };
  headlineMetrics: ReportMetric[];
  plainEnglishResults: ReportNarrativeBlock[];
  assumptions: {
    sections: ReportTableSection[];
  };
  uncertaintyAndSensitivity: {
    robustnessSummary: string;
    uncertaintyRows: Array<{
      label: string;
      value: string;
      note: string;
    }>;
    sensitivitySummary: string[];
  };
  scenarioAndComparator: {
    scenarioSummary: string;
    strongestScenario: string;
    weakestScenario: string;
    comparatorSummary: string;
  };
  decisionImplications: {
    progressionView: string;
    mainEvidenceGap: string;
    currentCasePosition: string;
    recommendedNextMove: string;
  };
  caveats: {
    useNote: string;
  };
  localEvidenceNeeded: {
    items: string[];
  };
};

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const formatted = `£${abs.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
  return value < 0 ? `-${formatted}` : formatted;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function formatDecimal(value: number, dp = 2): string {
  return value.toFixed(dp);
}

function formatRatio(value: number): string {
  return `${value.toFixed(2)}x`;
}

function getDecisionStatus(
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

function getSignalLabel(decisionStatus: string): string {
  const normalised = decisionStatus.toLowerCase();

  if (
    normalised.includes("cost-saving") ||
    normalised.includes("cost effective") ||
    normalised.includes("cost-effective") ||
    normalised.includes("promising") ||
    normalised.includes("favourable")
  ) {
    return "Promising";
  }

  if (
    normalised.includes("borderline") ||
    normalised.includes("uncertain") ||
    normalised.includes("finely balanced")
  ) {
    return "Borderline";
  }

  return "Weak";
}

function getNetCostLabel(results: ModelResult): string {
  return results.discounted_net_cost_total < 0
    ? "Discounted net saving"
    : "Discounted net cost";
}

function getMainDriverText(
  inputs: SafeStepInputs,
  sensitivity?: SensitivitySummary,
): string {
  const primary = sensitivity?.primary_driver?.parameter_label;
  if (primary) {
    return primary.toLowerCase();
  }

  if (inputs.targeting_mode !== "Broad population") {
    return "targeting and concentration of fall risk";
  }

  if (inputs.costing_method === "Combined illustrative view") {
    return "the chosen costing method and the blend of avoided admission and bed-day value";
  }

  if (inputs.intervention_cost_per_person >= 300) {
    return "intervention cost per person";
  }

  if (inputs.relative_risk_reduction >= 0.2) {
    return "assumed fall-risk reduction";
  }

  if (inputs.participation_dropoff_rate >= 0.1) {
    return "participation persistence over time";
  }

  return "uptake, adherence, and achievable risk reduction";
}

function assessUncertaintyRobustness(
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

function buildPurposeQuestion(inputs: SafeStepInputs): string {
  return `This run explores whether a falls-prevention intervention in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce falls, avoid admissions, reduce bed use, and improve economic value over ${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"} under the current assumptions.`;
}

function buildScenarioSection(
  inputs: SafeStepInputs,
): SafeStepReportData["scenario"] {
  return {
    interventionConcept: `The scenario tests a falls-prevention approach that aims to reach ${formatPercent(
      inputs.uptake_rate,
    )} of the eligible population, retain effective participation through an adherence rate of ${formatPercent(
      inputs.adherence_rate,
    )}, and reduce fall risk by ${formatPercent(
      inputs.relative_risk_reduction,
    )}. In practice, this could represent exercise-based prevention, balance and strength work, medication review, home hazard reduction, or a targeted community support model.`,
    targetPopulationLogic: `The model assumes an eligible population of ${formatNumber(
      inputs.eligible_population,
    )}, a baseline annual fall risk of ${formatPercent(
      inputs.annual_fall_risk,
    )}, and a targeting mode of ${inputs.targeting_mode}. The targeting mode affects the effective population reached, the concentration of risk, and therefore how much practical benefit may be achievable.`,
    economicMechanism: `The value mechanism runs through fewer falls, fewer admissions following falls, reduced bed use, and a health gain associated with avoiding serious fall-related harm. The model then assesses whether these effects are enough to offset intervention costs and produce an acceptable cost per QALY against the selected threshold.`,
  };
}

function buildPlainEnglishResults(
  inputs: SafeStepInputs,
  results: ModelResult,
  decisionStatus: string,
  netCostLabel: string,
): ReportNarrativeBlock[] {
  return [
    {
      body: `Under the current assumptions, the model avoids ${formatNumber(
        results.falls_avoided_total,
      )} falls over ${inputs.time_horizon_years} year${
        inputs.time_horizon_years === 1 ? "" : "s"
      }.`,
    },
    {
      body: `That reduction is associated with ${formatNumber(
        results.admissions_avoided_total,
      )} fewer admissions and ${formatNumber(
        results.bed_days_avoided_total,
      )} fewer bed days across the selected horizon.`,
    },
    {
      body: `${netCostLabel} is estimated at ${formatCurrency(
        Math.abs(results.discounted_net_cost_total),
      )}, with a discounted cost per QALY of ${formatCurrency(
        results.discounted_cost_per_qaly,
      )} against a threshold of ${formatCurrency(
        inputs.cost_effectiveness_threshold,
      )}.`,
    },
    {
      body: `Taken together, the current signal is ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the signal remains sensitive to uptake, adherence, the achievable reduction in fall risk, and delivery cost.`,
    },
  ];
}

function buildAssumptionSections(
  inputs: SafeStepInputs,
): SafeStepReportData["assumptions"]["sections"] {
  return [
    {
      title: "Core programme assumptions",
      rows: [
        {
          assumption: "Targeting mode",
          value: inputs.targeting_mode,
          rationale:
            "Determines how concentrated the opportunity is assumed to be and therefore how plausible it is to achieve meaningful impact in the selected population.",
        },
        {
          assumption: "Eligible population",
          value: formatNumber(inputs.eligible_population),
          rationale:
            "Sets the scale of the addressable population and directly affects the size of any pathway and economic effect.",
        },
        {
          assumption: "Uptake rate",
          value: formatPercent(inputs.uptake_rate),
          rationale:
            "Controls how much of the eligible population actually enters the intervention.",
        },
        {
          assumption: "Adherence rate",
          value: formatPercent(inputs.adherence_rate),
          rationale:
            "Acts as a practical delivery multiplier because the model assumes better adherence supports better realised benefit.",
        },
        {
          assumption: "Intervention cost per person",
          value: formatCurrency(inputs.intervention_cost_per_person),
          rationale:
            "Acts as the main programme cost lever and has a direct influence on whether the case remains economically attractive.",
        },
        {
          assumption: "Time horizon",
          value: `${inputs.time_horizon_years} year${
            inputs.time_horizon_years === 1 ? "" : "s"
          }`,
          rationale:
            "Longer horizons allow more downstream pathway and economic effects to accumulate, which can materially improve the observed value case.",
        },
      ],
    },
    {
      title: "Risk and pathway assumptions",
      rows: [
        {
          assumption: "Annual fall risk",
          value: formatPercent(inputs.annual_fall_risk),
          rationale:
            "Defines the baseline burden. Higher underlying fall risk creates more headroom for avoidable harm reduction.",
        },
        {
          assumption: "Relative risk reduction",
          value: formatPercent(inputs.relative_risk_reduction),
          rationale:
            "This is one of the most important value levers because it determines how much of the baseline fall burden can realistically be reduced.",
        },
        {
          assumption: "Admission rate after fall",
          value: formatPercent(inputs.admission_rate_after_fall),
          rationale:
            "Translates avoided falls into avoided downstream admissions and therefore drives acute value.",
        },
        {
          assumption: "Average length of stay",
          value: `${inputs.average_length_of_stay.toFixed(
            Number.isInteger(inputs.average_length_of_stay) ? 0 : 1,
          )} days`,
          rationale:
            "Converts avoided admissions into avoided bed use and associated hospital pressure.",
        },
      ],
    },
    {
      title: "Cost assumptions",
      rows: [
        {
          assumption: "Costing method",
          value: inputs.costing_method,
          rationale:
            "Defines the cost framing applied in the model and therefore influences how downstream savings are represented.",
        },
        {
          assumption: "Cost-effectiveness threshold",
          value: formatCurrency(inputs.cost_effectiveness_threshold),
          rationale:
            "Provides the benchmark used to judge whether the modelled cost per QALY looks acceptable.",
        },
        {
          assumption: "Cost per admission",
          value: formatCurrency(inputs.cost_per_admission),
          rationale:
            "Monetises avoided acute admissions and is therefore a key contributor to gross savings.",
        },
        {
          assumption: "Cost per bed day",
          value: formatCurrency(inputs.cost_per_bed_day),
          rationale:
            "Monetises avoided bed use and reflects the downstream hospital resource effect of preventing serious falls.",
        },
      ],
    },
    {
      title: "Outcome and persistence assumptions",
      rows: [
        {
          assumption: "QALY loss per serious fall",
          value: formatDecimal(inputs.qaly_loss_per_serious_fall, 2),
          rationale:
            "Determines how much health gain is attributed to preventing serious fall-related harm and therefore strongly influences cost per QALY.",
        },
        {
          assumption: "Annual effect decay",
          value: formatPercent(inputs.effect_decay_rate),
          rationale:
            "Represents how much of the intervention effect is assumed to fade over time.",
        },
        {
          assumption: "Annual participation drop-off",
          value: formatPercent(inputs.participation_dropoff_rate),
          rationale:
            "Captures erosion in engagement or programme coverage across the selected time horizon.",
        },
        {
          assumption: "Discount rate",
          value: formatPercent(inputs.discount_rate),
          rationale:
            "Adjusts future costs and benefits into present-value terms and therefore affects the reported economic signal.",
        },
      ],
    },
  ];
}

function generateOverallSignal(
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

  return `Currently weak as a decision case. The intervention reduces falls and downstream pressure, but the economics are not yet convincing. ${robustness}`;
}

function generateOverviewSummary(
  results: ModelResult,
  inputs: SafeStepInputs,
  uncertaintyRows: UncertaintyRow[],
  sensitivity: SensitivitySummary,
): string {
  const threshold = inputs.cost_effectiveness_threshold;
  const mainDriver = getMainDriverText(inputs, sensitivity);
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    threshold,
  );

  const falls = `${results.falls_avoided_total.toFixed(0)}`;
  const admissions = `${results.admissions_avoided_total.toFixed(0)}`;
  const bedDays = `${results.bed_days_avoided_total.toFixed(0)}`;
  const horizon = inputs.time_horizon_years;
  const targeting = inputs.targeting_mode.toLowerCase();
  const costing = inputs.costing_method.toLowerCase();

  if (results.discounted_net_cost_total < 0) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, SafeStep suggests the intervention could avoid around ${falls} falls, ${admissions} admissions, and ${bedDays} bed days while appearing cost-saving on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, SafeStep suggests the intervention creates meaningful falls-prevention benefit and downstream acute value, with around ${falls} falls avoided and ${admissions} admissions avoided. It does not appear cost-saving, but it does sit within the current threshold on a discounted basis. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
  }

  return `Over ${horizon} year${horizon !== 1 ? "s" : ""}, SafeStep suggests the intervention creates measurable benefit, with around ${falls} falls avoided and ${admissions} admissions avoided, but the discounted economic case remains above the current threshold. The current case reflects ${targeting} using ${costing}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyText}`;
}

function generateInterpretation(
  results: ModelResult,
  inputs: SafeStepInputs,
  uncertaintyRows: UncertaintyRow[],
): {
  what_model_suggests: string;
  what_drives_result: string;
  what_looks_fragile: string;
  what_to_validate_next: string;
  limitations: string;
} {
  const threshold = inputs.cost_effectiveness_threshold;
  const horizon = inputs.time_horizon_years;
  const breakEvenHorizon = results.break_even_horizon;
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    threshold,
  );
  const dependency = getMainDriverText(inputs);

  let whatModelSuggests = "";
  if (results.discounted_net_cost_total < 0) {
    whatModelSuggests =
      `SafeStep suggests the intervention generates measurable falls-prevention benefit and a discounted net saving over ${horizon} year` +
      `${horizon === 1 ? "" : "s"}. The current case is promising, but still depends on assumptions that remain partly illustrative.`;
  } else if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
    whatModelSuggests =
      `SafeStep suggests the intervention delivers measurable benefit and appears cost-effective over ${horizon} year` +
      `${horizon === 1 ? "" : "s"}, although it does not appear cost-saving. The result looks promising, but still assumption-dependent.`;
  } else {
    whatModelSuggests =
      `SafeStep suggests the intervention delivers measurable benefit over ${horizon} year` +
      `${horizon === 1 ? "" : "s"}, but the discounted economic case remains above the current threshold.`;
  }

  const whatDrivesResult =
    `The current result depends most strongly on ${dependency}, as well as the chosen costing method, the quality of targeting, ` +
    "and whether participation, adherence, and effect persist over time.";

  let whatLooksFragile = "";
  if (inputs.costing_method === "Combined illustrative view") {
    whatLooksFragile =
      "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap.";
  } else if (inputs.targeting_mode === "Broad population") {
    whatLooksFragile =
      "The case may be fragile because broad implementation can dilute value if the highest-opportunity people are only a subset of the eligible population.";
  } else {
    whatLooksFragile = uncertaintyText;
  }

  const whatToValidateNext =
    "Before using this in a real decision conversation, the most important next checks are local uptake, adherence, baseline fall risk, admission conversion after falls, and delivery cost. " +
    `Then check whether the intervention would still look worthwhile over around ${breakEvenHorizon} under locally credible assumptions.`;

  const limitations =
    "This sandbox does not capture detailed frailty progression, repeated-event heterogeneity, service interaction effects, or richer uncertainty modelling. " +
    "It remains a structured exploratory tool rather than a formal appraisal model.";

  return {
    what_model_suggests: whatModelSuggests,
    what_drives_result: whatDrivesResult,
    what_looks_fragile: whatLooksFragile,
    what_to_validate_next: whatToValidateNext,
    limitations,
  };
}

function generateStructuredRecommendation(
  inputs: SafeStepInputs,
  results: ModelResult,
  uncertaintyRows: UncertaintyRow[],
  sensitivity: SensitivitySummary,
): {
  main_dependency: string;
  main_fragility: string;
  best_next_step: string;
} {
  const threshold = inputs.cost_effectiveness_threshold;
  const robustness = assessUncertaintyRobustness(uncertaintyRows, threshold);
  const mainDependency = getMainDriverText(inputs, sensitivity);

  let mainFragility: string;
  if (inputs.costing_method === "Combined illustrative view") {
    mainFragility =
      "The result is sensitive to how value is counted, especially if admission and bed-day effects overlap.";
  } else if (inputs.targeting_mode === "Broad population") {
    mainFragility =
      "The result may depend on whether broad implementation is diluting value that would look stronger in a higher-risk subgroup.";
  } else if (inputs.participation_dropoff_rate >= 0.1) {
    mainFragility =
      "The case may weaken if effective participation falls faster than assumed over time.";
  } else {
    mainFragility = robustness;
  }

  let bestNextStep: string;
  if (inputs.targeting_mode === "Broad population") {
    bestNextStep =
      "Test whether a more targeted delivery model improves value without losing too much practical population impact.";
  } else if (inputs.costing_method === "Combined illustrative view") {
    bestNextStep =
      "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation.";
  } else if (results.discounted_cost_per_qaly > threshold) {
    bestNextStep =
      "Validate the highest-leverage assumptions locally, especially fall-risk reduction, baseline risk, uptake, adherence, and delivery cost.";
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

function buildSensitivitySummary(
  sensitivity: SensitivitySummary,
): string[] {
  const top = sensitivity.top_drivers;

  if (top.length === 0) {
    return [
      "One-way sensitivity has not highlighted a clear set of dominant drivers yet.",
      "At this stage, the case should still be treated as dependent on the core assumptions around uptake, adherence, fall-risk reduction, and delivery cost.",
      "Further validation should focus on the most decision-relevant implementation, risk, and cost inputs locally.",
    ];
  }

  const first = top[0]?.parameter_label.toLowerCase();
  const second = top[1]?.parameter_label.toLowerCase();
  const third = top[2]?.parameter_label.toLowerCase();

  const line1 = second
    ? `The result is most sensitive to ${first} and ${second}.`
    : `The result is most sensitive to ${first}.`;

  const line2 = third
    ? `In practical terms, the case is strongest when ${first}, ${second}, and ${third} remain favourable under locally credible assumptions.`
    : `In practical terms, the case is strongest when ${first} remains favourable under locally credible assumptions.`;

  const line3 =
    "The case weakens fastest when uptake or adherence are lower than expected, achievable fall-risk reduction is smaller, or delivery costs are higher.";

  return [line1, line2, line3];
}

function mapSensitivityRowToDriverText(
  row: ParameterSensitivityRow | null,
): string | null {
  if (!row) return null;
  return row.parameter_label.toLowerCase();
}

export function buildSafeStepReportData({
  inputs,
  results,
  uncertainty,
  oneWaySensitivity,
  exportedAt,
}: BuildReportArgs): SafeStepReportData {
  const interpretation = generateInterpretation(
    results,
    inputs,
    uncertainty,
  );
  const overallSignal = generateOverallSignal(results, inputs, uncertainty);
  const structured = generateStructuredRecommendation(
    inputs,
    results,
    uncertainty,
    oneWaySensitivity,
  );
  const overview = generateOverviewSummary(
    results,
    inputs,
    uncertainty,
    oneWaySensitivity,
  );

  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );

  const signalLabel = getSignalLabel(decisionStatus);
  const netCostLabel = getNetCostLabel(results);
  const mainDriver =
    mapSensitivityRowToDriverText(oneWaySensitivity.primary_driver) ??
    getMainDriverText(inputs, oneWaySensitivity);

  const uncertaintyReadout = assessUncertaintyRobustness(
    uncertainty,
    inputs.cost_effectiveness_threshold,
  );

  const sensitivitySummary = buildSensitivitySummary(oneWaySensitivity);

  return {
    cover: {
      title: "SafeStep scenario report",
      subtitle:
        "Exploratory health economic scenario brief for falls prevention",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
      decisionStatus,
      signalLabel,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "SafeStep is an exploratory health economic scenario model. It is designed to test whether a falls-prevention intervention could plausibly reduce falls, avoid admissions, reduce bed use, and improve economic value under a specified set of assumptions before formal evaluation or business case development.",
    },

    executiveSummary: {
      overview,
      overallSignal,
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: `${structured.main_dependency} Main driver: ${mainDriver}.`,
      mainFragility: structured.main_fragility,
      bestNextStep: structured.best_next_step,
    },

    scenario: buildScenarioSection(inputs),

    headlineMetrics: [
      {
        label: "Falls avoided",
        value: formatNumber(results.falls_avoided_total),
      },
      {
        label: "Admissions avoided",
        value: formatNumber(results.admissions_avoided_total),
      },
      {
        label: "Bed days avoided",
        value: formatNumber(results.bed_days_avoided_total),
      },
      {
        label: "Treated population in year 1",
        value: formatNumber(results.treated_population_year_1),
      },
      {
        label: netCostLabel,
        value: formatCurrency(Math.abs(results.discounted_net_cost_total)),
      },
      {
        label: "Discounted cost per QALY",
        value: formatCurrency(results.discounted_cost_per_qaly),
      },
      {
        label: "Return on spend",
        value: formatRatio(results.roi),
      },
      {
        label: "Break-even horizon",
        value: results.break_even_horizon,
      },
    ],

    plainEnglishResults: buildPlainEnglishResults(
      inputs,
      results,
      decisionStatus,
      netCostLabel,
    ),

    assumptions: {
      sections: buildAssumptionSections(inputs),
    },

    uncertaintyAndSensitivity: {
      robustnessSummary: `Bounded uncertainty suggests the current signal should be treated with care rather than as a settled answer. ${uncertaintyReadout}`,
      uncertaintyRows: uncertainty.map((row) => ({
        label: row.case,
        value: formatCurrency(row.discounted_cost_per_qaly),
        note: `${formatNumber(row.falls_avoided_total)} falls avoided · ${row.decision_status}`,
      })),
      sensitivitySummary,
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where baseline fall risk is sufficiently high, intervention uptake and adherence are credible, and the delivery model can achieve a meaningful reduction in falls at a realistic cost.",
      strongestScenario:
        "The strongest scenario is typically the one where uptake is higher, adherence is stronger, fall-risk reduction is more material, and delivery cost is relatively modest.",
      weakestScenario:
        "The weakest or most fragile scenario is typically the one where uptake or adherence are lower, fall-risk reduction is smaller, or delivery costs are higher.",
      comparatorSummary:
        "Comparator interpretation should focus on whether the current configuration offers a materially better prevention and economic signal than a more conservative or differently targeted alternative. If gains over comparator are modest, the case is more likely to require stronger local evidence before progression.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible prevention effect, an acceptable cost per QALY against threshold, and a decision signal that remains directionally positive under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local credibility of the assumed reduction in fall risk and the extent to which that reduction would translate into real avoided admissions and bed use.",
      currentCasePosition: `At this stage the case looks ${signalLabel.toLowerCase()}. That should be treated as an early decision signal rather than a final answer.`,
      recommendedNextMove:
        "The next step should be to validate the key local implementation and pathway assumptions, especially uptake, adherence, baseline fall risk, admission conversion after falls, and likely delivery cost.",
    },

    caveats: {
      useNote: `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data, implementation realism, and validation work. ${uncertaintyReadout}`,
    },

    localEvidenceNeeded: {
      items: [
        "Local eligible population and likely real-world uptake",
        "Expected adherence or sustained participation in the intervention",
        "Local baseline fall risk in the target group",
        "Local admission rate following falls",
        "Local average length of stay for fall-related admissions",
        "Likely implementation cost per person reached",
      ],
    },
  };
}