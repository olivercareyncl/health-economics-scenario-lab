import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/waitwise/formatters";
import {
  assessUncertaintyRobustness,
  generateInterpretation,
  generateOverviewSummary,
  generateOverallSignal,
  generateStructuredRecommendation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/waitwise/summaries";
import type {
  Inputs,
  ModelResults,
  SensitivityRow,
  UncertaintyRow,
} from "@/lib/waitwise/types";

type SensitivitySummary = {
  rows: SensitivityRow[];
  primary_driver: SensitivityRow | null;
  top_drivers: SensitivityRow[];
};

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

export type WaitWiseReportData = {
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
  return `This run explores whether a waiting list intervention in a ${inputs.targeting_mode.toLowerCase()} setting could plausibly reduce backlog pressure, escalations, admissions, bed use, and economic burden over ${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"} under the current assumptions.`;
}

function buildScenarioSection(inputs: Inputs): WaitWiseReportData["scenario"] {
  return {
    interventionConcept: `The scenario tests a waiting list improvement approach that aims to reach ${formatPercent(
      inputs.intervention_reach_rate,
    )} of the relevant list population. In practice, this could represent demand management, validation and triage, pathway redesign, capacity support, prioritisation, or targeted case management for patients at greater risk while waiting.`,
    targetPopulationLogic: `The model assumes a starting waiting list of ${formatNumber(
      inputs.starting_waiting_list_size,
    )}, monthly inflow of ${formatNumber(
      inputs.monthly_inflow,
    )}, and baseline monthly throughput of ${formatNumber(
      inputs.baseline_monthly_throughput,
    )}. The targeting mode is set to ${
      inputs.targeting_mode
    }, which affects how concentrated the opportunity and escalation risk are assumed to be within the list.`,
    economicMechanism: `The value mechanism runs through a mix of reduced demand, improved throughput, and fewer escalations while waiting. These effects then translate into fewer admissions, lower bed use, and QALY gains from avoided deterioration. The model tests whether those benefits are enough to offset programme costs and produce an acceptable cost per QALY against the selected threshold.`,
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
      body: `Under the current assumptions, the model reduces the waiting list by ${formatNumber(
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
      body: `${netCostLabel} is estimated at ${normaliseCurrencyString(
        formatCurrency(Math.abs(results.discounted_net_cost_total)),
      )}, with a discounted cost per QALY of ${normaliseCurrencyString(
        formatCurrency(results.discounted_cost_per_qaly),
      )} against a threshold of ${normaliseCurrencyString(
        formatCurrency(inputs.cost_effectiveness_threshold),
      )}.`,
    },
    {
      body: `Taken together, the current signal is ${decisionStatus.toLowerCase()}. This should be read as an indicative scenario result rather than a definitive conclusion, because the signal remains sensitive to the assumed intervention effects, escalation risk, achievable reach, and delivery cost.`,
    },
  ];
}

function buildAssumptionSections(
  inputs: Inputs,
): WaitWiseReportData["assumptions"]["sections"] {
  return [
    {
      title: "Core programme assumptions",
      rows: [
        {
          assumption: "Targeting mode",
          value: inputs.targeting_mode,
          rationale:
            "Determines how concentrated the opportunity is assumed to be and how strongly escalation risk is focused in the selected population.",
        },
        {
          assumption: "Starting waiting list size",
          value: formatNumber(inputs.starting_waiting_list_size),
          rationale:
            "Sets the opening scale of the operational problem and directly affects the size of any potential benefit.",
        },
        {
          assumption: "Monthly inflow",
          value: formatNumber(inputs.monthly_inflow),
          rationale:
            "Defines how much new pressure enters the system over time.",
        },
        {
          assumption: "Baseline monthly throughput",
          value: formatNumber(inputs.baseline_monthly_throughput),
          rationale:
            "Defines the pre-intervention processing rate and influences how quickly the list can change.",
        },
        {
          assumption: "Intervention reach rate",
          value: formatPercent(inputs.intervention_reach_rate),
          rationale:
            "Controls how much of the relevant waiting list is effectively reached by the intervention.",
        },
        {
          assumption: "Intervention cost per patient reached",
          value: normaliseCurrencyString(
            formatCurrency(inputs.intervention_cost_per_patient_reached),
          ),
          rationale:
            "Acts as the main programme cost lever and directly affects whether the case remains economically attractive.",
        },
        {
          assumption: "Time horizon",
          value: `${inputs.time_horizon_years} year${
            inputs.time_horizon_years === 1 ? "" : "s"
          }`,
          rationale:
            "Longer horizons allow more operational and economic effects to accumulate.",
        },
      ],
    },
    {
      title: "Intervention effect assumptions",
      rows: [
        {
          assumption: "Demand reduction effect",
          value: formatPercent(inputs.demand_reduction_effect),
          rationale:
            "Represents how much inflow into the waiting list is reduced by the intervention.",
        },
        {
          assumption: "Throughput increase effect",
          value: formatPercent(inputs.throughput_increase_effect),
          rationale:
            "Represents how much delivery capacity or productivity improves under the intervention.",
        },
        {
          assumption: "Escalation reduction effect",
          value: formatPercent(inputs.escalation_reduction_effect),
          rationale:
            "Represents how much deterioration while waiting is reduced.",
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
            "Captures erosion in engagement or effective coverage over the selected horizon.",
        },
      ],
    },
    {
      title: "Pathway assumptions",
      rows: [
        {
          assumption: "Monthly escalation rate",
          value: formatPercent(inputs.monthly_escalation_rate),
          rationale:
            "Captures deterioration or escalation risk while patients remain on the waiting list.",
        },
        {
          assumption: "Admission rate after escalation",
          value: formatPercent(inputs.admission_rate_after_escalation),
          rationale:
            "Translates escalations into downstream hospital activity.",
        },
        {
          assumption: "Average length of stay",
          value: `${inputs.average_length_of_stay.toFixed(
            Number.isInteger(inputs.average_length_of_stay) ? 0 : 1,
          )} days`,
          rationale:
            "Converts avoided admissions into avoided bed use and associated hospital pressure.",
        },
        {
          assumption: "QALY gain per escalation avoided",
          value: inputs.qaly_gain_per_escalation_avoided.toFixed(2),
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
            "Defines the economic framing used in the model and how downstream value is represented.",
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
          assumption: "Cost per escalation",
          value: normaliseCurrencyString(formatCurrency(inputs.cost_per_escalation)),
          rationale:
            "Monetises avoided deterioration or escalation while patients wait.",
        },
        {
          assumption: "Cost per admission",
          value: normaliseCurrencyString(formatCurrency(inputs.cost_per_admission)),
          rationale:
            "Monetises avoided admissions following escalation.",
        },
        {
          assumption: "Cost per bed day",
          value: normaliseCurrencyString(formatCurrency(inputs.cost_per_bed_day)),
          rationale:
            "Represents the value of avoided inpatient bed use in the model.",
        },
        {
          assumption: "Discount rate",
          value: formatPercent(inputs.discount_rate),
          rationale:
            "Adjusts future costs and benefits into present-value terms.",
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
      "At this stage, the case should still be treated as dependent on the core assumptions around intervention effects, reach, and delivery cost.",
      "Further validation should focus on the most decision-relevant operational and cost inputs locally.",
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
    "The case weakens fastest when intervention effects are smaller than expected, delivery becomes more expensive, or escalation and admission benefits are less pronounced locally.";

  return [line1, line2, line3];
}

function buildTopDriverRows(
  sensitivity: SensitivitySummary,
): WaitWiseReportData["uncertaintyAndSensitivity"]["topDrivers"] {
  return sensitivity.top_drivers.slice(0, 3).map((driver, index) => ({
    label: `Driver ${index + 1}`,
    value: driver.label,
    note: `Largest ICER swing: ${normaliseCurrencyString(
      formatCurrency(driver.swing),
    )}`,
  }));
}

export function buildWaitWiseReportData({
  inputs,
  results,
  uncertainty,
  sensitivity,
  exportedAt,
}: BuildReportArgs): WaitWiseReportData {
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
      title: "WaitWise scenario report",
      subtitle:
        "Exploratory health economic scenario brief for waiting list improvement",
      module: "Health Economics Scenario Lab",
      generatedAt: exportedAt,
      decisionStatus,
      signalLabel,
    },

    purpose: {
      question: buildPurposeQuestion(inputs),
      context:
        "WaitWise is an exploratory health economic scenario model. It is designed to test whether reducing waiting list pressure and avoiding deterioration while waiting could plausibly reduce downstream escalation, admissions, bed use, and economic burden under a specified set of assumptions before formal evaluation or business case development.",
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
        note: `${formatNumber(row.waiting_list_reduction_total)} waiting list reduction · ${row.decision_status}`,
      })),
      sensitivitySummary,
      topDrivers: buildTopDriverRows(sensitivity),
    },

    scenarioAndComparator: {
      scenarioSummary:
        "The scenario framing suggests value is most likely to emerge where the waiting list is large enough to matter, escalation risk while waiting is meaningful, and the intervention can either reduce inflow, improve throughput, or reduce deterioration at a realistic delivery cost.",
      strongestScenario:
        "The strongest scenario is typically the one where intervention effects are larger, escalation risk is more concentrated, and operational reach remains strong over time.",
      weakestScenario:
        "The weakest or most fragile scenario is typically the one where intervention effects are smaller, costs are higher, or escalation and admission benefits are less pronounced.",
      comparatorSummary:
        "Comparator interpretation should focus on whether the current configuration offers a materially better operational and economic signal than a more conservative alternative. If gains over comparator are modest, the case is more likely to require stronger local evidence before progression.",
    },

    decisionImplications: {
      progressionView:
        "Progression is better supported when the model shows a credible operational effect, an acceptable cost per QALY against threshold, and a decision signal that remains directionally positive under bounded uncertainty.",
      mainEvidenceGap:
        "The most important evidence gap is usually the local credibility of the assumed intervention effects and the extent to which they would translate into real reductions in escalation, admissions, and inpatient pressure.",
      currentCasePosition: `At this stage the case looks ${signalLabel.toLowerCase()}. That should be treated as an early decision signal rather than a final answer.`,
      recommendedNextMove:
        "The next step should be to validate the key local operational and implementation assumptions, especially achievable intervention effect, escalation risk, realistic intervention reach, and likely delivery cost.",
    },

    caveats: {
      useNote: `This report is exploratory and illustrative. It supports early-stage decision thinking, not formal evaluation, forecasting, or local business case approval. Results depend materially on the selected assumptions and should be interpreted alongside local data, implementation realism, and validation work. ${uncertaintyReadout}`,
    },

    localEvidenceNeeded: {
      items: [
        "Local waiting list size and monthly inflow for the relevant pathway",
        "Local baseline monthly throughput and operational constraints",
        "Local escalation or deterioration risk while waiting",
        "Local admission and bed-use consequences following escalation",
        "Realistic intervention reach in the intended operational setting",
        "Likely implementation cost per patient reached",
      ],
    },
  };
}