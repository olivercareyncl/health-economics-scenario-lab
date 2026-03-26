
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/safestep/formatters";
import type {
  ModelResult as SafeStepModelResults,
  SafeStepInputs,
  SensitivitySummary as SafeStepSensitivitySummary,
  UncertaintyRow as SafeStepUncertaintyRow,
} from "@/lib/safestep/types";
import {
  generateInterpretation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/safestep/summaries";

type BuildReportArgs = {
  inputs: SafeStepInputs;
  results: SafeStepModelResults;
  uncertainty: SafeStepUncertaintyRow[];
  exportedAt: string;
  oneWaySensitivity: SafeStepSensitivitySummary;
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

type ReportSensitivityDriver = {
  rank?: number;
  label: string;
  lowCase?: string;
  highCase?: string;
  swing?: string;
  note?: string;
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
    topSensitivityDrivers: ReportSensitivityDriver[];
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

function cleanDecisionStatus(status: string): string {
  const trimmed = status.trim();
  if (/^appears\s+/i.test(trimmed)) return trimmed;
  return `Appears ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

function prettifyParameterName(parameter: keyof SafeStepInputs | string): string {
  switch (parameter) {
    case "annual_fall_risk":
      return "Annual fall risk";
    case "relative_risk_reduction":
      return "Reduction in falls";
    case "intervention_cost_per_person":
      return "Cost per participant";
    case "uptake_rate":
      return "Programme uptake";
    case "adherence_rate":
      return "Programme completion";
    case "admission_rate_after_fall":
      return "Falls leading to admission";
    case "average_length_of_stay":
      return "Average length of stay";
    case "qaly_loss_per_serious_fall":
      return "QALY loss per serious fall";
    case "effect_decay_rate":
      return "Annual effect decay";
    case "participation_dropoff_rate":
      return "Annual participation drop-off";
    case "cost_per_admission":
      return "Cost per admission";
    case "cost_per_bed_day":
      return "Cost per bed day";
    case "eligible_population":
      return "Eligible population";
    case "target_population_multiplier":
      return "Target population multiplier";
    case "target_uptake_multiplier":
      return "Target uptake multiplier";
    case "target_fall_risk_multiplier":
      return "Target fall-risk multiplier";
    default:
      return String(parameter)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

function buildTopSensitivityDrivers(
  rows: SafeStepSensitivitySummary["rows"],
): ReportSensitivityDriver[] {
  if (!rows.length) return [];

  return [...rows]
    .sort((a, b) => b.max_abs_icer_change - a.max_abs_icer_change)
    .slice(0, 3)
    .map((row, index) => ({
      rank: index + 1,
      label: row.parameter_label || prettifyParameterName(row.parameter_key),
      lowCase: `${row.low_value_label} → ${normaliseCurrencyString(
        formatCurrency(row.low_icer),
      )}`,
      highCase: `${row.high_value_label} → ${normaliseCurrencyString(
        formatCurrency(row.high_icer),
      )}`,
      swing: normaliseCurrencyString(formatCurrency(row.max_abs_icer_change)),
      note:
        "Low and high cases show how discounted cost per QALY changes when this parameter is varied in one direction at a time.",
    }));
}

function buildSensitivityLead(
  topSensitivityDrivers: ReportSensitivityDriver[],
  fallback: string,
): string {
  if (!topSensitivityDrivers.length) return fallback;

  const labels = topSensitivityDrivers.map((driver) => driver.label.toLowerCase());

  if (labels.length === 1) {
    return `The result is most sensitive to ${labels[0]}.`;
  }

  if (labels.length === 2) {
    return `The result is most sensitive to ${labels[0]} and ${labels[1]}.`;
  }

  return `The result is most sensitive to ${labels[0]}, ${labels[1]}, and ${labels[2]}.`;
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
  }. ${netCostLabel} is estimated at ${normaliseCurrencyString(
    formatCurrency(Math.abs(results.discounted_net_cost_total)),
  )}, with a discounted cost per QALY of ${normaliseCurrencyString(
    formatCurrency(results.discounted_cost_per_qaly),
  )}. Taken together, this points to a ${signalLabel} early-stage value case rather than a definitive conclusion.`;
}

function buildPurposeQuestion(inputs: SafeStepInputs) {
  return `This run explores whether a falls prevention programme could plausibly reduce falls, admissions, bed use, and downstream economic burden over ${inputs.time_horizon_years} year${
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
    )}. Opportunity is then shaped by the targeting approach assumptions: a population multiplier of ${inputs.target_population_multiplier.toFixed(
      2,
    )}, an uptake multiplier of ${inputs.target_uptake_multiplier.toFixed(
      2,
    )}, and a fall-risk multiplier of ${inputs.target_fall_risk_multiplier.toFixed(
      2,
    )}. These determine how concentrated risk and achievable reach are assumed to be in the selected subgroup.`,
    economicMechanism: `The value mechanism runs through avoided falls, avoided admissions, lower bed use, and preserved quality of life. The model then assesses whether these benefits are sufficient to offset intervention cost and generate an acceptable cost per QALY at the selected threshold.`,
  };
}

function buildFragilityText(
  interpretation: ReturnType<typeof generateInterpretation>,
  uncertainty: SafeStepUncertaintyRow[],
  topSensitivityDrivers: ReportSensitivityDriver[],
) {
  const low = uncertainty.find((row) => row.case === "Low");
  const high = uncertainty.find((row) => row.case === "High");

  if (!low || !high) {
    return "The result should be interpreted cautiously because bounded uncertainty has not been fully characterised.";
  }

  if (low.decision_status !== high.decision_status) {
    if (topSensitivityDrivers.length > 0) {
      const labels = topSensitivityDrivers
        .slice(0, 3)
        .map((driver) => driver.label.toLowerCase());

      return `The bounded uncertainty range crosses decision categories, and one-way sensitivity suggests the result is particularly exposed to ${labels.join(
        ", ",
      )}.`;
    }

    return "The bounded uncertainty range crosses decision boundaries, so modest changes in delivery realism or effect size could change the conclusion.";
  }

  if (topSensitivityDrivers.length > 0) {
    return `The bounded range is more stable, but the result still moves most when ${topSensitivityDrivers[0].label.toLowerCase()} is varied.`;
  }

  return interpretation.what_looks_fragile;
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
      body: `${netCostLabel} is estimated at ${normaliseCurrencyString(
        formatCurrency(Math.abs(results.discounted_net_cost_total)),
      )}, with a discounted cost per QALY of ${normaliseCurrencyString(
        formatCurrency(results.discounted_cost_per_qaly),
      )} against a threshold of ${normaliseCurrencyString(
        formatCurrency(inputs.cost_effectiveness_threshold),
      )}.`,
    },
    {
      body: `Taken together, the current signal is ${cleanDecisionStatus(
        decisionStatus,
      ).toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to effect size, participation, targeting concentration, and delivery cost.`,
    },
  ];
}

function buildAssumptionSections(inputs: SafeStepInputs): ReportTableSection[] {
  return [
    {
      title: "Core programme assumptions",
      rows: [
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
          value: normaliseCurrencyString(
            formatCurrency(inputs.intervention_cost_per_person),
          ),
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
      title: "Targeting approach assumptions",
      rows: [
        {
          assumption: "Target population multiplier",
          value: inputs.target_population_multiplier.toFixed(2),
          rationale:
            "Adjusts how much of the baseline eligible population is assumed to sit inside the targeted subgroup or delivery focus.",
        },
        {
          assumption: "Target uptake multiplier",
          value: inputs.target_uptake_multiplier.toFixed(2),
          rationale:
            "Adjusts expected uptake to reflect whether a more focused approach improves practical reach among the intended population.",
        },
        {
          assumption: "Target fall-risk multiplier",
          value: inputs.target_fall_risk_multiplier.toFixed(2),
          rationale:
            "Adjusts baseline fall risk to reflect whether the intervention is being focused toward a population with more concentrated underlying risk.",
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
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_per_admission),
          ),
          rationale:
            "Monetises avoided acute admissions and is one of the main drivers of gross savings.",
        },
        {
          assumption: "Cost per bed day",
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_per_bed_day),
          ),
          rationale:
            "Monetises avoided bed use where the costing method includes bed-day effects.",
        },
        {
          assumption: "Cost-effectiveness threshold",
          value: normaliseCurrencyString(
            formatCurrency(inputs.cost_effectiveness_threshold),
          ),
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
  oneWaySensitivity,
}: BuildReportArgs): SafeStepReportData {
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );

  const interpretation = generateInterpretation(
    results,
    inputs,
    uncertainty,
    oneWaySensitivity,
  );

  const overallSignal = getSignalLabel(decisionStatus);
  const fallbackMainDriver = getMainDriverText(inputs);

  const sensitivityRows = oneWaySensitivity?.rows;
  const topSensitivityDrivers = buildTopSensitivityDrivers(sensitivityRows);

  const fragilityText = buildFragilityText(
    interpretation,
    uncertainty,
    topSensitivityDrivers,
  );

  const mainDependencyText =
    oneWaySensitivity?.primary_driver != null
      ? buildSensitivityLead(
          topSensitivityDrivers,
          `The result is mainly driven by ${fallbackMainDriver}, effective participation, targeting concentration, and delivery cost.`,
        )
      : `The result is mainly driven by ${fallbackMainDriver}, effective participation, targeting concentration, and delivery cost.`;

  const primaryDriverLabel =
    oneWaySensitivity?.primary_driver?.parameter_label?.toLowerCase();

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
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: mainDependencyText,
      mainFragility: fragilityText,
      bestNextStep:
        primaryDriverLabel != null
          ? `Validate local ${primaryDriverLabel}, realistic programme participation, likely implementation cost, and the share of falls that genuinely translate into avoided admissions and bed use.`
          : "Validate local fall risk, realistic programme participation, likely implementation cost, and the share of falls that genuinely translate into avoided admissions and bed use.",
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
        value: normaliseCurrencyString(
          formatCurrency(Math.abs(results.discounted_net_cost_total)),
        ),
      },
      {
        label: "Programme cost",
        value: normaliseCurrencyString(
          formatCurrency(results.discounted_programme_cost_total),
        ),
      },
      {
        label: "Gross savings",
        value: normaliseCurrencyString(
          formatCurrency(results.discounted_gross_savings_total),
        ),
      },
      {
        label: "Discounted cost per QALY",
        value: normaliseCurrencyString(
          formatCurrency(results.discounted_cost_per_qaly),
        ),
      },
      {
        label: "QALYs gained",
        value: results.discounted_qalys_total.toFixed(2),
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
        value: normaliseCurrencyString(
          formatCurrency(row.discounted_cost_per_qaly),
        ),
        note: `${formatNumber(row.falls_avoided_total)} falls avoided · ${row.decision_status}`,
      })),
      sensitivitySummary:
        topSensitivityDrivers.length > 0
          ? [
              `The one-way sensitivity analysis suggests the result moves most when ${topSensitivityDrivers[0].label.toLowerCase()} is varied${
                topSensitivityDrivers[1]
                  ? `, followed by ${topSensitivityDrivers[1].label.toLowerCase()}`
                  : ""
              }${
                topSensitivityDrivers[2]
                  ? ` and ${topSensitivityDrivers[2].label.toLowerCase()}`
                  : ""
              }.`,
              "In practical terms, the case is strongest when the intervention reaches a population with meaningful baseline risk and delivers a credible reduction in falls at manageable cost.",
              "The case weakens when uptake or completion are lower than expected, when effect size is modest, or when avoided falls do not translate into meaningful avoided admissions and bed use.",
            ]
          : [
              "The result is most likely to move when assumptions change around fall risk, the achieved reduction in falls, effective programme participation, targeting concentration, and delivery cost per participant.",
              "In practical terms, the case is strongest when the intervention reaches a population with meaningful baseline risk and delivers a credible reduction in falls at manageable cost.",
              "The case weakens when uptake or completion are lower than expected, when effect size is modest, or when avoided falls do not translate into meaningful avoided admissions and bed use.",
            ],
      topSensitivityDrivers,
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible avoided-falls effect, a plausible link to avoided admissions and bed use, and an acceptable cost per QALY under bounded uncertainty.",
      mainEvidenceGap:
        topSensitivityDrivers.length > 0
          ? `The most important evidence gap is the local realism of ${topSensitivityDrivers[0].label.toLowerCase()}${
              topSensitivityDrivers[1]
                ? `, alongside ${topSensitivityDrivers[1].label.toLowerCase()}`
                : ""
            }.`
          : "The most important evidence gap is usually the local realism of the achieved reduction in falls and how strongly avoided falls translate into avoided acute activity and bed use.",
      recommendedNextMove:
        "The next step should be to validate local fall risk, the serious-fall pathway, realistic uptake and adherence, the targeting assumptions, and the likely delivery cost of the intended intervention model.",
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
