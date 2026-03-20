import {
  COSTING_METHOD_MAP,
  SCENARIO_MAP,
  TARGETING_MODE_MAP,
} from "@/lib/clearpath/scenarios";
import type {
  ComparatorOption,
  Inputs,
  ModelResults,
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
    const testInputs = { ...inputs, time_horizon_years: horizon as 1 | 3 | 5 };
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

export function buildComparatorCase(
  defaults: Inputs,
  baseInputs: Inputs,
  comparatorMode: ComparatorOption,
): Inputs {
  const comparatorInputs: Inputs = { ...defaults };

  if (comparatorMode in SCENARIO_MAP) {
    comparatorInputs &&
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