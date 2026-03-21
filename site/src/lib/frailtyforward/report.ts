import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/frailtyforward/formatters";
import {
  generateInterpretation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/frailtyforward/summaries";
import type {
  Inputs,
  ModelResults,
  UncertaintyRow,
} from "@/lib/frailtyforward/types";

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

export type FrailtyForwardReportData = {
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

  return `This frailty support scenario suggests that the programme could stabilise ${formatNumber(
    results.patients_stabilised_total,
  )} patients, avoid ${formatNumber(
    results.crisis_events_avoided_total,
  )} crisis events, and avoid ${formatNumber(
    results.admissions_avoided_total,
  )} admissions over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  }. ${netCostLabel} is estimated at ${formatCurrency(
    Math.abs(results.discounted_net_cost_total),
  )}, with a discounted cost per QALY of ${formatCurrency(
    results.discounted_cost_per_qaly,
  )}. Taken together, this points to a ${signalLabel} early-stage value case rather than a definitive conclusion.`;
}

function buildPurposeQuestion(inputs: Inputs) {
  return `This run explores whether earlier frailty support in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce crisis events, non-elective admissions, bed use, and downstream economic burden over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  } under the current assumptions.`;
}

function buildScenarioSection(inputs: Inputs) {
  return {
    interventionConcept: `The scenario tests an earlier frailty support approach that aims to reach ${formatPercent(
      inputs.implementation_reach_rate,
    )} of the eligible frailty cohort at a delivery cost of ${formatCurrency(
      inputs.support_cost_per_patient,
    )} per patient. In practice, this could represent proactive frailty identification, multidisciplinary review, care coordination, community support, or targeted admission avoidance activity.`,
    targetPopulationLogic: `The model assumes an annual frailty cohort of ${formatNumber(
      inputs.annual_frailty_cohort_size,
    )} with a baseline crisis event rate of ${formatPercent(
      inputs.baseline_crisis_event_rate,
    )}, a baseline non-elective admission rate of ${formatPercent(
      inputs.baseline_non_elective_admission_rate,
    )}, and a current average length of stay of ${Number(
      inputs.current_average_length_of_stay,
    ).toFixed(Number.isInteger(inputs.current_average_length_of_stay) ? 0 : 1)} days. Targeting mode is set to ${
      inputs.targeting_mode
    }, which affects how concentrated risk is assumed to be in the supported population.`,
    economicMechanism: `The value mechanism runs through stabilising patients earlier, reducing crisis events, lowering non-elective admissions, shortening bed use, and improving quality of life. The model then assesses whether these benefits are sufficient to offset delivery cost and produce an acceptable cost per QALY at the selected threshold.`,
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
      body: `Under the current assumptions, the model stabilises ${formatNumber(
        results.patients_stabilised_total,
      )} patients over ${inputs.time_horizon_years} year${
        inputs.time_horizon_years === 1 ? "" : "s"
      }.`,
    },
    {
      body: `That support effect is associated with ${formatNumber(
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
      body:
        decisionStatus === "Above current threshold"
          ? "Taken together, the current signal remains above the current threshold. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to reach, effect size, persistence, and delivery cost."
          : `Taken together, the current signal remains ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to reach, effect size, persistence, and delivery cost.`,
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
    return "The bounded uncertainty range is directionally stable, but the case still depends on realistic assumptions about reach, persistence, and delivery cost.";
  }

  return "The bounded uncertainty range crosses decision boundaries, so modest changes in effect size, reach, or delivery realism could change the conclusion.";
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
            "Determines how concentrated need is assumed to be in the supported population and therefore how much value may be captured through targeting.",
        },
        {
          assumption: "Annual frailty cohort size",
          value: formatNumber(inputs.annual_frailty_cohort_size),
          rationale:
            "Defines the scale of the eligible population and directly affects the size of any operational and economic effect.",
        },
        {
          assumption: "Implementation reach",
          value: formatPercent(inputs.implementation_reach_rate),
          rationale:
            "Controls how much of the frailty cohort is effectively reached by the programme in practice.",
        },
        {
          assumption: "Support cost per patient",
          value: formatCurrency(inputs.support_cost_per_patient),
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
      title: "Baseline risk assumptions",
      rows: [
        {
          assumption: "Baseline crisis event rate",
          value: formatPercent(inputs.baseline_crisis_event_rate),
          rationale:
            "Sets the baseline deterioration burden and therefore the headroom for preventable crisis activity.",
        },
        {
          assumption: "Baseline non-elective admission rate",
          value: formatPercent(inputs.baseline_non_elective_admission_rate),
          rationale:
            "Defines the baseline acute admission burden associated with frailty.",
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
          assumption: "Reduction in crisis event rate",
          value: formatPercent(inputs.reduction_in_crisis_event_rate),
          rationale:
            "This is one of the main value levers because it determines how much crisis activity is reduced through proactive support.",
        },
        {
          assumption: "Reduction in admission rate",
          value: formatPercent(inputs.reduction_in_admission_rate),
          rationale:
            "Translates stabilisation and crisis prevention into reduced acute hospital activity.",
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
            "Represents how quickly programme benefit weakens over time.",
        },
        {
          assumption: "Annual participation drop-off",
          value: formatPercent(inputs.participation_dropoff_rate),
          rationale:
            "Represents erosion in effective reach or continued engagement over time.",
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
          assumption: "Cost per crisis event",
          value: formatCurrency(inputs.cost_per_crisis_event),
          rationale:
            "Monetises avoided crisis activity and is an important contributor to gross savings.",
        },
        {
          assumption: "Cost per admission",
          value: formatCurrency(inputs.cost_per_admission),
          rationale:
            "Monetises avoided non-elective admissions and is a core driver of economic value.",
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
          assumption: "QALY gain per patient stabilised",
          value: inputs.qaly_gain_per_patient_stabilised.toFixed(3),
          rationale:
            "Determines how much health gain is attributed to each patient stabilised and therefore strongly influences cost per QALY.",
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

export function buildFrailtyForwardReportData({
  inputs,
  results,
  uncertainty,
  exportedAt,
}: BuildReportArgs): FrailtyForwardReportData {
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
      title: "FrailtyForward scenario brief",
      subtitle: "Exploratory assessment of potential pathway and economic value",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "FrailtyForward is an exploratory health economic scenario model. It is designed to test whether earlier frailty support could plausibly reduce crisis events, admissions, bed use, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
    },

    executiveSummary: {
      overview: buildOverview(inputs, results, decisionStatus),
      overallSignal,
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: `The result is mainly driven by ${mainDriver}, implementation reach, and delivery cost.`,
      mainFragility: interpretation.what_looks_fragile ?? fragilityText,
      bestNextStep: interpretation.what_to_validate_next,
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
        note: `${formatNumber(row.patients_stabilised_total)} patients stabilised · ${row.decision_status}`,
      })),
      sensitivitySummary: [
        "The result is most likely to move when assumptions change around implementation reach, the reduction in crisis events, the reduction in admissions, and support cost per patient.",
        "In practical terms, the case is strongest when the programme reaches a sufficiently high-risk frailty cohort, stabilises patients early enough to reduce deterioration, and can be delivered at manageable cost.",
        "The case weakens when reach is modest, effect decays quickly, or reduced crisis activity does not translate into meaningful avoided admissions and bed use.",
      ],
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where frailty-related deterioration is common enough to generate avoidable crisis activity and hospital use, and where earlier support is delivered with enough reach and persistence to change that trajectory.",
      strongestScenario:
        "The strongest scenario pattern is usually the one where crisis prevention is meaningful, admission reduction follows, and support is delivered with high reach and sustained effect.",
      weakestScenario:
        "The weakest or most fragile scenario pattern is usually the one where delivery cost is high, implementation reach is modest, or the effect on crisis events and admissions is too small to shift downstream hospital burden.",
      comparatorSummary:
        "Comparator interpretation should focus on whether the selected support model materially improves stabilisation and avoided acute activity relative to a more conservative alternative. If gains over comparator are modest, stronger local evidence is likely to be needed before progression.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible stabilisation effect, a plausible link to reduced crisis and admission activity, and an acceptable cost per QALY under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local realism of the assumed support effect and how strongly earlier frailty support translates into fewer crisis events, fewer admissions, and lower bed use.",
      recommendedNextMove:
        "The next step should be to validate local frailty cohort size, crisis risk, realistic implementation reach, achievable support effect, and likely delivery cost for the intended service model.",
    },

    localEvidenceNeeded: {
      items: [
        "Local frailty cohort size in the intended target population",
        "Local crisis or deterioration event rate",
        "Local non-elective admission rate associated with frailty",
        "Current average length of stay for the relevant admissions",
        "Realistic implementation reach for the intended support model",
        "Likely delivery cost per supported patient",
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