import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/clearpath/formatters";
import {
  assessUncertaintyRobustness,
  generateInterpretation,
  generateOverviewSummary,
  generateOverallSignal,
  generateStructuredRecommendation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/clearpath/summaries";
import type {
  Inputs,
  ModelResults,
  UncertaintyRow,
} from "@/lib/clearpath/types";

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
  title?: string;
  body: string;
};

export type ClearPathReportData = {
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

function getSignalLabel(decisionStatus: string): string {
  const normalised = decisionStatus.toLowerCase();

  if (
    normalised.includes("support") ||
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
  return `This run explores whether an earlier-diagnosis approach in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce downstream emergency pressure, admissions, bed use, and economic burden over ${inputs.time_horizon_years} years under the current assumptions.`;
}

function buildScenarioSection(inputs: Inputs): ClearPathReportData["scenario"] {
  return {
    interventionConcept: `The scenario tests an earlier-diagnosis improvement approach that aims to reach ${formatPercent(
      inputs.intervention_reach_rate,
    )} of the relevant population and reduce late diagnosis by ${formatPercent(
      inputs.achievable_reduction_in_late_diagnosis,
    )}. In practice, this could represent targeted case-finding, pathway redesign, earlier referral activity, or a structured diagnostic improvement programme.`,
    targetPopulationLogic: `The model assumes a baseline late diagnosis rate of ${formatPercent(
      inputs.current_late_diagnosis_rate,
    )} across ${formatNumber(
      inputs.annual_incident_cases,
    )} annual incident cases. The targeting mode is set to ${
      inputs.targeting_mode
    }, which affects how concentrated the opportunity is assumed to be within the population and therefore how much practical shift earlier might be achievable.`,
    economicMechanism: `The value mechanism runs through fewer emergency presentations, fewer downstream admissions, lower bed use, and a difference in treatment and outcome profile between earlier and later diagnosis. The model then assesses whether these effects are enough to offset programme costs and produce an acceptable cost per QALY against the selected threshold.`,
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
        results.cases_shifted_total,
      )} cases earlier over ${inputs.time_horizon_years} years.`,
    },
    {
      body: `That shift is associated with ${formatNumber(
        results.emergency_presentations_avoided_total,
      )} fewer emergency presentations, ${formatNumber(
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
      body: `Taken together, the current signal is ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the signal remains sensitive to the assumed size of the late-diagnosis shift, achievable reach, and delivery cost.`,
    },
  ];
}

function buildAssumptionSections(
  inputs: Inputs,
): ClearPathReportData["assumptions"]["sections"] {
  return [
    {
      title: "Core programme assumptions",
      rows: [
        {
          assumption: "Targeting mode",
          value: inputs.targeting_mode,
          rationale:
            "Determines how concentrated the opportunity is assumed to be and therefore how plausible it is to achieve meaningful pathway change in the selected population.",
        },
        {
          assumption: "Annual incident cases",
          value: formatNumber(inputs.annual_incident_cases),
          rationale:
            "Sets the scale of the addressable population and directly affects the size of any pathway and economic effect.",
        },
        {
          assumption: "Current late diagnosis rate",
          value: formatPercent(inputs.current_late_diagnosis_rate),
          rationale:
            "Defines the starting burden. Higher baseline late diagnosis creates more headroom for improvement.",
        },
        {
          assumption: "Achievable reduction in late diagnosis",
          value: formatPercent(inputs.achievable_reduction_in_late_diagnosis),
          rationale:
            "This is one of the most important value levers because it determines how much of the late-diagnosis burden can realistically be shifted earlier.",
        },
        {
          assumption: "Intervention reach",
          value: formatPercent(inputs.intervention_reach_rate),
          rationale:
            "Controls how much of the relevant population is effectively reached by the intervention in practice.",
        },
        {
          assumption: "Intervention cost per case reached",
          value: formatCurrency(inputs.intervention_cost_per_case_reached),
          rationale:
            "Acts as the main programme cost lever and has a direct influence on whether the case remains economically attractive.",
        },
        {
          assumption: "Time horizon",
          value: `${inputs.time_horizon_years} years`,
          rationale:
            "Longer horizons allow more downstream pathway and economic effects to accumulate, which can materially improve the observed value case.",
        },
      ],
    },
    {
      title: "Pathway assumptions",
      rows: [
        {
          assumption: "Emergency presentation rate, later diagnosis",
          value: formatPercent(inputs.late_emergency_presentation_rate),
          rationale:
            "Captures the level of acute pathway pressure associated with later diagnosis and therefore the potential for avoidable emergency activity.",
        },
        {
          assumption: "Emergency presentation rate, earlier diagnosis",
          value: formatPercent(inputs.early_emergency_presentation_rate),
          rationale:
            "Defines the counterfactual pathway profile once cases are shifted earlier.",
        },
        {
          assumption: "Admissions per emergency presentation",
          value: formatNumber(inputs.admissions_per_emergency_presentation),
          rationale:
            "Translates avoided emergency presentations into avoided downstream hospital activity.",
        },
        {
          assumption: "Average length of stay",
          value: formatNumber(inputs.average_length_of_stay),
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
          assumption: "Treatment cost, earlier diagnosis",
          value: formatCurrency(inputs.treatment_cost_early),
          rationale:
            "Represents the expected treatment cost profile when diagnosis occurs earlier.",
        },
        {
          assumption: "Treatment cost, later diagnosis",
          value: formatCurrency(inputs.treatment_cost_late),
          rationale:
            "Represents the expected treatment cost profile when diagnosis occurs later and influences the treatment cost differential.",
        },
        {
          assumption: "Cost per emergency admission",
          value: formatCurrency(inputs.cost_per_emergency_admission),
          rationale:
            "Monetises avoided acute admissions and is therefore a key contributor to gross savings.",
        },
        {
          assumption: "Cost per bed day",
          value: formatCurrency(inputs.cost_per_bed_day),
          rationale:
            "Monetises avoided bed use and reflects the downstream hospital resource effect of earlier diagnosis.",
        },
      ],
    },
    {
      title: "Outcome and persistence assumptions",
      rows: [
        {
          assumption: "QALY gain per case shifted earlier",
          value: formatNumber(inputs.qaly_gain_per_case_shifted),
          rationale:
            "Determines how much health gain is attributed to each case shifted earlier and therefore strongly influences cost per QALY.",
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

export function buildClearPathReportData({
  inputs,
  results,
  uncertainty,
  exportedAt,
}: BuildReportArgs): ClearPathReportData {
  const interpretation = generateInterpretation(results, inputs, uncertainty);
  const overallSignal = generateOverallSignal(results, inputs, uncertainty);
  const structured = generateStructuredRecommendation(inputs, results, uncertainty);
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

  const sensitivitySummary = [
    `The strength of the case is likely to move most when assumptions change around the achievable reduction in late diagnosis, intervention reach, intervention cost per case reached, and the size of downstream pathway benefit.`,
    `In practical terms, the result is strongest when the programme can reach the right population at manageable cost and produce a credible shift away from later diagnosis.`,
    `The case weakens when the assumed shift earlier is modest, delivery costs are higher than expected, or the emergency and bed-use benefits are less pronounced locally.`,
  ];

  return {
    cover: {
      title: "ClearPath scenario report",
      subtitle:
        "Exploratory health economic scenario brief for earlier diagnosis",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
      decisionStatus,
      signalLabel,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "ClearPath is an exploratory health economic scenario model. It is designed to test whether shifting a share of later diagnoses earlier could plausibly reduce downstream emergency pressure, admissions, bed use, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
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
        label: "Cases shifted earlier",
        value: formatNumber(results.cases_shifted_total),
      },
      {
        label: "Emergency presentations avoided",
        value: formatNumber(results.emergency_presentations_avoided_total),
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
        note: `${formatNumber(row.cases_shifted_total)} cases shifted earlier · ${row.decision_status}`,
      })),
      sensitivitySummary,
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where later diagnosis is sufficiently common, pathway consequences are materially worse for later diagnosis, and the intervention can reach the right population at a realistic delivery cost.",
      strongestScenario:
        "The strongest scenario is typically the one where reach is higher, the achievable shift earlier is larger, and downstream emergency pressure is more meaningfully reduced.",
      weakestScenario:
        "The weakest or most fragile scenario is typically the one where the achievable reduction in late diagnosis is smaller, costs are higher, or the downstream acute pathway benefit is less pronounced.",
      comparatorSummary:
        "Comparator interpretation should focus on whether the current configuration offers a materially better pathway and economic signal than a more conservative alternative. If gains over comparator are modest, the case is more likely to require stronger local evidence before progression.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible pathway effect, an acceptable cost per QALY against threshold, and a decision signal that remains directionally positive under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local credibility of the assumed shift away from later diagnosis and the extent to which that shift would translate into real emergency and inpatient benefit.",
      currentCasePosition: `At this stage the case looks ${signalLabel.toLowerCase()}. That should be treated as an early decision signal rather than a final answer.`,
      recommendedNextMove:
        "The next step should be to validate the key local pathway and implementation assumptions, especially late diagnosis burden, emergency presentation rates, realistic intervention reach, and likely delivery cost.",
    },

    caveats: {
      useNote: `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data, implementation realism, and validation work. ${uncertaintyReadout}`,
    },

    localEvidenceNeeded: {
      items: [
        "Local late diagnosis rate in the relevant population or pathway",
        "Local emergency presentation rate for later versus earlier diagnosis",
        "Local admissions and bed-use consequences of emergency presentation",
        "Realistic intervention reach in the intended operational setting",
        "Likely implementation cost per case reached",
        "Local treatment cost difference between earlier and later diagnosis",
      ],
    },
  };
}