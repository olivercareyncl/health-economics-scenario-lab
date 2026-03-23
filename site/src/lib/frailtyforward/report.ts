import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/frailtyforward/formatters";
import {
  assessUncertaintyRobustness,
  generateDecisionReadiness,
  generateInterpretation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/frailtyforward/summaries";
import type {
  Inputs,
  ModelResults,
  SensitivitySummary,
  UncertaintyRow,
} from "@/lib/frailtyforward/types";

type BuildReportArgs = {
  inputs: Inputs;
  results: ModelResults;
  uncertainty: UncertaintyRow[];
  sensitivity: SensitivitySummary;
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

export type FrailtyForwardReportData = {
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
    topDrivers: Array<{
      label: string;
      value: string;
      note: string;
    }>;
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

function buildPurposeQuestion(inputs: Inputs): string {
  return `This run explores whether a proactive frailty support model in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce crisis events, non-elective admissions, bed use, and economic burden over ${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"} under the current assumptions.`;
}

function buildScenarioSection(
  inputs: Inputs,
): FrailtyForwardReportData["scenario"] {
  return {
    interventionConcept: `The scenario tests a frailty support model that aims to reach ${formatPercent(
      inputs.implementation_reach_rate,
    )} of the relevant cohort and reduce crisis events by ${formatPercent(
      inputs.reduction_in_crisis_event_rate,
    )}, admissions by ${formatPercent(
      inputs.reduction_in_admission_rate,
    )}, and length of stay by ${formatPercent(
      inputs.reduction_in_length_of_stay,
    )}. In practice, this could represent proactive case management, enhanced multidisciplinary support, community geriatric input, virtual ward style support, or structured monitoring for frail patients.`,
    targetPopulationLogic: `The model assumes an annual frailty cohort of ${formatNumber(
      inputs.annual_frailty_cohort_size,
    )}, with a baseline crisis event rate of ${formatPercent(
      inputs.baseline_crisis_event_rate,
    )} and a baseline non-elective admission rate of ${formatPercent(
      inputs.baseline_non_elective_admission_rate,
    )}. The targeting mode is set to ${inputs.targeting_mode}, which changes how concentrated the opportunity is assumed to be within the population and therefore how much practical benefit might be achievable.`,
    economicMechanism: `The value mechanism runs through fewer crisis events, fewer admissions, lower bed use, and health gain from stabilising frail patients earlier and more effectively. The model then assesses whether these effects are enough to offset programme costs and produce an acceptable cost per QALY against the selected threshold.`,
  };
}

function buildPlainEnglishResults(
  inputs: Inputs,
  results: ModelResults,
  decisionStatus: string,
  netCostLabel: string,
): ReportNarrativeBlock[] {
  return [
    {
      body: `Under the current assumptions, the model stabilises ${formatNumber(
        results.patients_stabilised_total,
      )} patients over ${inputs.time_horizon_years} year${
        inputs.time_horizon_years === 1 ? "" : "s"
      }.`,
    },
    {
      body: `That is associated with ${formatNumber(
        results.crisis_events_avoided_total,
      )} fewer crisis events, ${formatNumber(
        results.admissions_avoided_total,
      )} fewer admissions, and ${formatNumber(
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
      body: `Taken together, the current signal is ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the signal remains sensitive to support effect, delivery cost, targeting quality, and persistence over time.`,
    },
  ];
}

function buildAssumptionSections(
  inputs: Inputs,
): FrailtyForwardReportData["assumptions"]["sections"] {
  return [
    {
      title: "Core programme assumptions",
      rows: [
        {
          assumption: "Targeting mode",
          value: inputs.targeting_mode,
          rationale:
            "Determines how concentrated the opportunity is assumed to be and therefore how plausible it is to achieve meaningful benefit in the selected subgroup.",
        },
        {
          assumption: "Annual frailty cohort size",
          value: formatNumber(inputs.annual_frailty_cohort_size),
          rationale:
            "Sets the scale of the addressable population and directly affects the size of any pathway and economic effect.",
        },
        {
          assumption: "Implementation reach",
          value: formatPercent(inputs.implementation_reach_rate),
          rationale:
            "Controls how much of the relevant cohort is effectively reached by the support model in practice.",
        },
        {
          assumption: "Support cost per patient",
          value: formatCurrency(inputs.support_cost_per_patient),
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
      title: "Baseline risk assumptions",
      rows: [
        {
          assumption: "Baseline crisis event rate",
          value: formatPercent(inputs.baseline_crisis_event_rate),
          rationale:
            "Captures the baseline level of deterioration or crisis risk and therefore the potential for avoidable pressure.",
        },
        {
          assumption: "Baseline non-elective admission rate",
          value: formatPercent(inputs.baseline_non_elective_admission_rate),
          rationale:
            "Defines the starting acute admission burden within the selected cohort.",
        },
        {
          assumption: "Current average length of stay",
          value: `${inputs.current_average_length_of_stay.toFixed(
            Number.isInteger(inputs.current_average_length_of_stay) ? 0 : 1,
          )} days`,
          rationale:
            "Converts avoided admissions and stay reductions into avoided bed use and associated hospital pressure.",
        },
      ],
    },
    {
      title: "Support effect assumptions",
      rows: [
        {
          assumption: "Reduction in crisis event rate",
          value: formatPercent(inputs.reduction_in_crisis_event_rate),
          rationale:
            "One of the main effect levers because it determines how much deterioration is prevented under the support model.",
        },
        {
          assumption: "Reduction in admission rate",
          value: formatPercent(inputs.reduction_in_admission_rate),
          rationale:
            "Defines how much admission pressure is reduced among those reached by the intervention.",
        },
        {
          assumption: "Reduction in length of stay",
          value: formatPercent(inputs.reduction_in_length_of_stay),
          rationale:
            "Determines how much inpatient bed use is reduced when admissions still occur.",
        },
        {
          assumption: "QALY gain per patient stabilised",
          value: inputs.qaly_gain_per_patient_stabilised.toFixed(2),
          rationale:
            "Determines how much health gain is attributed to each patient meaningfully stabilised and therefore strongly influences cost per QALY.",
        },
      ],
    },
    {
      title: "Cost and persistence assumptions",
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
          assumption: "Cost per crisis event",
          value: formatCurrency(inputs.cost_per_crisis_event),
          rationale:
            "Monetises avoided deterioration or crisis events and is therefore a contributor to gross savings.",
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
            "Monetises avoided bed use and reflects the downstream resource effect of frailty support.",
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

function buildSensitivitySummary(sensitivity: SensitivitySummary): string[] {
  const top = sensitivity.top_drivers;

  if (top.length === 0) {
    return [
      "One-way sensitivity has not highlighted a clear set of dominant drivers yet.",
      "At this stage, the case should still be treated as dependent on the core assumptions around support effect, reach, and delivery cost.",
      "Further validation should focus on the most decision-relevant pathway and cost inputs locally.",
    ];
  }

  const first = top[0]?.label.toLowerCase();
  const second = top[1]?.label.toLowerCase();
  const third = top[2]?.label.toLowerCase();

  const line1 = second
    ? `The result is most sensitive to ${first} and ${second}.`
    : `The result is most sensitive to ${first}.`;

  const line2 = third
    ? `In practical terms, the case is strongest when ${first}, ${second}, and ${third} remain favourable under locally credible assumptions.`
    : `In practical terms, the case is strongest when ${first} remains favourable under locally credible assumptions.`;

  const line3 =
    "The case weakens fastest when support effect is smaller than expected, delivery becomes more expensive, or crisis and admission benefits are less pronounced locally.";

  return [line1, line2, line3];
}

function buildTopDriverRows(sensitivity: SensitivitySummary) {
  return sensitivity.top_drivers.slice(0, 3).map((driver, index) => ({
    label: `Driver ${index + 1}`,
    value: driver.label,
    note: `Largest ICER swing: ${formatCurrency(driver.swing)}`,
  }));
}

export function buildFrailtyForwardReportData({
  inputs,
  results,
  uncertainty,
  sensitivity,
  exportedAt,
}: BuildReportArgs): FrailtyForwardReportData {
  const interpretation = generateInterpretation(results, inputs, uncertainty);
  const decisionReadiness = generateDecisionReadiness(inputs, results);
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const signalLabel = getSignalLabel(decisionStatus);
  const netCostLabel = getNetCostLabel(results);
  const mainDriver = getMainDriverText(inputs);

  const uncertaintyReadout = assessUncertaintyRobustness(
    uncertainty,
    inputs.cost_effectiveness_threshold,
  );

  const sensitivitySummary = buildSensitivitySummary(sensitivity);

  let overallSignal = "";
  if (results.discounted_net_cost_total < 0) {
    overallSignal = `Promising for further exploration. The current configuration appears cost-saving. ${uncertaintyReadout}`;
  } else if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
  ) {
    overallSignal = `Promising, but still assumption-dependent. The current configuration appears cost-effective rather than cost-saving. ${uncertaintyReadout}`;
  } else {
    overallSignal = `Currently weak as a decision case. The support model reduces pressure, but the economics are not yet convincing. ${uncertaintyReadout}`;
  }

  const overview = `Over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  }, FrailtyForward suggests the support model could stabilise around ${formatNumber(
    results.patients_stabilised_total,
  )} patients, avoid ${formatNumber(
    results.crisis_events_avoided_total,
  )} crisis events and ${formatNumber(
    results.admissions_avoided_total,
  )} admissions, while producing a decision signal of ${decisionStatus.toLowerCase()}. The result is most strongly shaped by ${mainDriver}. ${uncertaintyReadout}`;

  return {
    cover: {
      title: "FrailtyForward scenario report",
      subtitle:
        "Exploratory health economic scenario brief for proactive frailty support",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
      decisionStatus,
      signalLabel,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "FrailtyForward is an exploratory health economic scenario model. It is designed to test whether earlier or more proactive frailty support could plausibly reduce crisis events, admissions, bed use, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
    },

    executiveSummary: {
      overview,
      overallSignal,
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: `The case is currently most dependent on ${mainDriver}.`,
      mainFragility: interpretation.what_looks_fragile,
      bestNextStep: decisionReadiness.validate_next[0] ?? "Validate the highest-leverage local assumptions.",
    },

    scenario: buildScenarioSection(inputs),

    headlineMetrics: [
      {
        label: "Patients stabilised",
        value: formatNumber(results.patients_stabilised_total),
      },
      {
        label: "Crisis events avoided",
        value: formatNumber(results.crisis_events_avoided_total),
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
        note: `${formatNumber(row.patients_stabilised_total)} patients stabilised · ${row.decision_status}`,
      })),
      sensitivitySummary,
      topDrivers: buildTopDriverRows(sensitivity),
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible pathway effect, an acceptable cost per QALY against threshold, and a decision signal that remains directionally positive under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local credibility of the assumed crisis and admission reductions and the extent to which that benefit would translate into real service and bed use impact.",
      currentCasePosition: `At this stage the case looks ${signalLabel.toLowerCase()}. That should be treated as an early decision signal rather than a final answer.`,
      recommendedNextMove:
        decisionReadiness.validate_next[0] ??
        "Validate the key local pathway and implementation assumptions before progression.",
    },

    caveats: {
      useNote: `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data, implementation realism, and validation work. ${uncertaintyReadout}`,
    },

    localEvidenceNeeded: {
      items: [
        "Local frailty cohort size in the relevant pathway",
        "Local crisis event rate in the target cohort",
        "Local non-elective admission rate in the target cohort",
        "Local average length of stay for admitted frailty patients",
        "Realistic implementation reach in the intended operating model",
        "Likely support cost per patient reached",
      ],
    },
  };
}