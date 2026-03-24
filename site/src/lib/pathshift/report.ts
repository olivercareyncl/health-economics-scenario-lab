import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/pathshift/formatters";
import {
  assessUncertaintyRobustness,
  generateDecisionReadiness,
  generateInterpretation,
  generateOverviewSummary,
  generateOverallSignal,
  generateStructuredRecommendation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/pathshift/summaries";
import type {
  Inputs,
  ModelResults,
  SensitivitySummary,
  UncertaintyRow,
} from "@/lib/pathshift/types";

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

export type PathShiftReportData = {
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
    topParameterDrivers: Array<{
      label: string;
      value: string;
      note: string;
    }>;
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
    normalised.includes("fragile")
  ) {
    return "Borderline";
  }

  return "Weak";
}

function buildPurposeQuestion(inputs: Inputs): string {
  return `This run explores whether a pathway redesign in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly shift patients into a lower-cost setting, reduce admissions and follow-up burden, and improve value over ${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"} under the current assumptions.`;
}

function buildScenarioSection(inputs: Inputs): PathShiftReportData["scenario"] {
  return {
    interventionConcept: `The scenario tests a pathway redesign that aims to reach ${formatPercent(
      inputs.implementation_reach_rate,
    )} of the relevant population, shift ${formatPercent(
      inputs.proportion_shifted_to_lower_cost_setting,
    )} of reached patients into a lower-cost setting, reduce admissions by ${formatPercent(
      inputs.reduction_in_admission_rate,
    )}, and reduce follow-up contacts by ${formatPercent(
      inputs.reduction_in_follow_up_contacts,
    )}. In practice, this could represent redesigned triage, community substitution, alternative follow-up models, or more structured pathway management.`,
    targetPopulationLogic: `The model assumes an annual cohort of ${formatNumber(
      inputs.annual_cohort_size,
    )} patients, with a current admission rate of ${formatPercent(
      inputs.current_admission_rate,
    )} and ${inputs.current_follow_up_contacts_per_patient.toFixed(
      1,
    )} follow-up contacts per patient. The targeting mode is set to ${
      inputs.targeting_mode
    }, which affects how concentrated the opportunity is assumed to be within the pathway population.`,
    economicMechanism: `The value mechanism runs through substitution away from higher-cost acute management, fewer admissions, fewer follow-up contacts, lower bed use, and quality-of-life improvement for patients meaningfully improved by the redesign. The model then assesses whether these effects are enough to offset redesign costs and produce an acceptable cost per QALY against the selected threshold.`,
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
      body: `Under the current assumptions, the model shifts ${formatNumber(
        results.patients_shifted_total,
      )} patients in the pathway over ${inputs.time_horizon_years} year${
        inputs.time_horizon_years === 1 ? "" : "s"
      }.`,
    },
    {
      body: `That shift is associated with ${formatNumber(
        results.admissions_avoided_total,
      )} fewer admissions, ${formatNumber(
        results.follow_ups_avoided_total,
      )} fewer follow-up contacts, and ${formatNumber(
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
      body: `Taken together, the current signal is ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the signal remains sensitive to the assumed size of the pathway shift, reduction in admissions and follow-up burden, and redesign cost.`,
    },
  ];
}

function buildAssumptionSections(
  inputs: Inputs,
): PathShiftReportData["assumptions"]["sections"] {
  return [
    {
      title: "Core redesign assumptions",
      rows: [
        {
          assumption: "Targeting mode",
          value: inputs.targeting_mode,
          rationale:
            "Determines how concentrated the redesign opportunity is assumed to be and therefore how plausible it is to generate meaningful pathway change in the selected population.",
        },
        {
          assumption: "Annual cohort size",
          value: formatNumber(inputs.annual_cohort_size),
          rationale:
            "Sets the scale of the addressable pathway population and directly affects the size of any pathway and economic effect.",
        },
        {
          assumption: "Implementation reach",
          value: formatPercent(inputs.implementation_reach_rate),
          rationale:
            "Controls how much of the pathway population is effectively reached by the redesign in practice.",
        },
        {
          assumption: "Redesign cost per patient",
          value: formatCurrency(inputs.redesign_cost_per_patient),
          rationale:
            "Acts as the main programme cost lever and has a direct influence on whether the redesign remains economically attractive.",
        },
        {
          assumption: "Proportion shifted to lower-cost setting",
          value: formatPercent(inputs.proportion_shifted_to_lower_cost_setting),
          rationale:
            "This is one of the core pathway levers because it determines how much activity is moved out of a higher-cost model of care.",
        },
        {
          assumption: "Time horizon",
          value: `${inputs.time_horizon_years} year${
            inputs.time_horizon_years === 1 ? "" : "s"
          }`,
          rationale:
            "Longer horizons allow more pathway and economic effects to accumulate, which can materially improve the observed value case.",
        },
      ],
    },
    {
      title: "Pathway baseline assumptions",
      rows: [
        {
          assumption: "Current acute-managed rate",
          value: formatPercent(inputs.current_acute_managed_rate),
          rationale:
            "Defines the baseline share of patients currently managed in a higher-cost setting and therefore the headroom for redesign.",
        },
        {
          assumption: "Current admission rate",
          value: formatPercent(inputs.current_admission_rate),
          rationale:
            "Defines the baseline acute risk profile and influences how much avoidable admission activity is available to reduce.",
        },
        {
          assumption: "Current follow-up contacts per patient",
          value: inputs.current_follow_up_contacts_per_patient.toFixed(1),
          rationale:
            "Captures current follow-up intensity and therefore the potential to reduce lower-value or avoidable contact burden.",
        },
        {
          assumption: "Current average length of stay",
          value: `${inputs.current_average_length_of_stay.toFixed(
            Number.isInteger(inputs.current_average_length_of_stay) ? 0 : 1,
          )} days`,
          rationale:
            "Converts avoided admissions and better flow into avoided bed use and associated resource relief.",
        },
      ],
    },
    {
      title: "Effect assumptions",
      rows: [
        {
          assumption: "Reduction in admission rate",
          value: formatPercent(inputs.reduction_in_admission_rate),
          rationale:
            "Determines how much acute activity is avoided under the redesigned pathway.",
        },
        {
          assumption: "Reduction in follow-up contacts",
          value: formatPercent(inputs.reduction_in_follow_up_contacts),
          rationale:
            "Determines how much follow-up burden is reduced and therefore contributes to gross savings and operational relief.",
        },
        {
          assumption: "Reduction in length of stay",
          value: formatPercent(inputs.reduction_in_length_of_stay),
          rationale:
            "Captures whether the redesign also shortens inpatient use when admissions still occur.",
        },
        {
          assumption: "QALY gain per patient improved",
          value: inputs.qaly_gain_per_patient_improved.toFixed(2),
          rationale:
            "Determines how much health gain is attributed to each patient meaningfully improved by the redesign and therefore strongly influences cost per QALY.",
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
          assumption: "Annual effect decay",
          value: formatPercent(inputs.effect_decay_rate),
          rationale:
            "Represents how much of the redesign effect is assumed to fade over time.",
        },
        {
          assumption: "Annual participation drop-off",
          value: formatPercent(inputs.participation_dropoff_rate),
          rationale:
            "Captures erosion in implementation reach or operational persistence across the selected time horizon.",
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
      "At this stage, the case should still be treated as dependent on the core assumptions around pathway shift, admission reduction, follow-up reduction, and redesign cost.",
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
    "The case weakens fastest when the pathway shift is smaller than expected, admission or follow-up reductions are less pronounced, or redesign cost is higher than assumed.";

  return [line1, line2, line3];
}

function buildTopParameterDrivers(sensitivity: SensitivitySummary) {
  return sensitivity.top_drivers.slice(0, 3).map((driver, index) => ({
    label: `Driver ${index + 1}`,
    value: driver.label,
    note: `Largest ICER swing: ${formatCurrency(driver.swing)}`,
  }));
}

export function buildPathShiftReportData({
  inputs,
  results,
  uncertainty,
  sensitivity,
  exportedAt,
}: BuildReportArgs): PathShiftReportData {
  const interpretation = generateInterpretation(results, inputs, uncertainty);
  const overallSignal = generateOverallSignal(results, inputs, uncertainty);
  const structured = generateStructuredRecommendation(
    inputs,
    results,
    uncertainty,
  );
  const overview = generateOverviewSummary(results, inputs, uncertainty);

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

  const readiness = generateDecisionReadiness(inputs, results);
  const sensitivitySummary = buildSensitivitySummary(sensitivity);
  const topParameterDrivers = buildTopParameterDrivers(sensitivity);

  return {
    cover: {
      title: "PathShift scenario report",
      subtitle:
        "Exploratory health economic scenario brief for pathway redesign",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
      decisionStatus,
      signalLabel,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "PathShift is an exploratory health economic scenario model. It is designed to test whether redesigning a pathway could plausibly shift care into a lower-cost setting, reduce admissions and follow-up burden, lower bed use, and improve economic value under a specified set of assumptions before formal evaluation or business case development.",
    },

    executiveSummary: {
      overview,
      overallSignal,
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: `${structured.main_dependency}. Main driver: ${mainDriver}.`,
      mainFragility: structured.main_fragility,
      bestNextStep: structured.best_next_step,
    },

    scenario: buildScenarioSection(inputs),

    headlineMetrics: [
      {
        label: "Patients shifted",
        value: formatNumber(results.patients_shifted_total),
      },
      {
        label: "Admissions avoided",
        value: formatNumber(results.admissions_avoided_total),
      },
      {
        label: "Follow-ups avoided",
        value: formatNumber(results.follow_ups_avoided_total),
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
        note: `${formatNumber(row.patients_shifted_total)} patients shifted · ${row.decision_status}`,
      })),
      sensitivitySummary,
      topParameterDrivers,
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where the redesign can shift enough patients into a lower-cost setting, materially reduce admissions and follow-up burden, and do so at a delivery cost that remains proportionate to the benefit created.",
      strongestScenario:
        "The strongest scenario is typically the one where pathway shift is larger, redesign reach is stronger, and the redesign reduces both acute activity and follow-up burden without materially increasing delivery cost.",
      weakestScenario:
        "The weakest or most fragile scenario is typically the one where the pathway shift is smaller, redesign cost is higher, or the expected reductions in admission and follow-up activity are less pronounced.",
      comparatorSummary:
        "Comparator interpretation should focus on whether the current redesign offers a materially better pathway and economic signal than a more conservative alternative. If gains over comparator are modest, the case is more likely to require stronger local evidence before progression.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible pathway shift, an acceptable cost per QALY against threshold, and a decision signal that remains directionally positive under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local credibility of the assumed pathway shift and the extent to which that shift would translate into real reductions in admissions, follow-up burden, and bed use.",
      currentCasePosition: `At this stage the case looks ${signalLabel.toLowerCase()}. That should be treated as an early decision signal rather than a final answer.`,
      recommendedNextMove:
        readiness.validate_next[0] ??
        "Validate the highest-leverage local redesign assumptions before using the result in a decision conversation.",
    },

    caveats: {
      useNote: `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data, implementation realism, and validation work. ${uncertaintyReadout}`,
    },

    localEvidenceNeeded: {
      items: [
        "Local share of patients currently managed in higher-cost acute settings",
        "Local admission rate for the pathway population",
        "Local follow-up burden and cost per contact",
        "Realistic implementation reach in the intended operational setting",
        "Likely redesign cost per patient reached",
        "Local cost difference between acute and lower-cost care settings",
      ],
    },
  };
}