import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/stableheart/formatters";
import type {
  Inputs as StableHeartInputs,
  ModelResults as StableHeartModelResults,
  UncertaintyRow as StableHeartUncertaintyRow,
} from "@/lib/stableheart/types";
import {
  generateInterpretation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/stableheart/summaries";

type BuildReportArgs = {
  inputs: StableHeartInputs;
  results: StableHeartModelResults;
  uncertainty: StableHeartUncertaintyRow[];
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

export type StableHeartReportData = {
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
  inputs: StableHeartInputs,
  results: StableHeartModelResults,
  decisionStatus: string,
) {
  const netCostLabel = getNetCostLabel(results);
  const signalLabel = getSignalLabel(decisionStatus).toLowerCase();

  return `This cardiovascular management scenario suggests that the programme could avoid ${formatNumber(
    results.events_avoided_total,
  )} recurrent cardiovascular events and ${formatNumber(
    results.admissions_avoided_total,
  )} admissions over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  }. ${netCostLabel} is estimated at ${formatCurrency(
    Math.abs(results.discounted_net_cost_total),
  )}, with a discounted cost per QALY of ${formatCurrency(
    results.discounted_cost_per_qaly,
  )}. Taken together, this points to a ${signalLabel} early-stage value case rather than a definitive conclusion.`;
}

function buildPurposeQuestion(inputs: StableHeartInputs) {
  return `This run explores whether proactive cardiovascular management in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce recurrent events, admissions, bed use, and downstream economic burden over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  } under the current assumptions.`;
}

function buildScenarioSection(inputs: StableHeartInputs) {
  return {
    interventionConcept: `The scenario tests a proactive cardiovascular management approach that aims to reach ${formatPercent(
      inputs.intervention_reach_rate,
    )} of the eligible population, sustain meaningful engagement in ${formatPercent(
      inputs.sustained_engagement_rate,
    )} of those reached, and achieve a modelled reduction in recurrent cardiovascular events of ${formatPercent(
      inputs.risk_reduction_in_recurrent_events,
    )}. In practice, this could represent nurse-led review, medication optimisation, adherence support, remote monitoring, or structured secondary prevention follow-up.`,
    targetPopulationLogic: `The model assumes an eligible population of ${formatNumber(
      inputs.eligible_population,
    )} with a baseline recurrent event rate of ${formatPercent(
      inputs.baseline_recurrent_event_rate,
    )}. Targeting mode is set to ${inputs.targeting_mode}, which changes how risk is concentrated within the intervention population and therefore how strongly value is likely to accumulate in higher-risk groups.`,
    economicMechanism: `The value mechanism runs through avoided recurrent cardiovascular events, fewer admissions, lower bed use, and preserved quality of life. The model then tests whether these benefits are sufficient to offset programme cost and generate an acceptable cost per QALY at the selected threshold.`,
  };
}

function buildFragilityText(
  interpretation: ReturnType<typeof generateInterpretation>,
  uncertainty: StableHeartUncertaintyRow[],
) {
  const low = uncertainty.find((row) => row.case === "Low");
  const high = uncertainty.find((row) => row.case === "High");

  if (!low || !high) {
    return "The result should be interpreted cautiously because bounded uncertainty has not been fully characterised.";
  }

  if (low.decision_status !== high.decision_status) {
    return "The bounded uncertainty range crosses decision categories, so moderate changes in baseline risk, achieved effect, or delivery cost could change the conclusion.";
  }

  return interpretation.what_looks_fragile;
}

function buildPlainEnglishResults(
  inputs: StableHeartInputs,
  results: StableHeartModelResults,
  decisionStatus: string,
) {
  const netCostLabel = getNetCostLabel(results);

  return [
    {
      body: `Under the current assumptions, the model avoids ${formatNumber(
        results.events_avoided_total,
      )} recurrent cardiovascular events over ${inputs.time_horizon_years} year${
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
      body: `Taken together, the current signal remains ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to baseline event risk, sustained engagement, and delivery cost realism.`,
    },
  ];
}

function buildAssumptionSections(
  inputs: StableHeartInputs,
): ReportTableSection[] {
  return [
    {
      title: "Core programme assumptions",
      rows: [
        {
          assumption: "Targeting mode",
          value: inputs.targeting_mode,
          rationale:
            "Determines how concentrated cardiovascular risk is assumed to be in the intervention population and therefore how much value may be captured through targeting.",
        },
        {
          assumption: "Eligible population",
          value: formatNumber(inputs.eligible_population),
          rationale:
            "Defines the addressable scale of the programme and directly affects the size of avoided events and downstream value.",
        },
        {
          assumption: "Intervention reach",
          value: formatPercent(inputs.intervention_reach_rate),
          rationale:
            "Controls how much of the intended population actually receives the intervention.",
        },
        {
          assumption: "Sustained engagement",
          value: formatPercent(inputs.sustained_engagement_rate),
          rationale:
            "Controls how much of the reached population is assumed to realise sustained benefit in practice.",
        },
        {
          assumption: "Risk reduction in recurrent events",
          value: formatPercent(inputs.risk_reduction_in_recurrent_events),
          rationale:
            "This is one of the main value levers because it determines how much of the recurrent event burden is actually avoided.",
        },
        {
          assumption: "Intervention cost per patient",
          value: formatCurrency(inputs.intervention_cost_per_patient_reached),
          rationale:
            "Acts as the main delivery cost lever and strongly influences whether the case remains economically attractive.",
        },
        {
          assumption: "Time horizon",
          value: `${inputs.time_horizon_years} year${
            inputs.time_horizon_years === 1 ? "" : "s"
          }`,
          rationale:
            "Longer horizons allow more benefit to accumulate and can materially improve the economic picture.",
        },
      ],
    },
    {
      title: "Baseline risk and pathway assumptions",
      rows: [
        {
          assumption: "Baseline recurrent event rate",
          value: formatPercent(inputs.baseline_recurrent_event_rate),
          rationale:
            "Sets the underlying cardiovascular burden. Higher baseline risk creates more room for avoided events and admissions.",
        },
        {
          assumption: "Admission probability per event",
          value: formatPercent(inputs.admission_probability_per_event),
          rationale:
            "Translates avoided events into avoided hospital admissions and is a key driver of gross savings.",
        },
        {
          assumption: "Average length of stay",
          value: `${formatNumber(inputs.average_length_of_stay)} days`,
          rationale:
            "Converts avoided admissions into avoided bed use and additional hospital value.",
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
            "Defines how avoided impact is monetised and therefore changes the scale of reported savings.",
        },
        {
          assumption: "Cost per cardiovascular event",
          value: formatCurrency(inputs.cost_per_cardiovascular_event),
          rationale:
            "Monetises avoided cardiovascular events where included in the current costing view.",
        },
        {
          assumption: "Cost per admission",
          value: formatCurrency(inputs.cost_per_admission),
          rationale:
            "Monetises avoided admissions and is one of the main drivers of gross savings.",
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
      title: "Persistence and outcome assumptions",
      rows: [
        {
          assumption: "Annual effect decay",
          value: formatPercent(inputs.annual_effect_decay_rate),
          rationale:
            "Represents how much of the intervention effect is assumed to fade year to year.",
        },
        {
          assumption: "Annual participation drop-off",
          value: formatPercent(inputs.annual_participation_dropoff_rate),
          rationale:
            "Represents erosion in sustained participation over time and reduces long-run benefit.",
        },
        {
          assumption: "QALY gain per event avoided",
          value: inputs.qaly_gain_per_event_avoided.toFixed(3),
          rationale:
            "Determines how much quality-of-life benefit is attributed to each avoided recurrent event.",
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

export function buildStableHeartReportData({
  inputs,
  results,
  uncertainty,
  exportedAt,
}: BuildReportArgs): StableHeartReportData {
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const interpretation = generateInterpretation(results, inputs, uncertainty);
  const overallSignal = getSignalLabel(decisionStatus);
  const mainDriver = getMainDriverText(inputs);
  const fragilityText = buildFragilityText(interpretation, uncertainty);

  return {
    cover: {
      title: "StableHeart scenario brief",
      subtitle:
        "Exploratory assessment of potential pathway and economic value",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "StableHeart is an exploratory health economic scenario model. It is designed to test whether proactive cardiovascular management could plausibly reduce recurrent events, admissions, bed use, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
    },

    executiveSummary: {
      overview: buildOverview(inputs, results, decisionStatus),
      overallSignal,
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: `The result is mainly driven by ${mainDriver}, delivery cost, and the realism of sustained patient engagement.`,
      mainFragility: fragilityText,
      bestNextStep:
        "Validate local recurrent event risk, realistic engagement, likely implementation cost, and the strength of the link between avoided events and avoided admissions and bed use.",
    },

    scenario: buildScenarioSection(inputs),

    headlineMetrics: [
      {
        label: "Events avoided",
        value: formatNumber(results.events_avoided_total),
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
        value: formatCurrency(results.programme_cost_total),
      },
      {
        label: "Gross savings",
        value: formatCurrency(results.gross_savings_total),
      },
      {
        label: "Discounted cost per QALY",
        value: formatCurrency(results.discounted_cost_per_qaly),
      },
      {
        label: "Patients reached",
        value: formatNumber(results.patients_reached_total),
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
        note: `${formatNumber(row.events_avoided_total)} events avoided · ${row.decision_status}`,
      })),
      sensitivitySummary: [
        "The result is most likely to move when assumptions change around baseline recurrent event risk, the achieved reduction in recurrent events, sustained engagement, and delivery cost per patient.",
        "In practical terms, the case is strongest when the programme reaches a population with meaningful baseline risk and sustains a credible reduction in recurrent events at manageable cost.",
        "The case weakens when sustained engagement is lower than expected, when effect size is modest, or when avoided events do not translate into meaningful avoided admissions and bed use.",
      ],
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where recurrent cardiovascular risk is meaningful, admissions following recurrent events are common enough to generate avoidable hospital activity, and the intervention can be delivered at realistic cost.",
      strongestScenario:
        "The strongest scenario pattern is usually the one where the programme is focused on secondary prevention or higher-risk groups, engagement remains high, and the effect on recurrent events is sustained over time.",
      weakestScenario:
        "The weakest or most fragile scenario pattern is usually the one where the programme is delivered broadly at higher cost but with modest effect size or low sustained engagement.",
      comparatorSummary:
        "Comparator interpretation should focus on whether more targeted delivery materially improves value over broader deployment. If broad delivery adds cost without proportionate avoided admissions, a more focused model is likely to be stronger.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible avoided-event effect, a plausible link to avoided admissions and bed use, and an acceptable cost per QALY under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local realism of the achieved reduction in recurrent cardiovascular events and how strongly those avoided events translate into avoided hospital activity.",
      recommendedNextMove:
        "The next step should be to validate local recurrent event risk, admission probability, sustained engagement, and the likely delivery cost of the intended proactive management model.",
    },

    localEvidenceNeeded: {
      items: [
        "Local recurrent cardiovascular event risk in the intended population",
        "Local share of recurrent events that lead to admission",
        "Average length of stay associated with admitted recurrent events",
        "Realistic intervention reach and sustained engagement rates",
        "Likely implementation cost per patient reached",
        "Local estimate of quality-of-life gain associated with avoided recurrent events",
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