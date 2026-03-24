import { COSTING_METHOD_MAP } from "@/lib/pathshift/scenarios";
import type {
  Inputs,
  ModelResults,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/pathshift/types";

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
  const adjusted_cohort =
    inputs.annual_cohort_size * inputs.target_population_multiplier;

  const adjusted_reach_rate = clampRate(
    inputs.implementation_reach_rate * inputs.target_reach_multiplier,
  );

  const adjusted_admission_rate = clampRate(
    inputs.current_admission_rate * inputs.target_admission_risk_multiplier,
  );

  return {
    adjusted_cohort,
    adjusted_reach_rate,
    adjusted_admission_rate,
  };
}

export function calculateGrossSavings(
  admissionsAvoided: number,
  followUpsAvoided: number,
  bedDaysAvoided: number,
  acuteToCommunityShift: number,
  inputs: Inputs,
): number {
  const costing = COSTING_METHOD_MAP[inputs.costing_method];

  const admissionAndFollowUpSavings =
    admissionsAvoided * inputs.cost_per_admission +
    followUpsAvoided * inputs.cost_per_follow_up_contact +
    acuteToCommunityShift *
      (inputs.cost_per_acute_managed_patient -
        inputs.cost_per_community_managed_patient);

  const bedDayValue = bedDaysAvoided * inputs.cost_per_bed_day;

  if (costing.mode === "admission_followup") return admissionAndFollowUpSavings;
  if (costing.mode === "bed_day") return bedDayValue;
  return admissionAndFollowUpSavings + bedDayValue;
}

function runModelCore(
  inputs: Inputs,
): Omit<
  ModelResults,
  | "break_even_effect_required"
  | "break_even_cost_per_patient"
  | "break_even_horizon"
> {
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

    const settingShiftRate = clampRate(
      inputs.proportion_shifted_to_lower_cost_setting * effectMultiplier,
    );
    const admissionReductionRate = clampRate(
      inputs.reduction_in_admission_rate * effectMultiplier,
    );
    const followUpReductionRate = clampRate(
      inputs.reduction_in_follow_up_contacts * effectMultiplier,
    );
    const losReductionRate = clampRate(
      inputs.reduction_in_length_of_stay * effectMultiplier,
    );

    const patients_shifted_in_pathway = patientsReached * settingShiftRate;
    const acuteToCommunityShift = patients_shifted_in_pathway;

    const admissionsBaseline =
      patientsReached * targeting.adjusted_admission_rate;
    const admissions_avoided = admissionsBaseline * admissionReductionRate;

    const followUpsBaseline =
      patientsReached * inputs.current_follow_up_contacts_per_patient;
    const follow_ups_avoided = followUpsBaseline * followUpReductionRate;

    const baselineBedDays =
      admissionsBaseline * inputs.current_average_length_of_stay;
    const bedDaysAvoidedFromAdmissions =
      admissions_avoided * inputs.current_average_length_of_stay;
    const bedDaysAvoidedFromLos = baselineBedDays * losReductionRate;
    const bed_days_avoided =
      bedDaysAvoidedFromAdmissions + bedDaysAvoidedFromLos;

    const programme_cost = patientsReached * inputs.redesign_cost_per_patient;

    const gross_savings = calculateGrossSavings(
      admissions_avoided,
      follow_ups_avoided,
      bed_days_avoided,
      acuteToCommunityShift,
      inputs,
    );

    const net_cost = programme_cost - gross_savings;

    const qalys_gained =
      patientsReached *
      settingShiftRate *
      inputs.qaly_gain_per_patient_improved;

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
      patients_shifted_in_pathway,
      admissions_avoided,
      follow_ups_avoided,
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

  const patients_shifted_total = yearlyRows.reduce(
    (sum, row) => sum + row.patients_shifted_in_pathway,
    0,
  );
  const admissions_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.admissions_avoided,
    0,
  );
  const follow_ups_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.follow_ups_avoided,
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
    patients_shifted_total,
    admissions_avoided_total,
    follow_ups_avoided_total,
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

    const admissionsPerUnit =
      patientsReached * targeting.adjusted_admission_rate * effectMultiplier;
    const followUpsPerUnit =
      patientsReached *
      inputs.current_follow_up_contacts_per_patient *
      effectMultiplier;
    const bedDaysPerUnit =
      patientsReached *
      targeting.adjusted_admission_rate *
      inputs.current_average_length_of_stay *
      effectMultiplier;
    const acuteShiftPerUnit = patientsReached * effectMultiplier;

    const grossSavingsPerUnit = calculateGrossSavings(
      admissionsPerUnit,
      followUpsPerUnit,
      bedDaysPerUnit,
      acuteShiftPerUnit,
      inputs,
    );

    const qalyValuePerUnit =
      patientsReached *
      effectMultiplier *
      inputs.qaly_gain_per_patient_improved *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    numerator +=
      patientsReached * inputs.redesign_cost_per_patient * discountFactor;
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

    const settingShiftRate = clampRate(
      inputs.proportion_shifted_to_lower_cost_setting * effectMultiplier,
    );
    const admissionReductionRate = clampRate(
      inputs.reduction_in_admission_rate * effectMultiplier,
    );
    const followUpReductionRate = clampRate(
      inputs.reduction_in_follow_up_contacts * effectMultiplier,
    );
    const losReductionRate = clampRate(
      inputs.reduction_in_length_of_stay * effectMultiplier,
    );

    const patientsShifted = patientsReached * settingShiftRate;
    const admissionsBaseline =
      patientsReached * targeting.adjusted_admission_rate;
    const admissionsAvoided = admissionsBaseline * admissionReductionRate;
    const followUpsAvoided =
      patientsReached *
      inputs.current_follow_up_contacts_per_patient *
      followUpReductionRate;

    const baselineBedDays =
      admissionsBaseline * inputs.current_average_length_of_stay;
    const bedDaysAvoided =
      admissionsAvoided * inputs.current_average_length_of_stay +
      baselineBedDays * losReductionRate;

    const grossSavings = calculateGrossSavings(
      admissionsAvoided,
      followUpsAvoided,
      bedDaysAvoided,
      patientsShifted,
      inputs,
    );

    const qalyValue =
      patientsShifted *
      inputs.qaly_gain_per_patient_improved *
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
    const allowedHorizon: 1 | 3 | 5 =
      horizon <= 1 ? 1 : horizon <= 3 ? 3 : 5;

    const testInputs: Inputs = {
      ...inputs,
      time_horizon_years: allowedHorizon,
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
      case: "Low" as const,
      dominant_domain: "Delivery assumptions",
      overrides: {
        proportion_shifted_to_lower_cost_setting: clampRate(
          inputs.proportion_shifted_to_lower_cost_setting * 0.8,
        ),
        reduction_in_admission_rate: clampRate(
          inputs.reduction_in_admission_rate * 0.8,
        ),
        reduction_in_follow_up_contacts: clampRate(
          inputs.reduction_in_follow_up_contacts * 0.8,
        ),
        reduction_in_length_of_stay: clampRate(
          inputs.reduction_in_length_of_stay * 0.8,
        ),
        redesign_cost_per_patient: inputs.redesign_cost_per_patient * 1.2,
        qaly_gain_per_patient_improved:
          inputs.qaly_gain_per_patient_improved * 0.8,
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 1.2,
        ),
      },
    },
    {
      case: "Base" as const,
      dominant_domain: "Base case",
      overrides: {},
    },
    {
      case: "High" as const,
      dominant_domain: "Clinical and delivery assumptions",
      overrides: {
        proportion_shifted_to_lower_cost_setting: clampRate(
          inputs.proportion_shifted_to_lower_cost_setting * 1.2,
        ),
        reduction_in_admission_rate: clampRate(
          inputs.reduction_in_admission_rate * 1.2,
        ),
        reduction_in_follow_up_contacts: clampRate(
          inputs.reduction_in_follow_up_contacts * 1.2,
        ),
        reduction_in_length_of_stay: clampRate(
          inputs.reduction_in_length_of_stay * 1.2,
        ),
        redesign_cost_per_patient: inputs.redesign_cost_per_patient * 0.8,
        qaly_gain_per_patient_improved:
          inputs.qaly_gain_per_patient_improved * 1.2,
        participation_dropoff_rate: clampRate(
          inputs.participation_dropoff_rate * 0.8,
        ),
      },
    },
  ] as const;

  return cases.map((scenario) => {
    const caseInputs: Inputs = {
      ...inputs,
      ...scenario.overrides,
    };

    const result = runModelCore(caseInputs);

    const decision_status = getDecisionStatusForResult(
      result.discounted_net_cost_total,
      result.discounted_cost_per_qaly,
      inputs.cost_effectiveness_threshold,
    );

    return {
      case: scenario.case,
      patients_shifted_total: result.patients_shifted_total,
      discounted_net_cost_total: result.discounted_net_cost_total,
      discounted_cost_per_qaly: result.discounted_cost_per_qaly,
      dominant_domain: scenario.dominant_domain,
      decision_status,
    };
  });
}