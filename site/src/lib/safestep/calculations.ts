import { COSTING_METHOD_MAP } from "./scenarios";
import type {
  ModelResult,
  ParameterSensitivityRow,
  SafeStepInputs,
  SensitivitySummary,
  TargetingAdjustmentsResult,
  UncertaintyRow,
  YearlyResultRow,
} from "./types";

export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function clampRate(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getDiscountFactor(year: number, discountRate: number): number {
  return 1 / (1 + discountRate) ** (year - 1);
}

export function getTargetingAdjustments(
  inputs: SafeStepInputs,
): TargetingAdjustmentsResult {
  return {
    adjusted_eligible_population:
      inputs.eligible_population * inputs.target_population_multiplier,
    adjusted_annual_fall_risk: clampRate(
      inputs.annual_fall_risk * inputs.target_fall_risk_multiplier,
    ),
    adjusted_uptake_rate: clampRate(
      inputs.uptake_rate * inputs.target_uptake_multiplier,
    ),
  };
}

export function calculateGrossSavings(
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
      inputs.relative_risk_reduction *
      (1 - inputs.effect_decay_rate) ** (year - 1);
    annualEffectiveness = clampRate(annualEffectiveness);

    const treatedPopulation =
      baseTreatedPopulation *
      (1 - inputs.participation_dropoff_rate) ** (year - 1);

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
      baseTreatedPopulation *
      (1 - inputs.participation_dropoff_rate) ** (year - 1);

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
      baseTreatedPopulation *
      (1 - inputs.participation_dropoff_rate) ** (year - 1);

    let annualEffectiveness =
      inputs.relative_risk_reduction *
      (1 - inputs.effect_decay_rate) ** (year - 1);
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
  const allowedHorizons = ([1, 3, 5] as const).filter(
    (horizon) => horizon <= maxYears,
  );

  for (const horizon of allowedHorizons) {
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

function formatSensitivityValue(
  parameter: keyof SafeStepInputs,
  value: number,
): string {
  switch (parameter) {
    case "uptake_rate":
    case "adherence_rate":
    case "annual_fall_risk":
    case "admission_rate_after_fall":
    case "relative_risk_reduction":
    case "effect_decay_rate":
    case "participation_dropoff_rate":
    case "discount_rate":
      return `${(value * 100).toFixed(1)}%`;

    case "intervention_cost_per_person":
    case "cost_per_admission":
    case "cost_per_bed_day":
    case "cost_effectiveness_threshold":
      return `£${Math.round(value).toLocaleString()}`;

    case "average_length_of_stay":
    case "qaly_loss_per_serious_fall":
    case "target_population_multiplier":
    case "target_uptake_multiplier":
    case "target_fall_risk_multiplier":
      return value.toFixed(2);

    case "eligible_population":
    case "time_horizon_years":
      return Math.round(value).toLocaleString();

    default:
      return String(value);
  }
}

function getSensitivityParameterLabel(
  parameter: keyof SafeStepInputs,
): string {
  switch (parameter) {
    case "eligible_population":
      return "Eligible population";
    case "uptake_rate":
      return "Uptake rate";
    case "adherence_rate":
      return "Adherence rate";
    case "target_population_multiplier":
      return "Target population multiplier";
    case "target_uptake_multiplier":
      return "Target uptake multiplier";
    case "target_fall_risk_multiplier":
      return "Target fall-risk multiplier";
    case "annual_fall_risk":
      return "Annual fall risk";
    case "admission_rate_after_fall":
      return "Admission rate after fall";
    case "average_length_of_stay":
      return "Average length of stay";
    case "intervention_cost_per_person":
      return "Intervention cost per person";
    case "relative_risk_reduction":
      return "Relative risk reduction";
    case "effect_decay_rate":
      return "Effect decay";
    case "participation_dropoff_rate":
      return "Participation drop-off";
    case "cost_per_admission":
      return "Cost per admission";
    case "cost_per_bed_day":
      return "Cost per bed day";
    case "qaly_loss_per_serious_fall":
      return "QALY loss per serious fall";
    case "cost_effectiveness_threshold":
      return "Cost-effectiveness threshold";
    case "time_horizon_years":
      return "Time horizon";
    case "discount_rate":
      return "Discount rate";
    case "costing_method":
      return "Costing method";
    default:
      return String(parameter);
  }
}

function buildSensitivityVariants(
  parameter: keyof SafeStepInputs,
  inputs: SafeStepInputs,
): { lowValue: number; highValue: number } | null {
  const currentValue = inputs[parameter];

  if (typeof currentValue !== "number") return null;

  switch (parameter) {
    case "eligible_population":
      return {
        lowValue: Math.max(1, Math.round(currentValue * 0.8)),
        highValue: Math.max(1, Math.round(currentValue * 1.2)),
      };

    case "time_horizon_years":
      return null;

    case "average_length_of_stay":
    case "qaly_loss_per_serious_fall":
    case "intervention_cost_per_person":
    case "cost_per_admission":
    case "cost_per_bed_day":
    case "cost_effectiveness_threshold":
    case "target_population_multiplier":
    case "target_uptake_multiplier":
    case "target_fall_risk_multiplier":
      return {
        lowValue: currentValue * 0.8,
        highValue: currentValue * 1.2,
      };

    case "uptake_rate":
    case "adherence_rate":
    case "annual_fall_risk":
    case "admission_rate_after_fall":
    case "relative_risk_reduction":
    case "effect_decay_rate":
    case "participation_dropoff_rate":
    case "discount_rate":
      return {
        lowValue: clampRate(currentValue * 0.8),
        highValue: clampRate(currentValue * 1.2),
      };

    default:
      return null;
  }
}

export function runParameterSensitivity(
  inputs: SafeStepInputs,
): SensitivitySummary {
  const baseResult = runModel(inputs);

  const candidateParameters: Array<keyof SafeStepInputs> = [
    "annual_fall_risk",
    "relative_risk_reduction",
    "intervention_cost_per_person",
    "admission_rate_after_fall",
    "adherence_rate",
    "uptake_rate",
    "target_population_multiplier",
    "target_uptake_multiplier",
    "target_fall_risk_multiplier",
    "average_length_of_stay",
    "participation_dropoff_rate",
    "effect_decay_rate",
    "qaly_loss_per_serious_fall",
    "cost_per_admission",
    "cost_per_bed_day",
    "eligible_population",
  ];

  const rows: ParameterSensitivityRow[] = candidateParameters
    .map((parameter) => {
      const variants = buildSensitivityVariants(parameter, inputs);
      if (!variants) return null;

      const lowInputs: SafeStepInputs = {
        ...inputs,
        [parameter]: variants.lowValue,
      };
      const highInputs: SafeStepInputs = {
        ...inputs,
        [parameter]: variants.highValue,
      };

      const lowResult = runModel(lowInputs);
      const highResult = runModel(highInputs);

      const maxAbsIcerChange = Math.max(
        Math.abs(
          lowResult.discounted_cost_per_qaly -
            baseResult.discounted_cost_per_qaly,
        ),
        Math.abs(
          highResult.discounted_cost_per_qaly -
            baseResult.discounted_cost_per_qaly,
        ),
      );

      return {
        parameter_key: parameter,
        parameter_label: getSensitivityParameterLabel(parameter),
        low_value_label: formatSensitivityValue(parameter, variants.lowValue),
        high_value_label: formatSensitivityValue(parameter, variants.highValue),
        low_icer: lowResult.discounted_cost_per_qaly,
        base_icer: baseResult.discounted_cost_per_qaly,
        high_icer: highResult.discounted_cost_per_qaly,
        low_net_cost: lowResult.discounted_net_cost_total,
        base_net_cost: baseResult.discounted_net_cost_total,
        high_net_cost: highResult.discounted_net_cost_total,
        max_abs_icer_change: maxAbsIcerChange,
      };
    })
    .filter((row): row is ParameterSensitivityRow => row !== null)
    .sort((a, b) => b.max_abs_icer_change - a.max_abs_icer_change);

  const topDrivers = rows.slice(0, 3);

  return {
    rows,
    top_drivers: topDrivers,
    primary_driver: topDrivers[0] ?? null,
  };
}
