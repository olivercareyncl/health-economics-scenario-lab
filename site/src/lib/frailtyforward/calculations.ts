import { COSTING_METHOD_MAP, SCENARIO_MAP, TARGETING_MODE_MAP } from "@/lib/frailtyforward/scenarios";
import type {
  ComparatorOption,
  Inputs,
  ModelResults,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/frailtyforward/types";

export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
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
  const adjusted_cohort =
    inputs.annual_frailty_cohort_size * targeting.population_multiplier;
  const adjusted_reach_rate = clampRate(
    inputs.implementation_reach_rate * targeting.reach_multiplier,
  );
  const adjusted_crisis_rate = clampRate(
    inputs.baseline_crisis_event_rate * targeting.risk_multiplier,
  );
  const adjusted_admission_rate = clampRate(
    inputs.baseline_non_elective_admission_rate * targeting.risk_multiplier,
  );

  return {
    adjusted_cohort,
    adjusted_reach_rate,
    adjusted_crisis_rate,
    adjusted_admission_rate,
  };
}

export function calculateGrossSavings(
  crisisEventsAvoided: number,
  admissionsAvoided: number,
  bedDaysAvoided: number,
  inputs: Inputs,
): number {
  const costing = COSTING_METHOD_MAP[inputs.costing_method];

  const admissionAndCrisisSavings =
    crisisEventsAvoided * inputs.cost_per_crisis_event +
    admissionsAvoided * inputs.cost_per_admission;

  const bedDayValue = bedDaysAvoided * inputs.cost_per_bed_day;

  if (costing.mode === "admission_crisis") return admissionAndCrisisSavings;
  if (costing.mode === "bed_day") return bedDayValue;
  return admissionAndCrisisSavings + bedDayValue;
}

function runModelCore(inputs: Inputs) {
  const targeting = getTargetingAdjustments(inputs);
  const baseReachedPatients =
    targeting.adjusted_cohort * targeting.adjusted_reach_rate;

  const yearlyRows: YearlyResultRow[] = [];
  let cumulativeProgrammeCost = 0;
  let cumulativeGrossSavings = 0;
  let cumulativeNetCost = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const effectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);
    const participationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );

    const patientsReached = baseReachedPatients * participationMultiplier;

    const crisisReductionRate = clampRate(
      inputs.reduction_in_crisis_event_rate * effectMultiplier,
    );
    const admissionReductionRate = clampRate(
      inputs.reduction_in_admission_rate * effectMultiplier,
    );
    const losReductionRate = clampRate(
      inputs.reduction_in_length_of_stay * effectMultiplier,
    );

    const patients_stabilised = patientsReached * crisisReductionRate;

    const crisisEventsBaseline = patientsReached * targeting.adjusted_crisis_rate;
    const crisis_events_avoided = crisisEventsBaseline * crisisReductionRate;

    const admissionsBaseline = patientsReached * targeting.adjusted_admission_rate;
    const admissions_avoided = admissionsBaseline * admissionReductionRate;

    const baselineBedDays =
      admissionsBaseline * inputs.current_average_length_of_stay;
    const bedDaysAvoidedFromAdmissions =
      admissions_avoided * inputs.current_average_length_of_stay;
    const bedDaysAvoidedFromLos = baselineBedDays * losReductionRate;
    const bed_days_avoided =
      bedDaysAvoidedFromAdmissions + bedDaysAvoidedFromLos;

    const programme_cost = patientsReached * inputs.support_cost_per_patient;
    const gross_savings = calculateGrossSavings(
      crisis_events_avoided,
      admissions_avoided,
      bed_days_avoided,
      inputs,
    );
    const net_cost = programme_cost - gross_savings;
    const qalys_gained =
      patients_stabilised * inputs.qaly_gain_per_patient_stabilised;

    const discount_factor = getDiscountFactor(year, inputs.discount_rate);
    const discounted_programme_cost = programme_cost * discount_factor;
    const discounted_gross_savings = gross_savings * discount_factor;
    const discounted_net_cost = net_cost * discount_factor;
    const discounted_qalys = qalys_gained * discount_factor;

    cumulativeProgrammeCost += programme_cost;
    cumulativeGrossSavings += gross_savings;
    cumulativeNetCost += net_cost;

    yearlyRows.push({
      year,
      patients_reached: patientsReached,
      patients_stabilised,
      crisis_events_avoided,
      admissions_avoided,
      bed_days_avoided,
      programme_cost,
      gross_savings,
      net_cost,
      qalys_gained,
      discount_factor,
      discounted_programme_cost,
      discounted_gross_savings,
      discounted_net_cost,
      discounted_qalys,
      cumulative_programme_cost: cumulativeProgrammeCost,
      cumulative_gross_savings: cumulativeGrossSavings,
      cumulative_net_cost: cumulativeNetCost,
    });
  }

  const patients_stabilised_total = yearlyRows.reduce(
    (sum, row) => sum + row.patients_stabilised,
    0,
  );
  const crisis_events_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.crisis_events_avoided,
    0,
  );
  const admissions_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.admissions_avoided,
    0,
  );
  const bed_days_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.bed_days_avoided,
    0,
  );
  const programme_cost_total = yearlyRows.reduce(
    (sum, row) => sum + row.programme_cost,
    0,
  );
  const gross_savings_total = yearlyRows.reduce(
    (sum, row) => sum + row.gross_savings,
    0,
  );
  const discounted_programme_cost_total = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_programme_cost,
    0,
  );
  const discounted_gross_savings_total = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_gross_savings,
    0,
  );
  const discounted_net_cost_total = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_net_cost,
    0,
  );
  const discounted_qalys_total = yearlyRows.reduce(
    (sum, row) => sum + row.discounted_qalys,
    0,
  );

  const discounted_cost_per_qaly = safeDivide(
    discounted_net_cost_total,
    discounted_qalys_total,
  );
  const roi = safeDivide(gross_savings_total, programme_cost_total);

  return {
    patients_stabilised_total,
    crisis_events_avoided_total,
    admissions_avoided_total,
    bed_days_avoided_total,
    programme_cost_total,
    gross_savings_total,
    discounted_programme_cost_total,
    discounted_gross_savings_total,
    discounted_net_cost_total,
    discounted_qalys_total,
    discounted_cost_per_qaly,
    roi,
    yearly_results: yearlyRows,
  };
}

export function calculateBreakEvenEffect(inputs: Inputs): number {
  const targeting = getTargetingAdjustments(inputs);
  const baseReachedPatients =
    targeting.adjusted_cohort * targeting.adjusted_reach_rate;

  let numerator = 0;
  let denominator = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);

    const patientsReached = baseReachedPatients * participationMultiplier;

    const crisisEventsPerUnit =
      patientsReached * targeting.adjusted_crisis_rate * effectMultiplier;
    const admissionsPerUnit =
      patientsReached * targeting.adjusted_admission_rate * effectMultiplier;
    const bedDaysPerUnit =
      patientsReached *
      targeting.adjusted_admission_rate *
      inputs.current_average_length_of_stay *
      effectMultiplier;

    const grossSavingsPerUnit = calculateGrossSavings(
      crisisEventsPerUnit,
      admissionsPerUnit,
      bedDaysPerUnit,
      inputs,
    );
    const qalyValuePerUnit =
      patientsReached *
      effectMultiplier *
      inputs.qaly_gain_per_patient_stabilised *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);
    numerator += patientsReached * inputs.support_cost_per_patient * discountFactor;
    denominator += (grossSavingsPerUnit + qalyValuePerUnit) * discountFactor;
  }

  return safeDivide(numerator, denominator);
}

export function calculateBreakEvenCostPerPatient(inputs: Inputs): number {
  const targeting = getTargetingAdjustments(inputs);
  const baseReachedPatients =
    targeting.adjusted_cohort * targeting.adjusted_reach_rate;

  let totalDiscountedPatientsReached = 0;
  let totalDiscountedValue = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(1 - inputs.effect_decay_rate, year - 1);

    const patientsReached = baseReachedPatients * participationMultiplier;

    const crisisReductionRate = clampRate(
      inputs.reduction_in_crisis_event_rate * effectMultiplier,
    );
    const admissionReductionRate = clampRate(
      inputs.reduction_in_admission_rate * effectMultiplier,
    );
    const losReductionRate = clampRate(
      inputs.reduction_in_length_of_stay * effectMultiplier,
    );

    const patientsStabilised = patientsReached * crisisReductionRate;
    const crisisEventsBaseline = patientsReached * targeting.adjusted_crisis_rate;
    const crisisEventsAvoided = crisisEventsBaseline * crisisReductionRate;
    const admissionsBaseline = patientsReached * targeting.adjusted_admission_rate;
    const admissionsAvoided = admissionsBaseline * admissionReductionRate;

    const baselineBedDays =
      admissionsBaseline * inputs.current_average_length_of_stay;
    const bedDaysAvoided =
      admissionsAvoided * inputs.current_average_length_of_stay +
      baselineBedDays * losReductionRate;

    const grossSavings = calculateGrossSavings(
      crisisEventsAvoided,
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );
    const qalyValue =
      patientsStabilised *
      inputs.qaly_gain_per_patient_stabilised *
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
    const testInputs = {
      ...inputs,
      time_horizon_years: horizon as 1 | 3 | 5,
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

export function runBoundedUncertainty(inputs: Inputs): UncertaintyRow[] {
  const cases = [
    {
      case: "Low" as const,
      overrides: {
        reduction_in_crisis_event_rate: clampRate(
          inputs.reduction_in_crisis_event_rate * 0.8,
        ),
        reduction_in_admission_rate: clampRate(
          inputs.reduction_in_admission_rate * 0.8,
        ),
        reduction_in_length_of_stay: clampRate(
          inputs.reduction_in_length_of_stay * 0.8,
        ),
        support_cost_per_patient: inputs.support_cost_per_patient * 1.2,
        qaly_gain_per_patient_stabilised:
          inputs.qaly_gain_per_patient_stabilised * 0.8,
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
        reduction_in_crisis_event_rate: clampRate(
          inputs.reduction_in_crisis_event_rate * 1.2,
        ),
        reduction_in_admission_rate: clampRate(
          inputs.reduction_in_admission_rate * 1.2,
        ),
        reduction_in_length_of_stay: clampRate(
          inputs.reduction_in_length_of_stay * 1.2,
        ),
        support_cost_per_patient: inputs.support_cost_per_patient * 0.8,
        qaly_gain_per_patient_stabilised:
          inputs.qaly_gain_per_patient_stabilised * 1.2,
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

    const decision_status =
      result.discounted_net_cost_total < 0
        ? "Appears cost-saving"
        : result.discounted_cost_per_qaly > 0 &&
            result.discounted_cost_per_qaly <=
              inputs.cost_effectiveness_threshold
          ? "Appears cost-effective"
          : "Above current threshold";

    return {
      case: scenario.case,
      patients_stabilised_total: result.patients_stabilised_total,
      discounted_net_cost_total: result.discounted_net_cost_total,
      discounted_cost_per_qaly: result.discounted_cost_per_qaly,
      dominant_domain: scenario.dominant_domain,
      decision_status,
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
    Object.assign(
      comparatorInputs,
      SCENARIO_MAP[comparatorMode as keyof typeof SCENARIO_MAP](defaults),
    );
  } else {
    Object.assign(comparatorInputs, baseInputs);
  }

  comparatorInputs.time_horizon_years = baseInputs.time_horizon_years;
  comparatorInputs.discount_rate = baseInputs.discount_rate;
  comparatorInputs.costing_method = baseInputs.costing_method;
  comparatorInputs.cost_effectiveness_threshold =
    baseInputs.cost_effectiveness_threshold;
  comparatorInputs.cost_per_crisis_event = baseInputs.cost_per_crisis_event;
  comparatorInputs.cost_per_admission = baseInputs.cost_per_admission;
  comparatorInputs.cost_per_bed_day = baseInputs.cost_per_bed_day;
  comparatorInputs.qaly_gain_per_patient_stabilised =
    baseInputs.qaly_gain_per_patient_stabilised;

  return comparatorInputs;
}