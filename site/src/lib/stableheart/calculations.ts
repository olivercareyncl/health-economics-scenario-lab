import {
  COSTING_METHOD_MAP,
  SCENARIO_MAP,
  TARGETING_MODE_MAP,
} from "@/lib/stableheart/scenarios";
import {
  formatCurrency,
  formatPercent,
} from "@/lib/stableheart/formatters";
import type {
  ComparatorOption,
  Inputs,
  ModelResults,
  ParameterSensitivityRow,
  SensitivitySummary,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/stableheart/types";

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
  const adjusted_population =
    inputs.eligible_population * targeting.population_multiplier;
  const adjusted_reach_rate = clampRate(
    inputs.intervention_reach_rate * targeting.reach_multiplier,
  );
  const adjusted_event_rate = clampRate(
    inputs.baseline_recurrent_event_rate * targeting.risk_multiplier,
  );

  return {
    adjusted_population,
    adjusted_reach_rate,
    adjusted_event_rate,
  };
}

export function calculateGrossSavings(
  eventsAvoided: number,
  admissionsAvoided: number,
  bedDaysAvoided: number,
  inputs: Inputs,
): number {
  const costing = COSTING_METHOD_MAP[inputs.costing_method];

  const eventAndAdmissionSavings =
    eventsAvoided * inputs.cost_per_cardiovascular_event +
    admissionsAvoided * inputs.cost_per_admission;

  const bedDayValue = bedDaysAvoided * inputs.cost_per_bed_day;

  if (costing.mode === "event_admission") return eventAndAdmissionSavings;
  if (costing.mode === "bed_day") return bedDayValue;
  return eventAndAdmissionSavings + bedDayValue;
}

function runModelCore(inputs: Inputs) {
  const targeting = getTargetingAdjustments(inputs);
  const baseReachedPatients =
    targeting.adjusted_population * targeting.adjusted_reach_rate;

  const yearlyRows: YearlyResultRow[] = [];
  let cumulativeProgrammeCost = 0;
  let cumulativeGrossSavings = 0;
  let cumulativeNetCost = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const effectMultiplier = Math.pow(
      1 - inputs.annual_effect_decay_rate,
      year - 1,
    );
    const participationMultiplier = Math.pow(
      1 - inputs.annual_participation_dropoff_rate,
      year - 1,
    );

    const patients_reached = baseReachedPatients * participationMultiplier;
    const effective_patients =
      patients_reached * inputs.sustained_engagement_rate;
    const eventRiskReduction = clampRate(
      inputs.risk_reduction_in_recurrent_events * effectMultiplier,
    );

    const baseline_events = effective_patients * targeting.adjusted_event_rate;
    const events_avoided = baseline_events * eventRiskReduction;
    const admissions_avoided =
      events_avoided * inputs.admission_probability_per_event;
    const bed_days_avoided =
      admissions_avoided * inputs.average_length_of_stay;

    const programme_cost =
      patients_reached * inputs.intervention_cost_per_patient_reached;
    const gross_savings = calculateGrossSavings(
      events_avoided,
      admissions_avoided,
      bed_days_avoided,
      inputs,
    );
    const net_cost = programme_cost - gross_savings;
    const qalys_gained = events_avoided * inputs.qaly_gain_per_event_avoided;

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
      patients_reached,
      effective_patients,
      baseline_events,
      events_avoided,
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

  const patients_reached_total = yearlyRows.reduce(
    (sum, row) => sum + row.patients_reached,
    0,
  );
  const events_avoided_total = yearlyRows.reduce(
    (sum, row) => sum + row.events_avoided,
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
    patients_reached_total,
    events_avoided_total,
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

export function calculateBreakEvenRiskReduction(inputs: Inputs): number {
  const targeting = getTargetingAdjustments(inputs);
  const baseReachedPatients =
    targeting.adjusted_population * targeting.adjusted_reach_rate;

  let numerator = 0;
  let denominator = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.annual_participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(
      1 - inputs.annual_effect_decay_rate,
      year - 1,
    );

    const patientsReached = baseReachedPatients * participationMultiplier;
    const effectivePatients =
      patientsReached * inputs.sustained_engagement_rate;

    const eventsPerUnit =
      effectivePatients * targeting.adjusted_event_rate * effectMultiplier;
    const admissionsPerUnit =
      eventsPerUnit * inputs.admission_probability_per_event;
    const bedDaysPerUnit = admissionsPerUnit * inputs.average_length_of_stay;

    const grossSavingsPerUnit = calculateGrossSavings(
      eventsPerUnit,
      admissionsPerUnit,
      bedDaysPerUnit,
      inputs,
    );
    const qalyValuePerUnit =
      eventsPerUnit *
      inputs.qaly_gain_per_event_avoided *
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
  const baseReachedPatients =
    targeting.adjusted_population * targeting.adjusted_reach_rate;

  let totalDiscountedPatientsReached = 0;
  let totalDiscountedValue = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.annual_participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(
      1 - inputs.annual_effect_decay_rate,
      year - 1,
    );

    const patientsReached = baseReachedPatients * participationMultiplier;
    const effectivePatients =
      patientsReached * inputs.sustained_engagement_rate;

    const eventRiskReduction = clampRate(
      inputs.risk_reduction_in_recurrent_events * effectMultiplier,
    );
    const baselineEvents = effectivePatients * targeting.adjusted_event_rate;
    const eventsAvoided = baselineEvents * eventRiskReduction;
    const admissionsAvoided =
      eventsAvoided * inputs.admission_probability_per_event;
    const bedDaysAvoided =
      admissionsAvoided * inputs.average_length_of_stay;

    const grossSavings = calculateGrossSavings(
      eventsAvoided,
      admissionsAvoided,
      bedDaysAvoided,
      inputs,
    );
    const qalyValue =
      eventsAvoided *
      inputs.qaly_gain_per_event_avoided *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    totalDiscountedPatientsReached += patientsReached * discountFactor;
    totalDiscountedValue += (grossSavings + qalyValue) * discountFactor;
  }

  return safeDivide(totalDiscountedValue, totalDiscountedPatientsReached);
}

export function calculateBreakEvenBaselineEventRate(inputs: Inputs): number {
  const targeting = getTargetingAdjustments(inputs);
  const baseReachedPatients =
    targeting.adjusted_population * targeting.adjusted_reach_rate;

  let numerator = 0;
  let denominator = 0;

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participationMultiplier = Math.pow(
      1 - inputs.annual_participation_dropoff_rate,
      year - 1,
    );
    const effectMultiplier = Math.pow(
      1 - inputs.annual_effect_decay_rate,
      year - 1,
    );

    const patientsReached = baseReachedPatients * participationMultiplier;
    const effectivePatients =
      patientsReached * inputs.sustained_engagement_rate;

    const eventsPerUnitRate =
      effectivePatients *
      inputs.risk_reduction_in_recurrent_events *
      effectMultiplier;
    const admissionsPerUnitRate =
      eventsPerUnitRate * inputs.admission_probability_per_event;
    const bedDaysPerUnitRate =
      admissionsPerUnitRate * inputs.average_length_of_stay;

    const grossSavingsPerUnitRate = calculateGrossSavings(
      eventsPerUnitRate,
      admissionsPerUnitRate,
      bedDaysPerUnitRate,
      inputs,
    );
    const qalyValuePerUnitRate =
      eventsPerUnitRate *
      inputs.qaly_gain_per_event_avoided *
      inputs.cost_effectiveness_threshold;

    const discountFactor = getDiscountFactor(year, inputs.discount_rate);

    numerator +=
      patientsReached *
      inputs.intervention_cost_per_patient_reached *
      discountFactor;
    denominator +=
      (grossSavingsPerUnitRate + qalyValuePerUnitRate) * discountFactor;
  }

  return safeDivide(numerator, denominator);
}

export function calculateBreakEvenQalyGain(inputs: Inputs): number {
  const result = runModelCore(inputs);
  if (result.events_avoided_total <= 0) return 0;

  const requiredTotalQalyValue = Math.max(
    result.discounted_net_cost_total / inputs.cost_effectiveness_threshold,
    0,
  );

  return safeDivide(requiredTotalQalyValue, result.events_avoided_total);
}

export function calculateBreakEvenHorizon(
  inputs: Inputs,
  maxYears = 10,
): string {
  for (let horizon = 1; horizon <= maxYears; horizon += 1) {
    const mappedHorizon =
      horizon <= 1 ? 1 : horizon <= 3 ? 3 : 5;

    const testInputs = {
      ...inputs,
      time_horizon_years: mappedHorizon as 1 | 3 | 5,
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
    break_even_risk_reduction_required: clampRate(
      calculateBreakEvenRiskReduction(inputs),
    ),
    break_even_cost_per_patient: calculateBreakEvenCostPerPatient(inputs),
    break_even_horizon: calculateBreakEvenHorizon(inputs, 10),
    break_even_baseline_event_rate_required: clampRate(
      calculateBreakEvenBaselineEventRate(inputs),
    ),
    break_even_qaly_gain_required: calculateBreakEvenQalyGain(inputs),
  };
}

export function runBoundedUncertainty(inputs: Inputs): UncertaintyRow[] {
  const cases = [
    {
      case: "Low" as const,
      overrides: {
        risk_reduction_in_recurrent_events: clampRate(
          inputs.risk_reduction_in_recurrent_events * 0.8,
        ),
        intervention_cost_per_patient_reached:
          inputs.intervention_cost_per_patient_reached * 1.2,
        baseline_recurrent_event_rate: clampRate(
          inputs.baseline_recurrent_event_rate * 0.85,
        ),
        qaly_gain_per_event_avoided:
          inputs.qaly_gain_per_event_avoided * 0.8,
        sustained_engagement_rate: clampRate(
          inputs.sustained_engagement_rate * 0.9,
        ),
      },
      dominant_domain: "Clinical and delivery assumptions",
    },
    {
      case: "Base" as const,
      overrides: {},
      dominant_domain: "Base case",
    },
    {
      case: "High" as const,
      overrides: {
        risk_reduction_in_recurrent_events: clampRate(
          inputs.risk_reduction_in_recurrent_events * 1.2,
        ),
        intervention_cost_per_patient_reached:
          inputs.intervention_cost_per_patient_reached * 0.8,
        baseline_recurrent_event_rate: clampRate(
          inputs.baseline_recurrent_event_rate * 1.15,
        ),
        qaly_gain_per_event_avoided:
          inputs.qaly_gain_per_event_avoided * 1.2,
        sustained_engagement_rate: clampRate(
          inputs.sustained_engagement_rate * 1.05,
        ),
      },
      dominant_domain: "Baseline risk and effect assumptions",
    },
  ];

  return cases.map((scenario) => {
    const caseInputs: Inputs = { ...inputs, ...scenario.overrides };
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
      events_avoided_total: result.events_avoided_total,
      discounted_net_cost_total: result.discounted_net_cost_total,
      discounted_cost_per_qaly: result.discounted_cost_per_qaly,
      dominant_domain: scenario.dominant_domain,
      decision_status,
    };
  });
}

type SensitivityConfig = {
  key: keyof Inputs;
  label: string;
  low: (value: number) => number;
  high: (value: number) => number;
  formatter: (value: number) => string;
};

const SENSITIVITY_CONFIGS: SensitivityConfig[] = [
  {
    key: "baseline_recurrent_event_rate",
    label: "Baseline recurrent event rate",
    low: (value) => clampRate(value * 0.8),
    high: (value) => clampRate(value * 1.2),
    formatter: (value) => formatPercent(value),
  },
  {
    key: "risk_reduction_in_recurrent_events",
    label: "Risk reduction in recurrent events",
    low: (value) => clampRate(value * 0.8),
    high: (value) => clampRate(value * 1.2),
    formatter: (value) => formatPercent(value),
  },
  {
    key: "intervention_cost_per_patient_reached",
    label: "Intervention cost per patient",
    low: (value) => Math.max(0, value * 0.8),
    high: (value) => Math.max(0, value * 1.2),
    formatter: (value) => formatCurrency(value),
  },
  {
    key: "intervention_reach_rate",
    label: "Intervention reach",
    low: (value) => clampRate(value * 0.8),
    high: (value) => clampRate(value * 1.2),
    formatter: (value) => formatPercent(value),
  },
  {
    key: "sustained_engagement_rate",
    label: "Sustained engagement",
    low: (value) => clampRate(value * 0.9),
    high: (value) => clampRate(value * 1.1),
    formatter: (value) => formatPercent(value),
  },
  {
    key: "admission_probability_per_event",
    label: "Admission probability per event",
    low: (value) => clampRate(value * 0.85),
    high: (value) => clampRate(value * 1.15),
    formatter: (value) => formatPercent(value),
  },
  {
    key: "average_length_of_stay",
    label: "Average length of stay",
    low: (value) => Math.max(0, value * 0.85),
    high: (value) => Math.max(0, value * 1.15),
    formatter: (value) => `${value.toFixed(1)} days`,
  },
  {
    key: "qaly_gain_per_event_avoided",
    label: "QALY gain per event avoided",
    low: (value) => Math.max(0, value * 0.8),
    high: (value) => Math.max(0, value * 1.2),
    formatter: (value) => value.toFixed(3),
  },
  {
    key: "cost_per_cardiovascular_event",
    label: "Cost per cardiovascular event",
    low: (value) => Math.max(0, value * 0.85),
    high: (value) => Math.max(0, value * 1.15),
    formatter: (value) => formatCurrency(value),
  },
  {
    key: "cost_per_admission",
    label: "Cost per admission",
    low: (value) => Math.max(0, value * 0.85),
    high: (value) => Math.max(0, value * 1.15),
    formatter: (value) => formatCurrency(value),
  },
  {
    key: "cost_per_bed_day",
    label: "Cost per bed day",
    low: (value) => Math.max(0, value * 0.85),
    high: (value) => Math.max(0, value * 1.15),
    formatter: (value) => formatCurrency(value),
  },
  {
    key: "annual_effect_decay_rate",
    label: "Annual effect decay",
    low: (value) => clampRate(value * 0.8),
    high: (value) => clampRate(value * 1.2),
    formatter: (value) => formatPercent(value),
  },
  {
    key: "annual_participation_dropoff_rate",
    label: "Annual participation drop-off",
    low: (value) => clampRate(value * 0.8),
    high: (value) => clampRate(value * 1.2),
    formatter: (value) => formatPercent(value),
  },
  {
    key: "eligible_population",
    label: "Eligible population",
    low: (value) => Math.max(0, value * 0.85),
    high: (value) => Math.max(0, value * 1.15),
    formatter: (value) => Math.round(value).toLocaleString("en-GB"),
  },
];

function getFiniteIcer(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function runParameterSensitivity(inputs: Inputs): SensitivitySummary {
  const baseResults = runModel(inputs);

  const rows: ParameterSensitivityRow[] = SENSITIVITY_CONFIGS.map((config) => {
    const baseValue = inputs[config.key];

    if (typeof baseValue !== "number") {
      return {
        parameter_key: config.key,
        parameter_label: config.label,
        low_value_label: "n/a",
        high_value_label: "n/a",
        low_icer: 0,
        base_icer: getFiniteIcer(baseResults.discounted_cost_per_qaly),
        high_icer: 0,
        low_net_cost: 0,
        base_net_cost: baseResults.discounted_net_cost_total,
        high_net_cost: 0,
        max_abs_icer_change: 0,
      };
    }

    const lowValue = config.low(baseValue);
    const highValue = config.high(baseValue);

    const lowInputs: Inputs = {
      ...inputs,
      [config.key]: lowValue,
    };
    const highInputs: Inputs = {
      ...inputs,
      [config.key]: highValue,
    };

    const lowResults = runModel(lowInputs);
    const highResults = runModel(highInputs);

    const baseIcer = getFiniteIcer(baseResults.discounted_cost_per_qaly);
    const lowIcer = getFiniteIcer(lowResults.discounted_cost_per_qaly);
    const highIcer = getFiniteIcer(highResults.discounted_cost_per_qaly);

    const max_abs_icer_change = Math.max(
      Math.abs(lowIcer - baseIcer),
      Math.abs(highIcer - baseIcer),
    );

    return {
      parameter_key: config.key,
      parameter_label: config.label,
      low_value_label: config.formatter(lowValue),
      high_value_label: config.formatter(highValue),
      low_icer: lowIcer,
      base_icer: baseIcer,
      high_icer: highIcer,
      low_net_cost: lowResults.discounted_net_cost_total,
      base_net_cost: baseResults.discounted_net_cost_total,
      high_net_cost: highResults.discounted_net_cost_total,
      max_abs_icer_change,
    };
  }).sort((a, b) => b.max_abs_icer_change - a.max_abs_icer_change);

  return {
    rows,
    top_drivers: rows.slice(0, 3),
    primary_driver: rows[0] ?? null,
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
  comparatorInputs.cost_per_cardiovascular_event =
    baseInputs.cost_per_cardiovascular_event;
  comparatorInputs.cost_per_admission = baseInputs.cost_per_admission;
  comparatorInputs.cost_per_bed_day = baseInputs.cost_per_bed_day;
  comparatorInputs.qaly_gain_per_event_avoided =
    baseInputs.qaly_gain_per_event_avoided;

  return comparatorInputs;
}