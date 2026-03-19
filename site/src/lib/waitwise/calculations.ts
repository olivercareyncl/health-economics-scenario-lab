import { COSTING_METHOD_MAP, SCENARIO_MAP, TARGETING_MODE_MAP } from "@/lib/waitwise/scenarios";
import type {
  ComparatorOption,
  Inputs,
  ModelResults,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/waitwise/types";

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
  return 1 / (1 + discountRate) ** (year - 1);
}

export function getTargetingAdjustments(inputs: Inputs) {
  const targeting = TARGETING_MODE_MAP[inputs.targeting_mode];
  const adjustedWaitingList =
    inputs.starting_waiting_list_size * targeting.population_multiplier;
  const adjustedReachRate = clampRate(
    inputs.intervention_reach_rate * targeting.reach_multiplier,
  );
  const adjustedEscalationRate = clampRate(
    inputs.monthly_escalation_rate * targeting.risk_multiplier,
  );

  return {
    adjusted_waiting_list: adjustedWaitingList,
    adjusted_reach_rate: adjustedReachRate,
    adjusted_escalation_rate: adjustedEscalationRate,
  };
}

export function calculateGrossSavings(
  escalationsAvoided: number,
  admissionsAvoided: number,
  bedDaysAvoided: number,
  inputs: Inputs,
): number {
  const costing = COSTING_METHOD_MAP[inputs.costing_method];

  const escalationAndAdmissionSavings =
    escalationsAvoided * inputs.cost_per_escalation +
    admissionsAvoided * inputs.cost_per_admission;

  const bedDayValue = bedDaysAvoided * inputs.cost_per_bed_day;

  if (costing.mode === "acute") {
    return escalationAndAdmissionSavings;
  }

  if (costing.mode === "bed_day") {
    return bedDayValue;
  }

  return escalationAndAdmissionSavings + bedDayValue;
}

function runModelCore(inputs: Inputs): ModelResults {
  const targeting = getTargetingAdjustments(inputs);

  const startingWaitingList = targeting.adjusted_waiting_list;
  const monthlyInflow = inputs.monthly_inflow;
  const monthlyThroughput = inputs.baseline_monthly_throughput;

  const yearlyRows: YearlyResultRow[] = [];
  let cumulativeProgrammeCost = 0;
  let cumulativeGrossSavings = 0;
  let cumulativeNetCost = 0;
  let waitingListCurrent = startingWaitingList;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const effectMultiplier = (1 - inputs.effect_decay_rate) ** (year - 1);
    const participationMultiplier =
      (1 - inputs.participation_dropoff_rate) ** (year - 1);

    const effectiveReach =
      targeting.adjusted_reach_rate * participationMultiplier;
    const demandReduction =
      inputs.demand_reduction_effect * effectMultiplier;
    const throughputIncrease =
      inputs.throughput_increase_effect * effectMultiplier;
    const escalationReduction =
      inputs.escalation_reduction_effect * effectMultiplier;

    const annualInflow = monthlyInflow * 12;
    const annualBaselineThroughput = monthlyThroughput * 12;

    const reducedInflow =
      annualInflow * (1 - demandReduction * effectiveReach);
    const improvedThroughput =
      annualBaselineThroughput * (1 + throughputIncrease * effectiveReach);

    const waitingListNext = Math.max(
      waitingListCurrent + reducedInflow - improvedThroughput,
      0,
    );
    const baselineWaitingListNext = Math.max(
      waitingListCurrent + annualInflow - annualBaselineThroughput,
      0,
    );

    const waitingListReduction = Math.max(
      baselineWaitingListNext - waitingListNext,
      0,
    );

    const annualEscalationsBaseline =
      waitingListCurrent * targeting.adjusted_escalation_rate * 12;
    const escalationsAvoided =
      annualEscalationsBaseline * escalationReduction * effectiveReach;
    const admissionsAvoided =
      escalationsAvoided * inputs.admission_rate_after_escalation;
    const bedDaysAvoided =
      admissionsAvoided * inputs.average_length_of_stay;

    const patientsReached = waitingListCurrent * effectiveReach;
    const programmeCost =
      patientsReached * inputs.intervention_cost_per_patient_reached;

    const grossSavings = calculateGrossSavings(
      escalationsAvoided,
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );

    const netCost = programmeCost - grossSavings;
    const qalysGained =
      escalationsAvoided * inputs.qaly_gain_per_escalation_avoided;

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
      waiting_list_start: waitingListCurrent,
      waiting_list_end: waitingListNext,
      waiting_list_reduction: waitingListReduction,
      escalations_avoided: escalationsAvoided,
      admissions_avoided: admissionsAvoided,
      bed_days_avoided: bedDaysAvoided,
      patients_reached: patientsReached,
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

    waitingListCurrent = waitingListNext;
  }

  const waitingListReductionTotal = yearlyRows.reduce(
    (sum, row) => sum + row.waiting_list_reduction,
    0,
  );
  const escalationsAvoidedTotal = yearlyRows.reduce(
    (sum, row) => sum + row.escalations_avoided,
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
    waiting_list_start_year_1: yearlyRows[0]?.waiting_list_start ?? 0,
    waiting_list_end_final: yearlyRows.at(-1)?.waiting_list_end ?? 0,
    waiting_list_reduction_total: waitingListReductionTotal,
    escalations_avoided_total: escalationsAvoidedTotal,
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
    break_even_effect_required: 0,
    break_even_cost_per_patient: 0,
    break_even_horizon: "",
  };
}

export function calculateBreakEvenEffect(inputs: Inputs): number {
  const targeting = getTargetingAdjustments(inputs);
  const waitingListBase = targeting.adjusted_waiting_list;

  let numerator = 0;
  let denominator = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier =
      (1 - inputs.participation_dropoff_rate) ** (year - 1);
    const effectMultiplier =
      (1 - inputs.effect_decay_rate) ** (year - 1);
    const effectiveReach =
      targeting.adjusted_reach_rate * participationMultiplier;

    const patientsReached = waitingListBase * effectiveReach;
    const escalationsAvoidedPerUnit =
      waitingListBase *
      targeting.adjusted_escalation_rate *
      12 *
      effectMultiplier *
      effectiveReach;

    const admissionsAvoidedPerUnit =
      escalationsAvoidedPerUnit * inputs.admission_rate_after_escalation;
    const bedDaysAvoidedPerUnit =
      admissionsAvoidedPerUnit * inputs.average_length_of_stay;

    const grossSavingsPerUnit = calculateGrossSavings(
      escalationsAvoidedPerUnit,
      admissionsAvoidedPerUnit,
      bedDaysAvoidedPerUnit,
      inputs,
    );

    const qalyValuePerUnit =
      escalationsAvoidedPerUnit *
      inputs.qaly_gain_per_escalation_avoided *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);
    numerator +=
      patientsReached *
      inputs.intervention_cost_per_patient_reached *
      discountFactor;
    denominator += (grossSavingsPerUnit + qalyValuePerUnit) * discountFactor;
  }

  return safeDivide(numerator, denominator);
}

export function calculateBreakEvenCostPerPatient(inputs: Inputs): number {
  const targeting = getTargetingAdjustments(inputs);
  const waitingListBase = targeting.adjusted_waiting_list;

  let totalDiscountedPatientsReached = 0;
  let totalDiscountedValue = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier =
      (1 - inputs.participation_dropoff_rate) ** (year - 1);
    const effectMultiplier =
      (1 - inputs.effect_decay_rate) ** (year - 1);
    const effectiveReach =
      targeting.adjusted_reach_rate * participationMultiplier;

    const patientsReached = waitingListBase * effectiveReach;

    const blendedEffect =
      (inputs.demand_reduction_effect +
        inputs.throughput_increase_effect +
        inputs.escalation_reduction_effect) /
      3;

    const escalationsAvoided =
      waitingListBase *
      targeting.adjusted_escalation_rate *
      12 *
      blendedEffect *
      effectMultiplier *
      effectiveReach;

    const admissionsAvoided =
      escalationsAvoided * inputs.admission_rate_after_escalation;
    const bedDaysAvoided =
      admissionsAvoided * inputs.average_length_of_stay;

    const grossSavings = calculateGrossSavings(
      escalationsAvoided,
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );

    const qalyValue =
      escalationsAvoided *
      inputs.qaly_gain_per_escalation_avoided *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);
    totalDiscountedPatientsReached += patientsReached * discountFactor;
    totalDiscountedValue += (grossSavings + qalyValue) * discountFactor;
  }

  return safeDivide(totalDiscountedValue, totalDiscountedPatientsReached);
}

export function calculateBreakEvenHorizon(
  inputs: Inputs,
  maxYears = 10,
): string {
  for (let horizon = 1; horizon <= maxYears; horizon += 1) {
    const testInputs: Inputs = {
      ...inputs,
      time_horizon_years: horizon as Inputs["time_horizon_years"],
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
    break_even_effect_required: clampRate(calculateBreakEvenEffect(inputs)),
    break_even_cost_per_patient: calculateBreakEvenCostPerPatient(inputs),
    break_even_horizon: calculateBreakEvenHorizon(inputs, 10),
  };
}

export function getDecisionStatusForResult(
  discountedNetCostTotal: number,
  discountedCostPerQaly: number,
  threshold: number,
): string {
  if (discountedNetCostTotal < 0) {
    return "Appears cost-saving";
  }

  if (discountedCostPerQaly > 0 && discountedCostPerQaly <= threshold) {
    return "Appears cost-effective";
  }

  return "Above current threshold";
}

export function runBoundedUncertainty(inputs: Inputs): UncertaintyRow[] {
  const cases = [
    {
      case: "Low",
      dominantDomain: "Delivery assumptions",
      overrides: {
        demand_reduction_effect: clampRate(inputs.demand_reduction_effect * 0.8),
        throughput_increase_effect: clampRate(
          inputs.throughput_increase_effect * 0.8,
        ),
        escalation_reduction_effect: clampRate(
          inputs.escalation_reduction_effect * 0.8,
        ),
        intervention_cost_per_patient_reached:
          inputs.intervention_cost_per_patient_reached * 1.2,
        qaly_gain_per_escalation_avoided:
          inputs.qaly_gain_per_escalation_avoided * 0.8,
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 1.2,
        ),
      },
    },
    {
      case: "Base",
      dominantDomain: "Base case",
      overrides: {},
    },
    {
      case: "High",
      dominantDomain: "Clinical and delivery assumptions",
      overrides: {
        demand_reduction_effect: clampRate(inputs.demand_reduction_effect * 1.2),
        throughput_increase_effect: clampRate(
          inputs.throughput_increase_effect * 1.2,
        ),
        escalation_reduction_effect: clampRate(
          inputs.escalation_reduction_effect * 1.2,
        ),
        intervention_cost_per_patient_reached:
          inputs.intervention_cost_per_patient_reached * 0.8,
        qaly_gain_per_escalation_avoided:
          inputs.qaly_gain_per_escalation_avoided * 1.2,
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 0.8,
        ),
      },
    },
  ] as const;

  return cases.map((caseConfig) => {
    const caseInputs: Inputs = {
      ...inputs,
      ...caseConfig.overrides,
    };

    const result = runModelCore(caseInputs);
    const decisionStatus = getDecisionStatusForResult(
      result.discounted_net_cost_total,
      result.discounted_cost_per_qaly,
      inputs.cost_effectiveness_threshold,
    );

    return {
      case: caseConfig.case,
      waiting_list_reduction_total: result.waiting_list_reduction_total,
      discounted_net_cost_total: result.discounted_net_cost_total,
      discounted_cost_per_qaly: result.discounted_cost_per_qaly,
      dominant_domain: caseConfig.dominantDomain,
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

  const scenarioBuilder = SCENARIO_MAP[comparatorMode];
  if (scenarioBuilder) {
    Object.assign(comparatorInputs, scenarioBuilder(defaults));
  } else {
    Object.assign(comparatorInputs, baseInputs);
  }

  comparatorInputs.time_horizon_years = baseInputs.time_horizon_years;
  comparatorInputs.discount_rate = baseInputs.discount_rate;
  comparatorInputs.costing_method = baseInputs.costing_method;
  comparatorInputs.cost_effectiveness_threshold =
    baseInputs.cost_effectiveness_threshold;
  comparatorInputs.cost_per_escalation = baseInputs.cost_per_escalation;
  comparatorInputs.cost_per_admission = baseInputs.cost_per_admission;
  comparatorInputs.cost_per_bed_day = baseInputs.cost_per_bed_day;
  comparatorInputs.qaly_gain_per_escalation_avoided =
    baseInputs.qaly_gain_per_escalation_avoided;

  return comparatorInputs;
}