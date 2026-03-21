import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/pathshift/formatters";
import {
  generateInterpretation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/pathshift/summaries";
import type {
  Inputs,
  ModelResults,
  UncertaintyRow,
} from "@/lib/pathshift/types";

type BuildReportArgs = {
  inputs: Inputs;
  results: ModelResults;
  uncertainty: UncertaintyRow[];
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
  body: string;
};

export type PathShiftReportData = {
  cover: {
    title: string;
    subtitle: string;
    module: string;
    generatedAt: string;
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
    recommendedNextMove: string;
  };
  localEvidenceNeeded: {
    items: string[];
  };
  assumptions: {
    sections: ReportTableSection[];
  };
  caveats: {
    useNote: string;
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

function buildOverview(
  inputs: Inputs,
  results: ModelResults,
  decisionStatus: string,
) {
  const netCostLabel = getNetCostLabel(results);
  const signalLabel = getSignalLabel(decisionStatus).toLowerCase();

  return `This pathway redesign scenario suggests that the programme could shift ${formatNumber(
    results.patients_shifted_total,
  )} patients into a more efficient pathway, avoid ${formatNumber(
    results.admissions_avoided_total,
  )} admissions, and reduce ${formatNumber(
    results.follow_ups_avoided_total,
  )} follow-up contacts over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  }. ${netCostLabel} is estimated at ${formatCurrency(
    Math.abs(results.discounted_net_cost_total),
  )}, with a discounted cost per QALY of ${formatCurrency(
    results.discounted_cost_per_qaly,
  )}. Taken together, this points to a ${signalLabel} early-stage value case rather than a definitive conclusion.`;
}

function buildPurposeQuestion(inputs: Inputs) {
  return `This run explores whether pathway redesign in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly shift patients into lower-cost settings, reduce admissions, reduce follow-up burden, shorten bed use, and improve economic value over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  } under the current assumptions.`;
}

function buildScenarioSection(inputs: Inputs) {
  return {
    interventionConcept: `The scenario tests a pathway redesign approach that aims to reach ${formatPercent(
      inputs.implementation_reach_rate,
    )} of the eligible cohort at a redesign cost of ${formatCurrency(
      inputs.redesign_cost_per_patient,
    )} per patient. The model assumes ${formatPercent(
      inputs.proportion_shifted_to_lower_cost_setting,
    )} of reached patients are shifted into a lower-cost setting, with additional reductions in admissions, follow-up burden, and length of stay.`,
    targetPopulationLogic: `The model assumes an annual cohort of ${formatNumber(
      inputs.annual_cohort_size,
    )}, a current acute-managed rate of ${formatPercent(
      inputs.current_acute_managed_rate,
    )}, a current admission rate of ${formatPercent(
      inputs.current_admission_rate,
    )}, and ${Number(
      inputs.current_follow_up_contacts_per_patient,
    ).toFixed(
      Number.isInteger(inputs.current_follow_up_contacts_per_patient) ? 0 : 1,
    )} follow-up contacts per patient on average. Targeting mode is set to ${
      inputs.targeting_mode
    }, which affects how concentrated opportunity is assumed to be in the redesigned pathway.`,
    economicMechanism: `The value mechanism runs through shifting activity into lower-cost settings, reducing follow-up demand, lowering admissions, shortening length of stay, and improving patient outcomes. The model then assesses whether these effects are sufficient to offset redesign cost and produce an acceptable cost per QALY at the selected threshold.`,
  };
}

function buildPlainEnglishResults(
  inputs: Inputs,
  results: ModelResults,
  decisionStatus: string,
) {
  const netCostLabel = getNetCostLabel(results);

  return [
    {
      body: `Under the current assumptions, the model shifts ${formatNumber(
        results.patients_shifted_total,
      )} patients into a redesigned pathway over ${inputs.time_horizon_years} year${
        inputs.time_horizon_years === 1 ? "" : "s"
      }.`,
    },
    {
      body: `That redesign effect is associated with ${formatNumber(
        results.follow_ups_avoided_total,
      )} fewer follow-up contacts, ${formatNumber(
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
      body:
        decisionStatus === "Above current threshold"
          ? "Taken together, the current signal remains above the current threshold. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to implementation reach, pathway shift, effect size, and delivery cost."
          : `Taken together, the current signal remains ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to implementation reach, pathway shift, effect size, and delivery cost.`,
    },
  ];
}

function buildFragilityText(uncertainty: UncertaintyRow[]) {
  const low = uncertainty.find((row) => row.case === "Low");
  const high = uncertainty.find((row) => row.case === "High");

  if (!low || !high) {
    return "The result should be interpreted cautiously because bounded uncertainty has not been fully characterised.";
  }

  if (low.decision_status === high.decision_status) {
    return "The bounded uncertainty range is directionally stable, but the case still depends on realistic assumptions about reach, redesign effect, and delivery cost.";
  }

  return "The bounded uncertainty range crosses decision boundaries, so modest changes in redesign effect, implementation reach, or delivery realism could change the conclusion.";
}

function buildAssumptionSections(inputs: Inputs): ReportTableSection[] {
  return [
    {
      title: "Core programme assumptions",
      rows: [
        {
          assumption: "Targeting mode",
          value: inputs.targeting_mode,
          rationale:
            "Determines how concentrated pathway opportunity is assumed to be and therefore how much value may be captured through targeting.",
        },
        {
          assumption: "Annual cohort size",
          value: formatNumber(inputs.annual_cohort_size),
          rationale:
            "Defines the scale of the eligible population and directly affects the size of any operational and economic effect.",
        },
        {
          assumption: "Implementation reach",
          value: formatPercent(inputs.implementation_reach_rate),
          rationale:
            "Controls how much of the pathway is effectively reached by the redesign in practice.",
        },
        {
          assumption: "Redesign cost per patient",
          value: formatCurrency(inputs.redesign_cost_per_patient),
          rationale:
            "Acts as the main delivery cost lever and strongly influences whether the case remains economically attractive.",
        },
        {
          assumption: "Time horizon",
          value: `${inputs.time_horizon_years} year${
            inputs.time_horizon_years === 1 ? "" : "s"
          }`,
          rationale:
            "Longer horizons allow more downstream benefit to accumulate and can materially improve the case.",
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
            "Sets the baseline share of care currently delivered in more resource-intensive settings.",
        },
        {
          assumption: "Current admission rate",
          value: formatPercent(inputs.current_admission_rate),
          rationale:
            "Defines the baseline acute admission burden associated with the current pathway.",
        },
        {
          assumption: "Current follow-up contacts per patient",
          value: Number(inputs.current_follow_up_contacts_per_patient).toFixed(
            Number.isInteger(inputs.current_follow_up_contacts_per_patient)
              ? 0
              : 1,
          ),
          rationale:
            "Defines the baseline ongoing follow-up burden that redesign may reduce.",
        },
        {
          assumption: "Current average length of stay",
          value: `${Number(inputs.current_average_length_of_stay).toFixed(
            Number.isInteger(inputs.current_average_length_of_stay) ? 0 : 1,
          )} days`,
          rationale:
            "Converts avoided admissions and shorter stays into avoided bed use and operational pressure.",
        },
      ],
    },
    {
      title: "Effect and persistence assumptions",
      rows: [
        {
          assumption: "Proportion shifted to lower-cost setting",
          value: formatPercent(inputs.proportion_shifted_to_lower_cost_setting),
          rationale:
            "This is one of the main value levers because it determines how much pathway activity is shifted into a lower-cost setting.",
        },
        {
          assumption: "Reduction in admission rate",
          value: formatPercent(inputs.reduction_in_admission_rate),
          rationale:
            "Translates redesign into reduced acute hospital activity.",
        },
        {
          assumption: "Reduction in follow-up contacts",
          value: formatPercent(inputs.reduction_in_follow_up_contacts),
          rationale:
            "Determines how much ongoing follow-up burden is reduced by pathway redesign.",
        },
        {
          assumption: "Reduction in length of stay",
          value: formatPercent(inputs.reduction_in_length_of_stay),
          rationale:
            "Determines the scale of bed-day reduction once admissions occur.",
        },
        {
          assumption: "Annual effect decay",
          value: formatPercent(inputs.effect_decay_rate),
          rationale:
            "Represents how quickly redesign benefit weakens over time.",
        },
        {
          assumption: "Annual participation drop-off",
          value: formatPercent(inputs.participation_dropoff_rate),
          rationale:
            "Represents erosion in effective reach or pathway adherence over time.",
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
            "Defines how avoided activity is monetised and therefore changes the scale of reported savings.",
        },
        {
          assumption: "Cost per acute-managed patient",
          value: formatCurrency(inputs.cost_per_acute_managed_patient),
          rationale:
            "Monetises activity managed in more resource-intensive settings and contributes to pathway-shift savings.",
        },
        {
          assumption: "Cost per community-managed patient",
          value: formatCurrency(inputs.cost_per_community_managed_patient),
          rationale:
            "Defines the lower-cost alternative setting and therefore the value of successful pathway shift.",
        },
        {
          assumption: "Cost per follow-up contact",
          value: formatCurrency(inputs.cost_per_follow_up_contact),
          rationale:
            "Monetises avoided follow-up activity and contributes to operational savings.",
        },
        {
          assumption: "Cost per admission",
          value: formatCurrency(inputs.cost_per_admission),
          rationale:
            "Monetises avoided admissions and is a core driver of economic value.",
        },
        {
          assumption: "Cost per bed day",
          value: formatCurrency(inputs.cost_per_bed_day),
          rationale:
            "Monetises avoided bed use and reflects the operational value of shorter or avoided stays.",
        },
        {
          assumption: "Cost-effectiveness threshold",
          value: formatCurrency(inputs.cost_effectiveness_threshold),
          rationale:
            "Provides the benchmark used to judge whether the modelled cost per QALY looks acceptable.",
        },
      ],
    },
    {
      title: "Outcome assumptions",
      rows: [
        {
          assumption: "QALY gain per patient improved",
          value: inputs.qaly_gain_per_patient_improved.toFixed(3),
          rationale:
            "Determines how much health gain is attributed to each patient improved and therefore strongly influences cost per QALY.",
        },
        {
          assumption: "Discount rate",
          value: `${(inputs.discount_rate * 100).toFixed(1)}%`,
          rationale:
            "Adjusts future costs and benefits into present-value terms and therefore affects the reported economic signal.",
        },
      ],
    },
  ];
}

export function buildPathShiftReportData({
  inputs,
  results,
  uncertainty,
  exportedAt,
}: BuildReportArgs): PathShiftReportData {
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const overallSignal = getSignalLabel(decisionStatus);
  const interpretation = generateInterpretation(results, inputs, uncertainty);
  const mainDriver = getMainDriverText(inputs);
  const fragilityText = buildFragilityText(uncertainty);

  return {
    cover: {
      title: "PathShift scenario brief",
      subtitle: "Exploratory assessment of potential pathway and economic value",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "PathShift is an exploratory health economic scenario model. It is designed to test whether pathway redesign could plausibly reduce activity in higher-cost settings, admissions, follow-up burden, bed use, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
    },

    executiveSummary: {
      overview: buildOverview(inputs, results, decisionStatus),
      overallSignal,
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: `The result is mainly driven by ${mainDriver}, implementation reach, and redesign cost.`,
      mainFragility: interpretation.what_looks_fragile ?? fragilityText,
      bestNextStep: interpretation.what_to_validate_next,
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
        label: getNetCostLabel(results),
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
        label: "Break-even cost per patient",
        value: formatCurrency(results.break_even_cost_per_patient),
      },
    ],

    plainEnglishResults: buildPlainEnglishResults(
      inputs,
      results,
      decisionStatus,
    ),

    uncertaintyAndSensitivity: {
      robustnessSummary: fragilityText,
      uncertaintyRows: uncertainty.map((row) => ({
        label: row.case,
        value: formatCurrency(row.discounted_cost_per_qaly),
        note: `${formatNumber(row.patients_shifted_total)} patients shifted · ${row.decision_status}`,
      })),
      sensitivitySummary: [
        "The result is most likely to move when assumptions change around implementation reach, the proportion shifted to lower-cost settings, admission reduction, and redesign cost per patient.",
        "In practical terms, the case is strongest when redesign reaches a meaningful share of the pathway, successfully shifts care into lower-cost settings, and reduces avoidable admissions and follow-up burden.",
        "The case weakens when reach is modest, pathway shift is smaller than expected, or delivery cost is too high relative to the operational gains achieved.",
      ],
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where current pathway delivery is resource-intensive enough to create room for lower-cost substitution, and where redesign has enough reach and persistence to change both activity and downstream hospital burden.",
      strongestScenario:
        "The strongest scenario pattern is usually the one where a meaningful share of patients are shifted into lower-cost settings, follow-up burden is reduced, and admissions fall alongside shorter inpatient stays.",
      weakestScenario:
        "The weakest or most fragile scenario pattern is usually the one where redesign cost is high, implementation reach is modest, or pathway shift is too small to produce meaningful downstream savings.",
      comparatorSummary:
        "Comparator interpretation should focus on whether the selected redesign model materially improves pathway efficiency relative to a more conservative alternative. If gains over comparator are modest, stronger local evidence is likely to be needed before progression.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible pathway shift effect, a plausible link to reduced follow-up and admission activity, and an acceptable cost per QALY under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local realism of the assumed pathway shift and how strongly redesign translates into fewer follow-ups, fewer admissions, and lower bed use.",
      recommendedNextMove:
        "The next step should be to validate local pathway volumes, realistic redesign reach, achievable setting shift, expected follow-up reduction, and likely delivery cost for the intended service model.",
    },

    localEvidenceNeeded: {
      items: [
        "Local annual pathway cohort size in the intended target population",
        "Local share of care currently managed in acute settings",
        "Local admission rate associated with the current pathway",
        "Current follow-up burden per patient",
        "Current average length of stay for relevant admissions",
        "Realistic implementation reach for the intended redesign model",
      ],
    },

    assumptions: {
      sections: buildAssumptionSections(inputs),
    },

    caveats: {
      useNote:
        "This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data, implementation realism, and validation work.",
    },
  };
}