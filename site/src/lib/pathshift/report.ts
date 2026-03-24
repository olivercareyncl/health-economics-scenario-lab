import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/pathshift/formatters";
import {
  assessUncertaintyRobustness,
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

function normaliseCurrencyString(value: string): string {
  return value.replace(/^£-/, "-£");
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

function buildPurposeQuestion(inputs: Inputs): string {
  return `This run explores whether a pathway redesign could plausibly shift patients into lower-cost care settings, reduce admissions, reduce follow-up burden, shorten length of stay, and improve economic value over ${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"} under the current assumptions.`;
}

function buildScenarioSection(inputs: Inputs): PathShiftReportData["scenario"] {
  return {
    interventionConcept: `The scenario tests a pathway redesign approach that aims to reach ${formatPercent(
      inputs.implementation_reach_rate,
    )} of the relevant population, shift ${formatPercent(
      inputs.proportion_shifted_to_lower_cost_setting,
    )} into a lower-cost setting, reduce admissions by ${formatPercent(
      inputs.reduction_in_admission_rate,
    )}, and reduce follow-up contacts by ${formatPercent(
      inputs.reduction_in_follow_up_contacts,
    )}. In practice, this could represent outpatient redesign, virtual follow-up, ambulatory pathways, community substitution, or a service model that reduces avoidable acute dependence.`,
    targetPopulationLogic: `The model assumes an annual cohort of ${formatNumber(
      inputs.annual_cohort_size,
    )} patients, with a current acute-managed rate of ${formatPercent(
      inputs.current_acute_managed_rate,
    )} and a current admission rate of ${formatPercent(
      inputs.current_admission_rate,
    )}. Pathway pressure and opportunity are then shaped by the interaction between baseline pathway mix, admission risk, redesign reach, and the degree of achievable pathway substitution.`,
    economicMechanism: `The value mechanism runs through shifting care into a lower-cost setting, reducing follow-up burden, reducing admissions, and reducing bed use. The model then assesses whether these effects are sufficient to offset redesign costs and produce an acceptable cost per QALY against the selected threshold.`,
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
      )} patients within the pathway over ${inputs.time_horizon_years} year${
        inputs.time_horizon_years === 1 ? "" : "s"
      }.`,
    },
    {
      body: `That redesign is associated with ${formatNumber(
        results.admissions_avoided_total,
      )} fewer admissions, ${formatNumber(
        results.follow_ups_avoided_total,
      )} fewer follow-up contacts, and ${formatNumber(
        results.bed_days_avoided_total,
      )} fewer bed days across the selected horizon.`,
    },
    {
      body: `${netCostLabel} is estimated at ${normaliseCurrencyString(
        formatCurrency(Math.abs(results.discounted_net_cost_total)),
      )}, with a discounted cost per QALY of ${normaliseCurrencyString(
        formatCurrency(results.discounted_cost_per_qaly),
      )} against a threshold of ${normaliseCurrencyString(
        formatCurrency(inputs.cost_effectiveness_threshold),
      )}.`,
    },
    {
      body: `Taken together, the current signal is ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the signal remains sensitive to the assumed pathway shift, achievable reduction in admissions and follow-up burden, and redesign delivery cost.`,
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
            "Determines how concentrated the opportunity is assumed to be and therefore how plausible it is to achieve meaningful pathway change in the selected population.",
        },
        {
          assumption: "Annual cohort size",
          value: formatNumber(inputs.annual_cohort_size),
          rationale:
            "Sets the scale of the addressable population and directly affects the size of any pathway and economic effect.",
        },
        {
          assumption: "Implementation reach rate",
          value: formatPercent(inputs.implementation_reach_rate),
          rationale:
            "Controls how much of the relevant population is effectively reached by the redesign in practice.",
        },
        {
          assumption: "Redesign cost per patient",
          value: normaliseCurrencyString(
            formatCurrency(inputs.redesign_cost_per_patient),
          ),
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
      title: "Pathway assumptions",
      rows: [
        {
          assumption: "Current acute-managed rate",
          value: formatPercent(inputs.current_acute_managed_rate),
          rationale:
            "Defines the baseline proportion of patients currently managed in a higher-cost setting and therefore the headroom for pathway substitution.",
        },
        {
          assumption: "Current admission rate",
          value: formatPercent(inputs.current_admission_rate),
          rationale:
            "Captures the baseline level of acute pressure in the pathway and the opportunity for avoidable admissions.",
        },
        {
          assumption: "Current follow-up contacts per patient",
          value: inputs.current_follow_up_contacts_per_patient.toFixed(1),
          rationale:
            "Defines the baseline follow-up burden and therefore the opportunity for reduced activity through redesign.",
        },
        {
          assumption: "Current average length of stay",
          value: `${inputs.current_average_length_of_stay.toFixed(
            Number.isInteger(inputs.current_average_length_of_stay) ? 0 : 1,
          )} days`,
          rationale:
            "Converts avoided admissions and in-hospital efficiency into avoided bed use and associated hospital pressure.",
        },
        {
          assumption: "Proportion shifted to lower-cost setting",
          value: formatPercent(inputs.proportion_shifted_to_lower_cost_setting),
          rationale:
            "Represents the core pathway substitution effect and is a major determinant of value.",
        },
        {
          assumption: "Reduction in admission rate",
          value: formatPercent(inputs.reduction_in_admission_rate),
          rationale:
            "Captures the degree to which the redesigned pathway reduces acute deterioration or escalation into admission.",
        },
        {
          assumption: "Reduction in follow-up contacts",
          value: formatPercent(inputs.reduction_in_follow_up_contacts),
          rationale:
            "Captures the extent to which the redesign reduces downstream contact burden and releases activity.",
        },
        {
          assumption: "Reduction in length of stay",
          value: formatPercent(inputs.reduction_in_length_of_stay),
          rationale:
            "Represents the degree to which patients still admitted spend less time in hospital under the redesigned pathway.",
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
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_effectiveness_threshold),
          ),
          rationale:
            "Provides the benchmark used to judge whether the modelled cost per QALY looks acceptable.",
        },
        {
          assumption: "Cost per acute-managed patient",
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_per_acute_managed_patient),
          ),
          rationale:
            "Defines the higher-cost comparator used in the pathway shift calculation.",
        },
        {
          assumption: "Cost per community-managed patient",
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_per_community_managed_patient),
          ),
          rationale:
            "Defines the lower-cost comparator used when patients are shifted into a redesigned pathway.",
        },
        {
          assumption: "Cost per follow-up contact",
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_per_follow_up_contact),
          ),
          rationale:
            "Monetises reduced follow-up activity and is therefore a contributor to gross savings.",
        },
        {
          assumption: "Cost per admission",
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_per_admission),
          ),
          rationale:
            "Monetises avoided acute admissions and is therefore a key contributor to gross savings.",
        },
        {
          assumption: "Cost per bed day",
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_per_bed_day),
          ),
          rationale:
            "Monetises avoided bed use and reflects the downstream hospital resource effect of redesign.",
        },
      ],
    },
    {
      title: "Outcome and persistence assumptions",
      rows: [
        {
          assumption: "QALY gain per patient improved",
          value: inputs.qaly_gain_per_patient_improved.toFixed(2),
          rationale:
            "Determines how much health gain is attributed to meaningful pathway improvement and therefore strongly influences cost per QALY.",
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
            "Captures erosion in implementation coverage or engagement across the selected time horizon.",
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

function buildSensitivitySummary(
  sensitivity: SensitivitySummary,
): string[] {
  const top = sensitivity.top_drivers;

  if (top.length === 0) {
    return [
      "One-way sensitivity has not highlighted a clear set of dominant drivers yet.",
      "At this stage, the case should still be treated as dependent on the core assumptions around pathway shift, admission reduction, follow-up reduction, and redesign cost.",
      "Further validation should focus on the most decision-relevant pathway, implementation, and cost inputs locally.",
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
    "The case weakens fastest when pathway shift is smaller than expected, redesign costs are higher, or downstream admission and follow-up benefits are less pronounced locally.";

  return [line1, line2, line3];
}

function buildTopDriverRows(
  sensitivity: SensitivitySummary,
): PathShiftReportData["uncertaintyAndSensitivity"]["topDrivers"] {
  return sensitivity.top_drivers.slice(0, 3).map((row, index) => ({
    label: `Driver ${index + 1}`,
    value: row.parameter_label,
    note: `ICER range: ${normaliseCurrencyString(
      formatCurrency(row.low_icer),
    )} to ${normaliseCurrencyString(formatCurrency(row.high_icer))}`,
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

  const sensitivitySummary = buildSensitivitySummary(sensitivity);

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
        "PathShift is an exploratory health economic scenario model. It is designed to test whether pathway redesign could plausibly shift care into lower-cost settings, reduce admissions, reduce follow-up burden, reduce bed use, and improve value under a specified set of assumptions before formal evaluation or business case development.",
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
        value: normaliseCurrencyString(
          formatCurrency(Math.abs(results.discounted_net_cost_total)),
        ),
      },
      {
        label: "Discounted cost per QALY",
        value: normaliseCurrencyString(
          formatCurrency(results.discounted_cost_per_qaly),
        ),
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
        value: normaliseCurrencyString(
          formatCurrency(row.discounted_cost_per_qaly),
        ),
        note: `${formatNumber(row.patients_shifted_total)} patients shifted · ${row.decision_status}`,
      })),
      sensitivitySummary,
      topDrivers: buildTopDriverRows(sensitivity),
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible pathway effect, an acceptable cost per QALY against threshold, and a decision signal that remains directionally positive under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local credibility of the assumed pathway shift and the extent to which that redesign would translate into real reductions in admissions, follow-up burden, and bed use.",
      currentCasePosition: `At this stage the case looks ${signalLabel.toLowerCase()}. That should be treated as an early decision signal rather than a final answer.`,
      recommendedNextMove:
        "The next step should be to validate the key local pathway and implementation assumptions, especially redesign reach, achievable pathway substitution, admission reduction, follow-up reduction, and likely delivery cost.",
    },

    caveats: {
      useNote: `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data, implementation realism, and validation work. ${uncertaintyReadout}`,
    },

    localEvidenceNeeded: {
      items: [
        "Local baseline pathway mix and acute-managed share",
        "Local admission rate in the pathway population",
        "Local follow-up burden per patient",
        "Realistic redesign reach in the intended operational setting",
        "Likely implementation cost per patient reached",
        "Local cost difference between acute-managed and lower-cost pathway settings",
      ],
    },
  };
}