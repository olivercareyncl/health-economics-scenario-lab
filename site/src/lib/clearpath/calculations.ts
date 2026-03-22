import {
  COSTING_METHOD_MAP,
  SCENARIO_MAP,
  TARGETING_MODE_MAP,
} from "@/lib/clearpath/scenarios";
import type {
  ComparatorOption,
  Inputs,
  ModelResults,
  ParameterSensitivityRow,
  SensitivitySummary,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/clearpath/types";

export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

export function clampRate(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getDiscountFactor(year: number, discountRate: number): number {
  return 1 / Math.pow(1 + discountRate, year - 1);
}

export function getTargetingAdjustments(inputs: Inputs) {
  const targeting = TARGETING_MODE_MAP[inputs.targeting_mode];

  const adjustedIncidentCases =
    inputs.annual_incident_cases * targeting.population_multiplier;

  const adjustedLateDiagnosisRate = clampRate(
    inputs.current_late_diagnosis_rate * targeting.late_rate_multiplier,
  );

  const adjustedReachRate = clampRate(
    inputs.intervention_reach_rate * targeting.reach_multiplier,
  );

  const adjustedReduction = clampRate(
    inputs.achievable_reduction_in_late_diagnosis * targeting.shift_multiplier,
  );

  return {
    adjusted_incident_cases: adjustedIncidentCases,
    adjusted_late_diagnosis_rate: adjustedLateDiagnosisRate,
    adjusted_reach_rate: adjustedReachRate,
    adjusted_reduction: adjustedReduction,
  };
}

export function calculateGrossSavings(
  casesShiftedEarlier: number,
  admissionsAvoided: number,
  bedDaysAvoided: number,
  inputs: Inputs,
): number {
  const costing = COSTING_METHOD_MAP[inputs.costing_method];

  const treatmentSavings =
    casesShiftedEarlier * (inputs.treatment_cost_late - inputs.treatment_cost_early);

  const emergencySavings =
    admissionsAvoided * inputs.cost_per_emergency_admission;

  const bedDayValue = bedDaysAvoided * inputs.cost_per_bed_day;
  const acuteSavings = emergencySavings + bedDayValue;

  if (costing.mode === "treatment") {
    return treatmentSavings;
  }

  if (costing.mode === "acute") {
    return acuteSavings;
  }

  return treatmentSavings + acuteSavings;
}

export function runModelCore(inputs: Inputs) {
  const targeting = getTargetingAdjustments(inputs);
  const baseCasesReached =
    targeting.adjusted_incident_cases * targeting.adjusted_reach_rate;

  const yearlyRows: YearlyResultRow[] = [];
  let cumulativeProgrammeCost = 0;
  let cumulativeGrossSavings = 0;
  let cumulativeNetCost = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const annualEffectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);
    const annualParticipationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );

    const casesReached = baseCasesReached * annualParticipationMultiplier;
    const achievedReduction = clampRate(
      targeting.adjusted_reduction * annualEffectMultiplier,
    );

    const maxShiftableCases =
      targeting.adjusted_incident_cases * targeting.adjusted_late_diagnosis_rate;

    const rawCasesShifted = casesReached * achievedReduction;
    const casesShiftedEarlier = Math.min(rawCasesShifted, maxShiftableCases);

    const emergencyPresentationsAvoided =
      casesShiftedEarlier *
      (inputs.late_emergency_presentation_rate -
        inputs.early_emergency_presentation_rate);

    const admissionsAvoided =
      emergencyPresentationsAvoided * inputs.admissions_per_emergency_presentation;

    const bedDaysAvoided = admissionsAvoided * inputs.average_length_of_stay;

    const programmeCost =
      casesReached * inputs.intervention_cost_per_case_reached;

    const grossSavings = calculateGrossSavings(
      casesShiftedEarlier,
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );

    const netCost = programmeCost - grossSavings;
    const qalysGained =
      casesShiftedEarlier * inputs.qaly_gain_per_case_shifted;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    const discountedProgrammeCost = programmeCost * discountFactor;
    const discountedGrossSavings = grossSavings * discountFactor;
    const discountedNetCost = netCost * discountFactor;
    const discountedQalys = qalysGained * discountFactor;

    cumulativeProgrammeCost += programmeCost;
    cumulativeGrossSavings += grossSavings;
    cumulativeNetCost += netCost;

    yearlyRows.push({
      year,
      cases_reached: casesReached,
      cases_shifted_earlier: casesShiftedEarlier,
      emergency_presentations_avoided: emergencyPresentationsAvoided,
      admissions_avoided: admissionsAvoided,
      bed_days_avoided: bedDaysAvoided,
      programme_cost: programmeCost,
      gross_savings: grossSavings,
      net_cost: netCost,
      qalys_gained: qalysGained,
      discount_factor: discountFactor,
      discounted_programme_cost: discountedProgrammeCost,
      discounted_gross_savings: discountedGrossSavings,
      discounted_net_cost: discountedNetCost,
      discounted_qalys: discountedQalys,
      cumulative_programme_cost: cumulativeProgrammeCost,
      cumulative_gross_savings: cumulativeGrossSavings,
      cumulative_net_cost: cumulativeNetCost,
    });
  }

  const casesShiftedTotal = yearlyRows.reduce(
    (sum, row) => sum + row.cases_shifted_earlier,
    0,
  );

  const emergencyPresentationsAvoidedTotal = yearlyRows.reduce(
    (sum, row) => sum + row.emergency_presentations_avoided,
    0,
  );

  const admissionsAvoidedTotal = yearlyRows.reduce(
    (sum, row) => sum + row.admissions_avoided,
    0,
  );

  const bedDaysAvoidedTotal = yearlyRows.reduce(
    (sum, row) => sum + row.bed_days_avoided,
    0,
  );

  const programmeCostTotal = yearlyRows.reduce(
    (sum, row) => sum + row.programme_cost,
    0,
  );

  const grossSavingsTotal = yearlyRows.reduce(
    (sum, row) => sum + row.gross_savings,
    0,
  );

  const discountedProgrammeCostTotal = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_programme_cost,
    0,
  );

  const discountedGrossSavingsTotal = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_gross_savings,
    0,
  );

  const discountedNetCostTotal = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_net_cost,
    0,
  );

  const discountedQalysTotal = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_qalys,
    0,
  );

  const discountedCostPerQaly = safeDivide(
    discountedNetCostTotal,
    discountedQalysTotal,
  );

  const roi = safeDivide(grossSavingsTotal, programmeCostTotal);

  return {
    cases_reached_year_1: yearlyRows[0]?.cases_reached ?? 0,
    adjusted_incident_cases: targeting.adjusted_incident_cases,
    adjusted_late_diagnosis_rate: targeting.adjusted_late_diagnosis_rate,
    adjusted_reach_rate: targeting.adjusted_reach_rate,
    adjusted_reduction: targeting.adjusted_reduction,
    cases_shifted_total: casesShiftedTotal,
    emergency_presentations_avoided_total: emergencyPresentationsAvoidedTotal,
    admissions_avoided_total: admissionsAvoidedTotal,
    bed_days_avoided_total: bedDaysAvoidedTotal,
    programme_cost_total: programmeCostTotal,
    gross_savings_total: grossSavingsTotal,
    discounted_programme_cost_total: discountedProgrammeCostTotal,
    discounted_gross_savings_total: discountedGrossSavingsTotal,
    discounted_net_cost_total: discountedNetCostTotal,
    discounted_qalys_total: discountedQalysTotal,
    discounted_cost_per_qaly: discountedCostPerQaly,
    roi,
    yearly_results: yearlyRows,
  };
}

export function calculateBreakEvenReduction(inputs: Inputs): number {
  const targeting = getTargetingAdjustments(inputs);
  const baseCasesReached =
    targeting.adjusted_incident_cases * targeting.adjusted_reach_rate;

  let numerator = 0;
  let denominator = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);

    const casesReached = baseCasesReached * participationMultiplier;
    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    const casesShiftedPerUnit = casesReached * effectMultiplier;

    const emergencyAvoidedPerUnit =
      casesShiftedPerUnit *
      (inputs.late_emergency_presentation_rate -
        inputs.early_emergency_presentation_rate);

    const admissionsAvoidedPerUnit =
      emergencyAvoidedPerUnit * inputs.admissions_per_emergency_presentation;

    const bedDaysAvoidedPerUnit =
      admissionsAvoidedPerUnit * inputs.average_length_of_stay;

    const grossSavingsPerUnit = calculateGrossSavings(
      casesShiftedPerUnit,
      admissionsAvoidedPerUnit,
      bedDaysAvoidedPerUnit,
      inputs,
    );

    const qalyValuePerUnit =
      casesShiftedPerUnit *
      inputs.qaly_gain_per_case_shifted *
      inputs.cost_effectiveness_threshold;

    numerator +=
      casesReached * inputs.intervention_cost_per_case_reached * discountFactor;

    denominator += (grossSavingsPerUnit + qalyValuePerUnit) * discountFactor;
  }

  return safeDivide(numerator, denominator);
}

export function calculateBreakEvenCostPerCase(inputs: Inputs): number {
  const targeting = getTargetingAdjustments(inputs);
  const baseCasesReached =
    targeting.adjusted_incident_cases * targeting.adjusted_reach_rate;

  let totalDiscountedCasesReached = 0;
  let totalDiscountedValue = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);

    const casesReached = baseCasesReached * participationMultiplier;

    let casesShiftedEarlier =
      casesReached * targeting.adjusted_reduction * effectMultiplier;

    casesShiftedEarlier = Math.min(
      casesShiftedEarlier,
      targeting.adjusted_incident_cases * targeting.adjusted_late_diagnosis_rate,
    );

    const emergencyPresentationsAvoided =
      casesShiftedEarlier *
      (inputs.late_emergency_presentation_rate -
        inputs.early_emergency_presentation_rate);

    const admissionsAvoided =
      emergencyPresentationsAvoided * inputs.admissions_per_emergency_presentation;

    const bedDaysAvoided = admissionsAvoided * inputs.average_length_of_stay;

    const grossSavings = calculateGrossSavings(
      casesShiftedEarlier,
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );

    const qalyValue =
      casesShiftedEarlier *
      inputs.qaly_gain_per_case_shifted *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    totalDiscountedCasesReached += casesReached * discountFactor;
    totalDiscountedValue += (grossSavings + qalyValue) * discountFactor;
  }

  return safeDivide(totalDiscountedValue, totalDiscountedCasesReached);
}

export function calculateBreakEvenHorizon(
  inputs: Inputs,
  maxYears = 10,
): string {
  for (let horizon = 1; horizon <= maxYears; horizon += 1) {
    const testInputs = {
      ...inputs,
      time_horizon_years: (horizon <= 1 ? 1 : horizon <= 3 ? 3 : 5) as 1 | 3 | 5,
    };
    const result = runModelCore(testInputs);

    if (
      result.discounted_cost_per_qaly > 0 &&
      result.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
    ) {
      return `${horizon} year${horizon === 1 ? "" : "s"}`;
    }

    if (result.discounted_net_cost_total < 0) {
      return `${horizon} year${horizon === 1 ? "" : "s"}`;
    }
  }

  return `>${maxYears} years`;
}

export function runModel(inputs: Inputs): ModelResults {
  const core = runModelCore(inputs);

  return {
    ...core,
    break_even_reduction_in_late_diagnosis: clampRate(
      calculateBreakEvenReduction(inputs),
    ),
    break_even_cost_per_case: calculateBreakEvenCostPerCase(inputs),
    break_even_horizon: calculateBreakEvenHorizon(inputs, 10),
  };
}

export function runBoundedUncertainty(inputs: Inputs): UncertaintyRow[] {
  const cases = [
    {
      case: "Low" as const,
      overrides: {
        achievable_reduction_in_late_diagnosis: clampRate(
          inputs.achievable_reduction_in_late_diagnosis * 0.8,
        ),
        intervention_cost_per_case_reached:
          inputs.intervention_cost_per_case_reached * 1.2,
        qaly_gain_per_case_shifted: inputs.qaly_gain_per_case_shifted * 0.8,
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 1.2,
        ),
      },
      dominant_domain: "Delivery assumptions",
    },
    {
      case: "Base" as const,
      overrides: {},
      dominant_domain: "Base case",
    },
    {
      case: "High" as const,
      overrides: {
        achievable_reduction_in_late_diagnosis: clampRate(
          inputs.achievable_reduction_in_late_diagnosis * 1.2,
        ),
        intervention_cost_per_case_reached:
          inputs.intervention_cost_per_case_reached * 0.8,
        qaly_gain_per_case_shifted: inputs.qaly_gain_per_case_shifted * 1.2,
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 0.8,
        ),
      },
      dominant_domain: "Clinical and delivery assumptions",
    },
  ];

  return cases.map((scenario) => {
    const caseInputs: Inputs = {
      ...inputs,
      ...scenario.overrides,
    };

    const result = runModelCore(caseInputs);

    const decisionStatus =
      result.discounted_net_cost_total < 0
        ? "Appears cost-saving"
        : result.discounted_cost_per_qaly > 0 &&
            result.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
          ? "Appears cost-effective"
          : "Above current threshold";

    return {
      case: scenario.case,
      cases_shifted_total: result.cases_shifted_total,
      discounted_net_cost_total: result.discounted_net_cost_total,
      discounted_cost_per_qaly: result.discounted_cost_per_qaly,
      dominant_domain: scenario.dominant_domain,
      decision_status: decisionStatus,
    };
  });
}

function formatSensitivityValue(
  parameter: keyof Inputs,
  value: number,
): string {
  switch (parameter) {
    case "current_late_diagnosis_rate":
    case "achievable_reduction_in_late_diagnosis":
    case "intervention_reach_rate":
    case "late_emergency_presentation_rate":
    case "early_emergency_presentation_rate":
    case "effect_decay_rate":
    case "participation_dropoff_rate":
      return `${Math.round(value * 100)}%`;

    case "qaly_gain_per_case_shifted":
      return value.toFixed(2);

    case "average_length_of_stay":
      return `${value.toFixed(1)} days`;

    case "annual_incident_cases":
    case "admissions_per_emergency_presentation":
      return value.toFixed(Number.isInteger(value) ? 0 : 2);

    default:
      return `£${Math.round(value).toLocaleString()}`;
  }
}

function getSensitivityLabel(parameter: keyof Inputs): string {
  switch (parameter) {
    case "current_late_diagnosis_rate":
      return "Current late diagnosis rate";
    case "achievable_reduction_in_late_diagnosis":
      return "Reduction in late diagnosis";
    case "intervention_reach_rate":
      return "Intervention reach";
    case "intervention_cost_per_case_reached":
      return "Intervention cost per case";
    case "qaly_gain_per_case_shifted":
      return "QALY gain per case shifted";
    case "late_emergency_presentation_rate":
      return "Late emergency presentation rate";
    case "early_emergency_presentation_rate":
      return "Early emergency presentation rate";
    case "average_length_of_stay":
      return "Average length of stay";
    case "treatment_cost_late":
      return "Late treatment cost";
    case "treatment_cost_early":
      return "Early treatment cost";
    case "cost_per_emergency_admission":
      return "Cost per emergency admission";
    case "cost_per_bed_day":
      return "Cost per bed day";
    case "annual_incident_cases":
      return "Annual incident cases";
    case "admissions_per_emergency_presentation":
      return "Admissions per emergency presentation";
    case "effect_decay_rate":
      return "Effect decay";
    case "participation_dropoff_rate":
      return "Participation drop-off";
    default:
      return String(parameter)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

export function runParameterSensitivity(inputs: Inputs): SensitivitySummary {
  const parameters: Array<{
    key: keyof Inputs;
    low: number;
    high: number;
  }> = [
    {
      key: "current_late_diagnosis_rate",
      low: clampRate(inputs.current_late_diagnosis_rate * 0.8),
      high: clampRate(inputs.current_late_diagnosis_rate * 1.2),
    },
    {
      key: "achievable_reduction_in_late_diagnosis",
      low: clampRate(inputs.achievable_reduction_in_late_diagnosis * 0.8),
      high: clampRate(inputs.achievable_reduction_in_late_diagnosis * 1.2),
    },
    {
      key: "intervention_reach_rate",
      low: clampRate(inputs.intervention_reach_rate * 0.85),
      high: clampRate(inputs.intervention_reach_rate * 1.15),
    },
    {
      key: "intervention_cost_per_case_reached",
      low: Math.max(0, inputs.intervention_cost_per_case_reached * 0.8),
      high: Math.max(0, inputs.intervention_cost_per_case_reached * 1.2),
    },
    {
      key: "qaly_gain_per_case_shifted",
      low: Math.max(0, inputs.qaly_gain_per_case_shifted * 0.8),
      high: Math.max(0, inputs.qaly_gain_per_case_shifted * 1.2),
    },
    {
      key: "late_emergency_presentation_rate",
      low: clampRate(inputs.late_emergency_presentation_rate * 0.85),
      high: clampRate(inputs.late_emergency_presentation_rate * 1.15),
    },
    {
      key: "average_length_of_stay",
      low: Math.max(0, inputs.average_length_of_stay * 0.8),
      high: Math.max(0, inputs.average_length_of_stay * 1.2),
    },
    {
      key: "treatment_cost_late",
      low: Math.max(0, inputs.treatment_cost_late * 0.85),
      high: Math.max(0, inputs.treatment_cost_late * 1.15),
    },
  ];

  const baseResult = runModel(inputs);

  const rows: ParameterSensitivityRow[] = parameters.map(({ key, low, high }) => {
    const lowInputs: Inputs = { ...inputs, [key]: low };
    const highInputs: Inputs = { ...inputs, [key]: high };

    const lowResult = runModel(lowInputs);
    const highResult = runModel(highInputs);

    const lowDelta = lowResult.discounted_cost_per_qaly - baseResult.discounted_cost_per_qaly;
    const highDelta =
      highResult.discounted_cost_per_qaly - baseResult.discounted_cost_per_qaly;

    return {
      parameter_key: key,
      parameter_label: getSensitivityLabel(key),
      base_value: inputs[key] as number,
      low_value: low,
      high_value: high,
      low_value_label: formatSensitivityValue(key, low),
      high_value_label: formatSensitivityValue(key, high),
      base_icer: baseResult.discounted_cost_per_qaly,
      low_icer: lowResult.discounted_cost_per_qaly,
      high_icer: highResult.discounted_cost_per_qaly,
      low_delta: lowDelta,
      high_delta: highDelta,
      max_abs_icer_change: Math.max(Math.abs(lowDelta), Math.abs(highDelta)),
    };
  });

  const rankedRows = [...rows].sort(
    (a, b) => b.max_abs_icer_change - a.max_abs_icer_change,
  );

  return {
    rows,
    primary_driver: rankedRows[0] ?? null,
    top_drivers: rankedRows.slice(0, 5),
  };
}

export function buildComparatorCase(
  defaults: Inputs,
  baseInputs: Inputs,
  comparatorMode: ComparatorOption,
): Inputs {
  const comparatorInputs: Inputs = { ...defaults };

  if (comparatorMode in SCENARIO_MAP) {
    Object.assign(comparatorInputs, SCENARIO_MAP[comparatorMode](defaults));
  } else {
    Object.assign(comparatorInputs, baseInputs);
  }

  comparatorInputs.time_horizon_years = baseInputs.time_horizon_years;
  comparatorInputs.discount_rate = baseInputs.discount_rate;
  comparatorInputs.costing_method = baseInputs.costing_method;
  comparatorInputs.cost_effectiveness_threshold =
    baseInputs.cost_effectiveness_threshold;
  comparatorInputs.cost_per_emergency_admission =
    baseInputs.cost_per_emergency_admission;
  comparatorInputs.cost_per_bed_day = baseInputs.cost_per_bed_day;
  comparatorInputs.treatment_cost_early = baseInputs.treatment_cost_early;
  comparatorInputs.treatment_cost_late = baseInputs.treatment_cost_late;
  comparatorInputs.qaly_gain_per_case_shifted =
    baseInputs.qaly_gain_per_case_shifted;

  return comparatorInputs;
}