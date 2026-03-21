import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/waitwise/formatters";
import type {
  Inputs,
  ModelResults,
  UncertaintyRow,
} from "@/lib/waitwise/types";

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

export type WaitWiseReportData = {
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

function getDecisionStatus(results: ModelResults, threshold: number): string {
  if (results.discounted_net_cost_total < 0) {
    return "Appears cost-saving";
  }

  if (
    results.discounted_cost_per_qaly > 0 &&
    results.discounted_cost_per_qaly <= threshold
  ) {
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

function getNetCostLabel(results: ModelResults) {
  return results.discounted_net_cost_total < 0 ? "Net saving" : "Net cost";
}

function deriveCaseLabel(inputs: Inputs, selectedPreset?: string) {
  if (selectedPreset === "High-risk targeted") {
    return "Targeted high-risk case";
  }
  if (selectedPreset === "Throughput-led improvement") {
    return "Throughput-led case";
  }
  if (selectedPreset === "Escalation-led improvement") {
    return "Escalation-led case";
  }
  if (inputs.targeting_mode !== "Broad waiting list") {
    return "Targeted operational improvement case";
  }
  if (
    inputs.throughput_increase_effect >
      inputs.demand_reduction_effect + 0.03 &&
    inputs.throughput_increase_effect >
      inputs.escalation_reduction_effect + 0.03
  ) {
    return "Throughput-led case";
  }
  if (
    inputs.escalation_reduction_effect >
      inputs.demand_reduction_effect + 0.03 &&
    inputs.escalation_reduction_effect >
      inputs.throughput_increase_effect + 0.03
  ) {
    return "Escalation-led case";
  }
  if (
    inputs.demand_reduction_effect >
      inputs.throughput_increase_effect + 0.03 &&
    inputs.demand_reduction_effect >
      inputs.escalation_reduction_effect + 0.03
  ) {
    return "Demand-led case";
  }
  return "Broad operational improvement case";
}

function getMainDriverText(inputs: Inputs) {
  if (inputs.targeting_mode !== "Broad waiting list") {
    return "targeting and concentration of escalation risk";
  }
  if (inputs.costing_method === "Combined illustrative view") {
    return "the costing method and blend of effects";
  }
  if (inputs.intervention_cost_per_patient_reached >= 250) {
    return "delivery cost per patient reached";
  }
  if (
    inputs.throughput_increase_effect >= inputs.demand_reduction_effect &&
    inputs.throughput_increase_effect >= inputs.escalation_reduction_effect
  ) {
    return "throughput improvement";
  }
  if (
    inputs.demand_reduction_effect >= inputs.throughput_increase_effect &&
    inputs.demand_reduction_effect >= inputs.escalation_reduction_effect
  ) {
    return "demand reduction";
  }
  if (inputs.participation_dropoff_rate >= 0.15) {
    return "participation persistence over time";
  }
  return "escalation reduction while waiting";
}

function assessUncertaintyRobustness(
  uncertaintyRows: UncertaintyRow[],
  threshold: number,
) {
  const allBelow = uncertaintyRows.every(
    (row) => row.discounted_cost_per_qaly <= threshold,
  );
  const allCostSaving = uncertaintyRows.every(
    (row) => row.discounted_net_cost_total < 0,
  );
  const anyBelow = uncertaintyRows.some(
    (row) => row.discounted_cost_per_qaly <= threshold,
  );

  if (allCostSaving) {
    return "The case stays cost-saving across the bounded cases.";
  }
  if (allBelow) {
    return "The case stays below threshold across the bounded cases.";
  }
  if (anyBelow) {
    return "The bounded range crosses the threshold, so the case looks sensitive.";
  }
  return "The bounded range stays above the threshold.";
}

function generateInterpretation(
  results: ModelResults,
  inputs: Inputs,
  uncertaintyRows: UncertaintyRow[],
) {
  const threshold = inputs.cost_effectiveness_threshold;
  const horizon = inputs.time_horizon_years;
  const breakEvenHorizon = results.break_even_horizon;
  const uncertaintyText = assessUncertaintyRobustness(
    uncertaintyRows,
    threshold,
  );
  const dependency = getMainDriverText(inputs);

  const whatModelSuggests =
    results.discounted_net_cost_total < 0
      ? `The current case suggests backlog reduction with a discounted net saving over ${horizon} year${horizon === 1 ? "" : "s"}.`
      : results.discounted_cost_per_qaly > 0 &&
          results.discounted_cost_per_qaly <= threshold
        ? `The current case suggests operational benefit and a cost-effective result over ${horizon} year${horizon === 1 ? "" : "s"}, but not a net saving.`
        : `The current case suggests operational benefit, but the economic result stays above the current threshold over ${horizon} year${horizon === 1 ? "" : "s"}.`;

  const whatDrivesResult = `The result is mainly shaped by ${dependency}, alongside reach, targeting, and whether the effect holds over time.`;

  const whatLooksFragile =
    inputs.costing_method === "Combined illustrative view"
      ? "The result may look stronger than reality if overlapping cost components are counted together."
      : inputs.targeting_mode === "Broad waiting list"
        ? "Broad implementation may dilute value if the highest-opportunity patients are only a subset of the list."
        : uncertaintyText;

  const whatToValidateNext = `Validate local cost inputs, escalation risk, and whether the case still looks worthwhile over about ${breakEvenHorizon}.`;

  return {
    what_model_suggests: whatModelSuggests,
    what_drives_result: whatDrivesResult,
    what_looks_fragile: whatLooksFragile,
    what_to_validate_next: whatToValidateNext,
  };
}

function buildOverview(inputs: Inputs, results: ModelResults, decisionStatus: string) {
  const netCostLabel = getNetCostLabel(results);
  const signalLabel = getSignalLabel(decisionStatus).toLowerCase();

  return `This waiting list intervention scenario suggests that the programme could reduce backlog by ${formatNumber(
    results.waiting_list_reduction_total,
  )}, avoid ${formatNumber(
    results.escalations_avoided_total,
  )} escalations, and avoid ${formatNumber(
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
  return `This run explores whether waiting list intervention in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce backlog pressure, escalations, admissions, bed use, and downstream economic burden over ${inputs.time_horizon_years} year${
    inputs.time_horizon_years === 1 ? "" : "s"
  } under the current assumptions.`;
}

function buildScenarioSection(inputs: Inputs) {
  return {
    interventionConcept: `The scenario tests a waiting list intervention that aims to reach ${formatPercent(
      inputs.intervention_reach_rate,
    )} of the eligible population at a delivery cost of ${formatCurrency(
      inputs.intervention_cost_per_patient_reached,
    )} per patient reached. The model assumes combined effects through demand reduction, throughput improvement, and escalation reduction while waiting.`,
    targetPopulationLogic: `The model assumes a starting waiting list of ${formatNumber(
      inputs.starting_waiting_list_size,
    )}, monthly inflow of ${formatNumber(
      inputs.monthly_inflow,
    )}, and baseline monthly throughput of ${formatNumber(
      inputs.baseline_monthly_throughput,
    )}. Targeting mode is set to ${inputs.targeting_mode}, which changes how concentrated escalation risk and potential value are assumed to be within the list.`,
    economicMechanism: `The value mechanism runs through lower waiting list pressure, fewer escalations, fewer admissions, reduced bed use, and preserved quality of life. The model then assesses whether these benefits are sufficient to offset intervention cost and generate an acceptable cost per QALY at the selected threshold.`,
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
      body: `Under the current assumptions, the model reduces waiting list pressure by ${formatNumber(
        results.waiting_list_reduction_total,
      )} over ${inputs.time_horizon_years} year${
        inputs.time_horizon_years === 1 ? "" : "s"
      }.`,
    },
    {
      body: `That change is associated with ${formatNumber(
        results.escalations_avoided_total,
      )} fewer escalations, ${formatNumber(
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
          ? "Taken together, the current signal remains above the current threshold. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to reach, effect size, persistence, and cost assumptions."
          : `Taken together, the current signal remains ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the case remains sensitive to reach, effect size, persistence, and cost assumptions.`,
    },
  ];
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
            "Determines how concentrated opportunity and escalation risk are assumed to be within the waiting list.",
        },
        {
          assumption: "Starting waiting list",
          value: formatNumber(inputs.starting_waiting_list_size),
          rationale:
            "Defines the baseline backlog size and therefore the potential scale of operational improvement.",
        },
        {
          assumption: "Intervention reach",
          value: formatPercent(inputs.intervention_reach_rate),
          rationale:
            "Controls how much of the list is effectively reached by the intervention.",
        },
        {
          assumption: "Cost per patient reached",
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
            "Longer horizons allow more backlog and escalation benefit to accumulate and can materially improve the economic picture.",
        },
      ],
    },
    {
      title: "Flow and delivery assumptions",
      rows: [
        {
          assumption: "Monthly inflow",
          value: formatNumber(inputs.monthly_inflow),
          rationale:
            "Defines how much new demand enters the list and therefore how hard it is to improve backlog performance.",
        },
        {
          assumption: "Baseline monthly throughput",
          value: formatNumber(inputs.baseline_monthly_throughput),
          rationale:
            "Defines the service’s baseline processing capacity before intervention.",
        },
        {
          assumption: "Demand reduction effect",
          value: formatPercent(inputs.demand_reduction_effect),
          rationale:
            "Represents how much intervention reduces new demand entering the pathway.",
        },
        {
          assumption: "Throughput increase effect",
          value: formatPercent(inputs.throughput_increase_effect),
          rationale:
            "Represents how much intervention improves processing flow through the list.",
        },
        {
          assumption: "Annual effect decay",
          value: formatPercent(inputs.effect_decay_rate),
          rationale:
            "Represents how quickly intervention effect is assumed to weaken over time.",
        },
        {
          assumption: "Annual participation drop-off",
          value: formatPercent(inputs.participation_dropoff_rate),
          rationale:
            "Represents erosion in effective reach or engagement over time.",
        },
      ],
    },
    {
      title: "Escalation and pathway assumptions",
      rows: [
        {
          assumption: "Escalation reduction effect",
          value: formatPercent(inputs.escalation_reduction_effect),
          rationale:
            "This is one of the main value levers because it determines how much deterioration while waiting is avoided.",
        },
        {
          assumption: "Monthly escalation rate",
          value: formatPercent(inputs.monthly_escalation_rate),
          rationale:
            "Sets the baseline deterioration risk while patients remain on the list.",
        },
        {
          assumption: "Admission rate after escalation",
          value: formatPercent(inputs.admission_rate_after_escalation),
          rationale:
            "Translates avoided escalations into avoided acute hospital activity.",
        },
        {
          assumption: "Average length of stay",
          value: `${Number(inputs.average_length_of_stay).toFixed(
            Number.isInteger(inputs.average_length_of_stay) ? 0 : 1,
          )} days`,
          rationale:
            "Converts avoided admissions into avoided bed use and downstream hospital pressure.",
        },
        {
          assumption: "QALY gain per escalation avoided",
          value: inputs.qaly_gain_per_escalation_avoided.toFixed(3),
          rationale:
            "Determines how much health gain is attributed to each avoided escalation and therefore strongly influences cost per QALY.",
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
            "Defines how avoided operational pressure is monetised and therefore changes the scale of reported savings.",
        },
        {
          assumption: "Cost per escalation",
          value: formatCurrency(inputs.cost_per_escalation),
          rationale:
            "Monetises avoided deterioration while patients wait.",
        },
        {
          assumption: "Cost per admission",
          value: formatCurrency(inputs.cost_per_admission),
          rationale:
            "Monetises avoided acute admissions and is a core driver of economic value.",
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

export function buildWaitWiseReportData({
  inputs,
  results,
  uncertainty,
  exportedAt,
}: BuildReportArgs): WaitWiseReportData {
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const overallSignal = getSignalLabel(decisionStatus);
  const interpretation = generateInterpretation(results, inputs, uncertainty);
  const mainDriver = getMainDriverText(inputs);
  const caseLabel = deriveCaseLabel(inputs);

  return {
    cover: {
      title: "WaitWise scenario brief",
      subtitle: "Exploratory assessment of potential pathway and economic value",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "WaitWise is an exploratory health economic scenario model. It is designed to test whether waiting list interventions could plausibly reduce backlog pressure, escalation risk, acute activity, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
    },

    executiveSummary: {
      overview: buildOverview(inputs, results, decisionStatus),
      overallSignal,
      whatModelSuggests: interpretation.what_model_suggests,
      mainDependency: `The result is mainly driven by ${mainDriver}, intervention reach, and delivery cost.`,
      mainFragility: interpretation.what_looks_fragile,
      bestNextStep: interpretation.what_to_validate_next,
    },

    scenario: buildScenarioSection(inputs),

    headlineMetrics: [
      {
        label: "Waiting list reduction",
        value: formatNumber(results.waiting_list_reduction_total),
      },
      {
        label: "Escalations avoided",
        value: formatNumber(results.escalations_avoided_total),
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
        label: "Break-even horizon",
        value: results.break_even_horizon,
      },
    ],

    plainEnglishResults: buildPlainEnglishResults(
      inputs,
      results,
      decisionStatus,
    ),

    uncertaintyAndSensitivity: {
      robustnessSummary: assessUncertaintyRobustness(
        uncertainty,
        inputs.cost_effectiveness_threshold,
      ),
      uncertaintyRows: uncertainty.map((row) => ({
        label: row.case,
        value: formatCurrency(row.discounted_cost_per_qaly),
        note: `${formatNumber(row.waiting_list_reduction_total)} waiting list reduction · ${row.decision_status}`,
      })),
      sensitivitySummary: [
        "The result is most likely to move when assumptions change around reach, targeting, throughput improvement, and escalation reduction while waiting.",
        "In practical terms, the case is strongest when intervention effect meaningfully reduces escalation risk or materially improves throughput without high delivery cost.",
        "The case weakens when implementation is broad but diluted, when effects decay quickly, or when operational gains do not translate into meaningful avoided acute activity.",
      ],
    },

    scenarioAndComparator: {
      scenarioSummary: `The scenario framing suggests value is most likely to emerge where waiting list pressure is persistent, escalation risk while waiting is meaningful, and the intervention can either improve throughput or reduce escalation at realistic cost. The current readout is best understood as a ${caseLabel.toLowerCase()}.`,
      strongestScenario:
        "The strongest scenario pattern is usually the one where the intervention reaches higher-opportunity patients, improves flow, and meaningfully reduces deterioration while patients wait.",
      weakestScenario:
        "The weakest or most fragile scenario pattern is usually the one where implementation is broad and costly but effects on backlog flow or escalation risk are modest.",
      comparatorSummary:
        "Comparator interpretation should focus on whether a more targeted or more throughput-led design produces stronger value than a broad intervention. If value only appears under a narrow set of assumptions, stronger local validation is likely to be needed before progression.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible reduction in waiting list pressure, a plausible link to avoided escalations and admissions, and an acceptable cost per QALY under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local realism of the intervention effect on flow and escalation risk, and whether avoided deterioration genuinely translates into avoided admissions and bed use.",
      recommendedNextMove:
        "The next step should be to validate local waiting list dynamics, escalation rates, realistic intervention reach, expected delivery cost, and whether operational benefits are likely to persist beyond the initial implementation period.",
    },

    localEvidenceNeeded: {
      items: [
        "Local waiting list size and monthly inflow for the intended population",
        "Baseline monthly throughput and realistic scope for improvement",
        "Local escalation risk while patients wait",
        "Local share of escalations that lead to admission",
        "Average length of stay associated with escalation-driven admissions",
        "Realistic intervention reach and implementation cost",
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