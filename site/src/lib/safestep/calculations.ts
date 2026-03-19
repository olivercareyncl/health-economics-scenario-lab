import {
  COSTING_METHOD_MAP,
  SCENARIO_MAP,
  TARGETING_MODE_MAP,
} from "./scenarios";
import type {
  ModelResult,
  SafeStepInputs,
  TargetingAdjustmentsResult,
  UncertaintyRow,
  YearlyResultRow,
} from "./types";

function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function clampRate(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getDiscountFactor(year: number, discountRate: number): number {
  return 1 / (1 + discountRate) ** (year - 1);
}

function getTargetingAdjustments(
  inputs: SafeStepInputs,
): TargetingAdjustmentsResult {
  const targeting = TARGETING_MODE_MAP[inputs.targeting_mode];

  return {
    adjusted_eligible_population:
      inputs.eligible_population * targeting.population_multiplier,
    adjusted_annual_fall_risk: clampRate(
      inputs.annual_fall_risk * targeting.risk_multiplier,
    ),
    adjusted_uptake_rate: clampRate(
      inputs.uptake_rate * targeting.uptake_multiplier,
    ),
  };
}

function calculateGrossSavings(
  admissionsAvoided: number,
  bedDaysAvoided: number,
  inputs: SafeStepInputs,
): number {
  const costing = COSTING_METHOD_MAP[inputs.costing_method];

  const admissionSavings = admissionsAvoided * inputs.cost_per_admission;
  const bedDayValue = bedDaysAvoided * inputs.cost_per_bed_day;

  if (costing.mode === "admission") return admissionSavings;
  if (costing.mode === "bed_day") return bedDayValue;
  return admissionSavings + bedDayValue;
}

function runModelCore(
  inputs: SafeStepInputs,
): Omit<
  ModelResult,
  | "break_even_effectiveness"
  | "break_even_cost_per_participant"
  | "break_even_horizon"
> {
  const targeting = getTargetingAdjustments(inputs);

  const baseTreatedPopulation =
    targeting.adjusted_eligible_population *
    targeting.adjusted_uptake_rate *
    inputs.adherence_rate;

  const yearlyRows: YearlyResultRow[] = [];

  let cumulativeProgrammeCost = 0;
  let cumulativeGrossSavings = 0;
  let cumulativeNetCost = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    let annualEffectiveness =
      inputs.relative_risk_reduction * (1 - inputs.effect_decay_rate) ** (year - 1);
    annualEffectiveness = clampRate(annualEffectiveness);

    const treatedPopulation =
      baseTreatedPopulation * (1 - inputs.participation_dropoff_rate) ** (year - 1);

    const expectedFallsBaseline =
      treatedPopulation * targeting.adjusted_annual_fall_risk;

    const fallsAvoided = expectedFallsBaseline * annualEffectiveness;
    const fallsAfterIntervention = expectedFallsBaseline - fallsAvoided;

    const admissionsAvoided = fallsAvoided * inputs.admission_rate_after_fall;
    const bedDaysAvoided = admissionsAvoided * inputs.average_length_of_stay;

    const programmeCost =
      treatedPopulation * inputs.intervention_cost_per_person;
    const grossSavings = calculateGrossSavings(
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );
    const netCost = programmeCost - grossSavings;

    const qalysGained = fallsAvoided * inputs.qaly_loss_per_serious_fall;

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
      treated_population: treatedPopulation,
      annual_effectiveness: annualEffectiveness,
      expected_falls_baseline: expectedFallsBaseline,
      falls_after_intervention: fallsAfterIntervention,
      falls_avoided: fallsAvoided,
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

  const sum = (key: keyof YearlyResultRow) =>
    yearlyRows.reduce((acc, row) => acc + Number(row[key]), 0);

  const fallsAvoidedTotal = sum("falls_avoided");
  const admissionsAvoidedTotal = sum("admissions_avoided");
  const bedDaysAvoidedTotal = sum("bed_days_avoided");
  const programmeCostTotal = sum("programme_cost");
  const grossSavingsTotal = sum("gross_savings");
  const netCostTotal = sum("net_cost");
  const discountedProgrammeCostTotal = sum("discounted_programme_cost");
  const discountedGrossSavingsTotal = sum("discounted_gross_savings");
  const discountedNetCostTotal = sum("discounted_net_cost");
  const discountedQalysTotal = sum("discounted_qalys");

  const discountedCostPerQaly = safeDivide(
    discountedNetCostTotal,
    discountedQalysTotal,
  );
  const roi = safeDivide(grossSavingsTotal, programmeCostTotal);

  return {
    treated_population_year_1: yearlyRows[0]?.treated_population ?? 0,
    adjusted_eligible_population: targeting.adjusted_eligible_population,
    adjusted_annual_fall_risk: targeting.adjusted_annual_fall_risk,
    adjusted_uptake_rate: targeting.adjusted_uptake_rate,
    falls_avoided_total: fallsAvoidedTotal,
    admissions_avoided_total: admissionsAvoidedTotal,
    bed_days_avoided_total: bedDaysAvoidedTotal,
    programme_cost_total: programmeCostTotal,
    gross_savings_total: grossSavingsTotal,
    net_cost_total: netCostTotal,
    discounted_programme_cost_total: discountedProgrammeCostTotal,
    discounted_gross_savings_total: discountedGrossSavingsTotal,
    discounted_net_cost_total: discountedNetCostTotal,
    discounted_qalys_total: discountedQalysTotal,
    discounted_cost_per_qaly: discountedCostPerQaly,
    roi,
    yearly_results: yearlyRows,
  };
}

export function calculateBreakEvenEffectiveness(
  inputs: SafeStepInputs,
): number {
  const targeting = getTargetingAdjustments(inputs);

  const baseTreatedPopulation =
    targeting.adjusted_eligible_population *
    targeting.adjusted_uptake_rate *
    inputs.adherence_rate;

  let numerator = 0;
  let denominator = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const treatedPopulation =
      baseTreatedPopulation * (1 - inputs.participation_dropoff_rate) ** (year - 1);

    const expectedFallsBaseline =
      treatedPopulation * targeting.adjusted_annual_fall_risk;

    const annualDecayMultiplier = (1 - inputs.effect_decay_rate) ** (year - 1);

    const admissionsPerUnitEffect =
      expectedFallsBaseline *
      annualDecayMultiplier *
      inputs.admission_rate_after_fall;

    const bedDaysPerUnitEffect =
      admissionsPerUnitEffect * inputs.average_length_of_stay;

    const grossSavingsPerUnitEffect = calculateGrossSavings(
      admissionsPerUnitEffect,
      bedDaysPerUnitEffect,
      inputs,
    );

    const qalyPerUnitEffect =
      expectedFallsBaseline *
      annualDecayMultiplier *
      inputs.qaly_loss_per_serious_fall;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    numerator +=
      treatedPopulation *
      inputs.intervention_cost_per_person *
      discountFactor;

    denominator +=
      (grossSavingsPerUnitEffect +
        qalyPerUnitEffect * inputs.cost_effectiveness_threshold) *
      discountFactor;
  }

  return safeDivide(numerator, denominator);
}

export function calculateBreakEvenCostPerParticipant(
  inputs: SafeStepInputs,
): number {
  const targeting = getTargetingAdjustments(inputs);

  const baseTreatedPopulation =
    targeting.adjusted_eligible_population *
    targeting.adjusted_uptake_rate *
    inputs.adherence_rate;

  let totalDiscountedTreated = 0;
  let totalDiscountedValue = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const treatedPopulation =
      baseTreatedPopulation * (1 - inputs.participation_dropoff_rate) ** (year - 1);

    let annualEffectiveness =
      inputs.relative_risk_reduction * (1 - inputs.effect_decay_rate) ** (year - 1);
    annualEffectiveness = clampRate(annualEffectiveness);

    const expectedFallsBaseline =
      treatedPopulation * targeting.adjusted_annual_fall_risk;
    const fallsAvoided = expectedFallsBaseline * annualEffectiveness;
    const admissionsAvoided = fallsAvoided * inputs.admission_rate_after_fall;
    const bedDaysAvoided = admissionsAvoided * inputs.average_length_of_stay;

    const grossSavings = calculateGrossSavings(
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );

    const qalyValue =
      fallsAvoided *
      inputs.qaly_loss_per_serious_fall *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    totalDiscountedTreated += treatedPopulation * discountFactor;
    totalDiscountedValue += (grossSavings + qalyValue) * discountFactor;
  }

  return safeDivide(totalDiscountedValue, totalDiscountedTreated);
}

export function calculateBreakEvenHorizon(
  inputs: SafeStepInputs,
  maxYears = 10,
): string {
  for (let horizon = 1; horizon <= maxYears; horizon += 1) {
    const testInputs: SafeStepInputs = {
      ...inputs,
      time_horizon_years: horizon,
    };

    const result = runModelCore(testInputs);

    if (
      result.discounted_cost_per_qaly > 0 &&
      result.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
    ) {
      return `${horizon} year${horizon !== 1 ? "s" : ""}`;
    }

    if (result.discounted_net_cost_total < 0) {
      return `${horizon} year${horizon !== 1 ? "s" : ""}`;
    }
  }

  return `>${maxYears} years`;
}

export function runModel(inputs: SafeStepInputs): ModelResult {
  const core = runModelCore(inputs);

  return {
    ...core,
    break_even_effectiveness: clampRate(
      calculateBreakEvenEffectiveness(inputs),
    ),
    break_even_cost_per_participant:
      calculateBreakEvenCostPerParticipant(inputs),
    break_even_horizon: calculateBreakEvenHorizon(inputs, 10),
  };
}

export function runBoundedUncertainty(
  inputs: SafeStepInputs,
): UncertaintyRow[] {
  const cases = [
    {
      case: "Low" as const,
      overrides: {
        relative_risk_reduction: clampRate(inputs.relative_risk_reduction * 0.8),
        intervention_cost_per_person: inputs.intervention_cost_per_person * 1.2,
        annual_fall_risk: clampRate(inputs.annual_fall_risk * 0.9),
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
        relative_risk_reduction: clampRate(inputs.relative_risk_reduction * 1.2),
        intervention_cost_per_person: inputs.intervention_cost_per_person * 0.8,
        annual_fall_risk: clampRate(inputs.annual_fall_risk * 1.1),
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 0.8,
        ),
      },
      dominant_domain: "Clinical and delivery assumptions",
    },
  ];

  return cases.map(({ case: caseName, overrides, dominant_domain }) => {
    const caseInputs: SafeStepInputs = {
      ...inputs,
      ...overrides,
    };

    const result = runModelCore(caseInputs);

    let decisionStatus = "Above current threshold";
    if (result.discounted_net_cost_total < 0) {
      decisionStatus = "Appears cost-saving";
    } else if (
      result.discounted_cost_per_qaly > 0 &&
      result.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
    ) {
      decisionStatus = "Appears cost-effective";
    }

    return {
      case: caseName,
      falls_avoided_total: result.falls_avoided_total,
      discounted_net_cost_total: result.discounted_net_cost_total,
      discounted_cost_per_qaly: result.discounted_cost_per_qaly,
      dominant_domain,
      decision_status: decisionStatus,
    };
  });
}

export function buildComparatorCase(
  defaults: SafeStepInputs,
  baseInputs: SafeStepInputs,
  comparatorMode: keyof typeof SCENARIO_MAP,
): SafeStepInputs {
  const comparatorInputs =
    comparatorMode in SCENARIO_MAP
      ? SCENARIO_MAP[comparatorMode](defaults)
      : { ...baseInputs };

  return {
    ...comparatorInputs,
    time_horizon_years: baseInputs.time_horizon_years,
    discount_rate: baseInputs.discount_rate,
    costing_method: baseInputs.costing_method,
    cost_effectiveness_threshold: baseInputs.cost_effectiveness_threshold,
    cost_per_admission: baseInputs.cost_per_admission,
    cost_per_bed_day: baseInputs.cost_per_bed_day,
    qaly_loss_per_serious_fall: baseInputs.qaly_loss_per_serious_fall,
  };
}