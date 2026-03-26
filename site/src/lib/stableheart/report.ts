import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/stableheart/formatters";
import {
  assessUncertaintyRobustness,
  generateInterpretation,
  generateOverviewSummary,
  generateOverallSignal,
  generateStructuredRecommendation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/stableheart/summaries";
import type {
  Inputs,
  ModelResults,
  SensitivitySummary,
  UncertaintyRow,
} from "@/lib/stableheart/types";

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

export type StableHeartReportData = {
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
    topDriverRows: Array<{
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
    normalised.includes("finely balanced")
  ) {
    return "Borderline";
  }

  return "Weak";
}

function buildPurposeQuestion(inputs: Inputs): string {
  return `This run explores whether proactive cardiovascular management in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce recurrent cardiovascular events, admissions, bed use, and downstream economic burden over ${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"} under the current assumptions.`;
}

function buildScenarioSection(inputs: Inputs): StableHeartReportData["scenario"] {
  return {
    interventionConcept: `The scenario tests a proactive cardiovascular management approach that aims to reach ${formatPercent(
      inputs.intervention_reach_rate,
    )} of the eligible population, sustain meaningful engagement in ${formatPercent(
      inputs.sustained_engagement_rate,
    )} of those reached, and reduce recurrent cardiovascular events by ${formatPercent(
      inputs.risk_reduction_in_recurrent_events,
    )}. In practice, this could represent nurse-led review, medication optimisation, adherence support, remote monitoring, or structured secondary prevention follow-up.`,
    targetPopulationLogic: `The model assumes an eligible population of ${formatNumber(
      inputs.eligible_population,
    )} with a baseline recurrent event rate of ${formatPercent(
      inputs.baseline_recurrent_event_rate,
    )}. The targeting mode is set to ${
      inputs.targeting_mode
    }, which affects how concentrated risk is assumed to be in the intervention population and therefore how strongly value may accumulate in higher-risk groups.`,
    economicMechanism: `The value mechanism runs through avoided recurrent cardiovascular events, fewer admissions, lower bed use, and preserved quality of life. The model then assesses whether these effects are sufficient to offset programme cost and produce an acceptable cost per QALY against the selected threshold.`,
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
      body: `Taken together, the current signal is ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to baseline event risk, sustained engagement, achieved effect size, and delivery cost realism.`,
    },
  ];
}

function buildAssumptionSections(
  inputs: Inputs,
): StableHeartReportData["assumptions"]["sections"] {
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
          value: `${inputs.average_length_of_stay.toFixed(
            Number.isInteger(inputs.average_length_of_stay) ? 0 : 1,
          )} days`,
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
      "At this stage, the case should still be treated as dependent on the core assumptions around baseline risk, achieved effect, engagement, and delivery cost.",
      "Further validation should focus on the most decision-relevant pathway and cost inputs locally.",
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
    "The case weakens fastest when baseline risk is lower than expected, effect size is smaller, sustained engagement is weaker, or delivery becomes more expensive.";

  return [line1, line2, line3];
}

function buildTopDriverRows(
  sensitivity: SensitivitySummary,
): Array<{ label: string; value: string; note: string }> {
  return sensitivity.top_drivers.slice(0, 3).map((driver, index) => ({
    label: `Driver ${index + 1}`,
    value: driver.parameter_label,
    note: `Largest ICER swing: ${formatCurrency(driver.max_abs_icer_change)}`,
  }));
}

export function buildStableHeartReportData({
  inputs,
  results,
  uncertainty,
  sensitivity,
  exportedAt,
}: BuildReportArgs): StableHeartReportData {
  const interpretation = generateInterpretation(
    results,
    inputs,
    uncertainty,
    sensitivity,
  );
  const overallSignal = generateOverallSignal(results, inputs, uncertainty);
  const structured = generateStructuredRecommendation(
    inputs,
    results,
    uncertainty,
    sensitivity,
  );
  const overview = generateOverviewSummary(
    results,
    inputs,
    uncertainty,
    sensitivity,
  );

  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );

  const signalLabel = getSignalLabel(decisionStatus);
  const netCostLabel = getNetCostLabel(results);
  const mainDriver = getMainDriverText(inputs, sensitivity);

  const uncertaintyReadout = assessUncertaintyRobustness(
    uncertainty,
    inputs.cost_effectiveness_threshold,
  );

  const sensitivitySummary = buildSensitivitySummary(sensitivity);
  const topDriverRows = buildTopDriverRows(sensitivity);

  return {
    cover: {
      title: "StableHeart scenario report",
      subtitle:
        "Exploratory health economic scenario brief for proactive cardiovascular management",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
      decisionStatus,
      signalLabel,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "StableHeart is an exploratory health economic scenario model. It is designed to test whether proactive cardiovascular management could plausibly reduce recurrent events, admissions, bed use, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
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
        label: "Patients reached",
        value: formatNumber(results.patients_reached_total),
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
        note: `${formatNumber(row.events_avoided_total)} events avoided · ${row.decision_status}`,
      })),
      sensitivitySummary,
      topDriverRows,
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where recurrent cardiovascular risk is meaningful, admissions following recurrent events are common enough to generate avoidable hospital activity, and the intervention can be delivered at realistic cost.",
      strongestScenario:
        "The strongest scenario is typically the one where risk is concentrated in a higher-opportunity population, engagement remains high, and the reduction in recurrent events is sustained over time.",
      weakestScenario:
        "The weakest or most fragile scenario is typically the one where delivery cost is higher, sustained engagement is lower, and the achieved reduction in recurrent events is modest.",
      comparatorSummary:
        "Comparator interpretation should focus on whether a more targeted delivery model would materially improve value relative to broader deployment. If broader delivery adds cost without proportionate avoided admissions, a more focused model is likely to be stronger.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible avoided-event effect, a plausible link to avoided admissions and bed use, and a decision signal that remains directionally positive under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local realism of the achieved reduction in recurrent cardiovascular events and the extent to which avoided events translate into real admission and bed-use benefit.",
      currentCasePosition: `At this stage the case looks ${signalLabel.toLowerCase()}. That should be treated as an early decision signal rather than a final answer.`,
      recommendedNextMove:
        "The next step should be to validate local recurrent event risk, admission probability, sustained engagement, and the likely delivery cost of the intended proactive management model.",
    },

    caveats: {
      useNote: `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data, implementation realism, and validation work. ${uncertaintyReadout}`,
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
  };
}