import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/safestep/formatters";

export type SafeStepInputs = {
  targeting_mode: "Universal" | "Risk-targeted" | "High-risk only";
  costing_method: "Admission costs only" | "Admission + bed days";
  eligible_population: number;
  annual_fall_risk: number;
  intervention_cost_per_person: number;
  relative_risk_reduction: number;
  time_horizon_years: 1 | 3 | 5;
  uptake_rate: number;
  adherence_rate: number;
  participation_dropoff_rate: number;
  effect_decay_rate: number;
  admission_rate_after_fall: number;
  average_length_of_stay: number;
  cost_per_admission: number;
  cost_per_bed_day: number;
  qaly_loss_per_serious_fall: number;
  cost_effectiveness_threshold: number;
  discount_rate: number;
};

export type SafeStepYearlyResultRow = {
  year: number;
  falls_avoided: number;
  cumulative_programme_cost: number;
  cumulative_gross_savings: number;
};

export type SafeStepUncertaintyRow = {
  case: string;
  discounted_cost_per_qaly: number;
  falls_avoided_total: number;
  decision_status: string;
};

export type SafeStepModelResults = {
  falls_avoided_total: number;
  admissions_avoided_total: number;
  bed_days_avoided_total: number;
  discounted_programme_cost_total: number;
  discounted_gross_savings_total: number;
  discounted_net_cost_total: number;
  discounted_qalys_gained_total: number;
  discounted_cost_per_qaly: number;
  yearly_results: SafeStepYearlyResultRow[];
};

type BuildReportArgs = {
  inputs: SafeStepInputs;
  results: SafeStepModelResults;
  uncertainty: SafeStepUncertaintyRow[];
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

export type SafeStepReportData = {
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

function getDecisionStatus(
  results: SafeStepModelResults,
  threshold: number,
): string {
  if (results.discounted_net_cost_total < 0) {
    return "Appears cost-saving";
  }

  if (results.discounted_cost_per_qaly <= threshold) {
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

function getNetCostLabel(results: SafeStepModelResults) {
  return results.discounted_net_cost_total < 0 ? "Net saving" : "Net cost";
}

function getMainDriverText(inputs: SafeStepInputs) {
  const candidates = [
    {
      label: "annual fall risk",
      score: inputs.annual_fall_risk,
    },
    {
      label: "reduction in falls",
      score: inputs.relative_risk_reduction,
    },
    {
      label: "uptake and adherence",
      score: inputs.uptake_rate * inputs.adherence_rate,
    },
    {
      label: "cost per participant",
      score: inputs.intervention_cost_per_person / 1000,
    },
  ];

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.label ?? "the core programme assumptions";
}

function buildOverview(
  inputs: SafeStepInputs,
  results: SafeStepModelResults,
  decisionStatus: string,
) {
  const netCostLabel = getNetCostLabel(results);
  const signalLabel = getSignalLabel(decisionStatus).toLowerCase();

  return `This falls prevention scenario suggests that the programme could avoid ${formatNumber(
    results.falls_avoided_total,
  )} falls and ${formatNumber(
    results.admissions_avoided_total,
  )} admissions over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  }. ${netCostLabel} is estimated at ${formatCurrency(
    Math.abs(results.discounted_net_cost_total),
  )}, with a discounted cost per QALY of ${formatCurrency(
    results.discounted_cost_per_qaly,
  )}. Taken together, this points to a ${signalLabel} early-stage value case rather than a definitive conclusion.`;
}

function buildWhatModelSuggests(
  results: SafeStepModelResults,
  inputs: SafeStepInputs,
) {
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );

  if (decisionStatus === "Appears cost-saving") {
    return "The current base case suggests the programme could reduce falls and admissions while saving more than it costs.";
  }

  if (decisionStatus === "Appears cost-effective") {
    return "The current base case suggests the programme may represent reasonable value for money at the selected threshold, even if it does not generate a net saving.";
  }

  return "The current base case suggests operational benefit, but the economic case remains above the selected threshold and would need either stronger impact or lower delivery cost.";
}

function buildFragilityText(
  uncertainty: SafeStepUncertaintyRow[],
) {
  const low = uncertainty.find((row) => row.case === "Low");
  const high = uncertainty.find((row) => row.case === "High");

  if (!low || !high) {
    return "The result should be interpreted cautiously because bounded uncertainty has not been fully characterised.";
  }

  if (low.decision_status === high.decision_status) {
    return "The bounded uncertainty range is directionally stable, but the case still depends on realistic assumptions about effect persistence, uptake, and delivery cost.";
  }

  return "The bounded uncertainty range crosses decision boundaries, so modest changes in delivery realism or effect size could change the conclusion.";
}

function buildPurposeQuestion(inputs: SafeStepInputs) {
  return `This run explores whether a falls prevention programme in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce falls, admissions, bed use, and downstream economic burden over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  } under the current assumptions.`;
}

function buildScenarioSection(inputs: SafeStepInputs) {
  return {
    interventionConcept: `The scenario tests a falls prevention approach that aims to reach ${formatPercent(
      inputs.uptake_rate,
    )} of the eligible population, with ${formatPercent(
      inputs.adherence_rate,
    )} effective participation and a modelled reduction in falls of ${formatPercent(
      inputs.relative_risk_reduction,
    )}. In practice, this could represent strength and balance programmes, home-based prevention, multidisciplinary assessment, or targeted community falls services.`,
    targetPopulationLogic: `The model assumes an eligible population of ${formatNumber(
      inputs.eligible_population,
    )} with an annual fall risk of ${formatPercent(
      inputs.annual_fall_risk,
    )}. Targeting mode is set to ${inputs.targeting_mode}, which changes how concentrated risk is assumed to be within the intervention population and therefore how much value is likely to be concentrated in higher-risk groups.`,
    economicMechanism: `The value mechanism runs through avoided falls, avoided admissions, lower bed use, and preserved quality of life. The model then assesses whether these benefits are sufficient to offset intervention cost and generate an acceptable cost per QALY at the selected threshold.`,
  };
}

function buildPlainEnglishResults(
  inputs: SafeStepInputs,
  results: SafeStepModelResults,
  decisionStatus: string,
) {
  const netCostLabel = getNetCostLabel(results);

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
      body: decisionStatus === "Above current threshold"
        ? "Taken together, the current signal remains above the current threshold. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to effect size, participation, and delivery cost."
        : `Taken together, the current signal remains ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to effect size, participation, and delivery cost.`,
    },
  ];
}

function buildAssumptionSections(inputs: SafeStepInputs): ReportTableSection[] {
  return [
    {
      title: "Core programme assumptions",
      rows: [
        {
          assumption: "Targeting mode",
          value: inputs.targeting_mode,
          rationale:
            "Determines how concentrated risk is assumed to be in the intervention population and therefore how much value may be captured through targeting.",
        },
        {
          assumption: "Eligible population",
          value: formatNumber(inputs.eligible_population),
          rationale:
            "Defines the addressable scale of the programme and directly affects the size of any avoided activity and value.",
        },
        {
          assumption: "Annual fall risk",
          value: formatPercent(inputs.annual_fall_risk),
          rationale:
            "Sets the baseline burden. Higher underlying risk creates more room for avoided falls and admissions.",
        },
        {
          assumption: "Reduction in falls",
          value: formatPercent(inputs.relative_risk_reduction),
          rationale:
            "This is one of the most important value levers because it determines how much of the baseline burden is actually avoided.",
        },
        {
          assumption: "Cost per participant",
          value: formatCurrency(inputs.intervention_cost_per_person),
          rationale:
            "Acts as the main delivery cost lever and strongly influences whether the case remains economically attractive.",
        },
        {
          assumption: "Time horizon",
          value: `${inputs.time_horizon_years} year${
            inputs.time_horizon_years === 1 ? "" : "s"
          }`,
          rationale:
            "Longer horizons allow more programme benefit to accumulate and can materially improve the economic picture.",
        },
      ],
    },
    {
      title: "Delivery and persistence assumptions",
      rows: [
        {
          assumption: "Programme uptake",
          value: formatPercent(inputs.uptake_rate),
          rationale:
            "Controls how much of the eligible population actually enters the programme.",
        },
        {
          assumption: "Programme completion",
          value: formatPercent(inputs.adherence_rate),
          rationale:
            "Controls how much of the intended intervention effect is likely to be realised in practice.",
        },
        {
          assumption: "Annual participation drop-off",
          value: formatPercent(inputs.participation_dropoff_rate),
          rationale:
            "Represents erosion in engagement over time and reduces sustained impact.",
        },
        {
          assumption: "Annual effect decay",
          value: formatPercent(inputs.effect_decay_rate),
          rationale:
            "Represents how much of the intervention effect is assumed to fade year to year.",
        },
      ],
    },
    {
      title: "Pathway assumptions",
      rows: [
        {
          assumption: "Falls leading to admission",
          value: formatPercent(inputs.admission_rate_after_fall),
          rationale:
            "Translates avoided falls into avoided acute hospital activity.",
        },
        {
          assumption: "Average length of stay",
          value: `${Number(inputs.average_length_of_stay).toFixed(
            Number.isInteger(inputs.average_length_of_stay) ? 0 : 1,
          )} days`,
          rationale:
            "Converts avoided admissions into avoided bed use and downstream hospital pressure.",
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
          assumption: "Cost per admission",
          value: formatCurrency(inputs.cost_per_admission),
          rationale:
            "Monetises avoided acute admissions and is one of the main drivers of gross savings.",
        },
        {
          assumption: "Cost per bed day",
          value: formatCurrency(inputs.cost_per_bed_day),
          rationale:
            "Monetises avoided bed use where the costing method includes bed-day effects.",
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
          assumption: "QALY loss per serious fall",
          value: inputs.qaly_loss_per_serious_fall.toFixed(3),
          rationale:
            "Determines how much quality-of-life benefit is attributed to each serious fall avoided.",
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

export function buildSafeStepReportData({
  inputs,
  results,
  uncertainty,
  exportedAt,
}: BuildReportArgs): SafeStepReportData {
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const overallSignal = getSignalLabel(decisionStatus);
  const mainDriver = getMainDriverText(inputs);
  const fragilityText = buildFragilityText(uncertainty);

  return {
    cover: {
      title: "SafeStep scenario brief",
      subtitle: "Exploratory assessment of potential pathway and economic value",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "SafeStep is an exploratory health economic scenario model. It is designed to test whether falls prevention could plausibly reduce downstream admissions, bed use, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
    },

    executiveSummary: {
      overview: buildOverview(inputs, results, decisionStatus),
      overallSignal,
      whatModelSuggests: buildWhatModelSuggests(results, inputs),
      mainDependency: `The result is mainly driven by ${mainDriver}, delivery cost, and programme participation.`,
      mainFragility: fragilityText,
      bestNextStep:
        "Validate local fall risk, realistic programme participation, likely implementation cost, and the share of falls that genuinely translate into avoided admissions and bed use.",
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
        label: getNetCostLabel(results),
        value: formatCurrency(Math.abs(results.discounted_net_cost_total)),
      },
      {
        label: "Programme cost",
        value: formatCurrency(results.discounted_programme_cost_total),
      },
      {
        label: "Gross savings",
        value: formatCurrency(results.discounted_gross_savings_total),
      },
      {
        label: "Discounted cost per QALY",
        value: formatCurrency(results.discounted_cost_per_qaly),
      },
      {
        label: "QALYs gained",
        value: results.discounted_qalys_gained_total.toFixed(2),
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
        note: `${formatNumber(row.falls_avoided_total)} falls avoided · ${row.decision_status}`,
      })),
      sensitivitySummary: [
        "The result is most likely to move when assumptions change around fall risk, the achieved reduction in falls, effective programme participation, and delivery cost per participant.",
        "In practical terms, the case is strongest when the intervention reaches a population with meaningful baseline risk and delivers a credible reduction in falls at manageable cost.",
        "The case weakens when uptake or completion are lower than expected, when effect size is modest, or when avoided falls do not translate into meaningful avoided admissions and bed use.",
      ],
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where baseline fall risk is meaningful, admissions following falls are common enough to generate avoidable acute activity, and the intervention can be delivered at realistic cost.",
      strongestScenario:
        "The strongest scenario pattern is usually the one where the programme is targeted toward higher-risk groups, participation remains high, and the intervention effect on falls is sustained over time.",
      weakestScenario:
        "The weakest or most fragile scenario pattern is usually the one where the programme is delivered broadly at higher cost but with modest effect size or low sustained participation.",
      comparatorSummary:
        "Comparator interpretation should focus on whether targeted delivery materially improves value over broader deployment. If broad delivery adds cost without proportionate avoided admissions, a more focused model is likely to be stronger.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible avoided-falls effect, a plausible link to avoided admissions and bed use, and an acceptable cost per QALY under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local realism of the achieved reduction in falls and how strongly avoided falls translate into avoided acute activity and bed use.",
      recommendedNextMove:
        "The next step should be to validate local fall risk, the serious-fall pathway, realistic uptake and adherence, and the likely delivery cost of the intended intervention model.",
    },

    localEvidenceNeeded: {
      items: [
        "Local fall risk in the intended eligible population",
        "Local share of falls that lead to admission",
        "Average length of stay associated with serious falls",
        "Realistic intervention uptake and completion rates",
        "Likely implementation cost per participant",
        "Local estimate of quality-of-life loss associated with serious falls",
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