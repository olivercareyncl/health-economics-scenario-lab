import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { SafeStepReportDocument } from "@/components/pdf/safestep-report";
import { buildSafeStepReportData } from "@/lib/safestep/report";

type Inputs = {
  targeting_mode: "Universal" | "Risk-targeted" | "High-risk only";
  costing_method: "Admission costs only" | "Admission + bed days";
  eligible_population: number;
  annual_fall_risk: number;
  intervention_cost_per_person: number;
  relative_risk_reduction: number;
  time_horizon_years: 1 | 3 | 5;
  uptake_rate: number;
  adherence_rate: number;
  participation_dropoff_rate: number;
  effect_decay_rate: number;
  admission_rate_after_fall: number;
  average_length_of_stay: number;
  cost_per_admission: number;
  cost_per_bed_day: number;
  qaly_loss_per_serious_fall: number;
  cost_effectiveness_threshold: number;
  discount_rate: number;
};

type SafeStepYearlyResultRow = {
  year: number;
  falls_avoided: number;
  cumulative_programme_cost: number;
  cumulative_gross_savings: number;
};

type SafeStepUncertaintyRow = {
  case: string;
  discounted_cost_per_qaly: number;
  falls_avoided_total: number;
  decision_status: string;
};

type SafeStepModelResults = {
  falls_avoided_total: number;
  admissions_avoided_total: number;
  bed_days_avoided_total: number;
  discounted_programme_cost_total: number;
  discounted_gross_savings_total: number;
  discounted_net_cost_total: number;
  discounted_qalys_gained_total: number;
  discounted_cost_per_qaly: number;
  yearly_results: SafeStepYearlyResultRow[];
};

const DEFAULT_INPUTS: Inputs = {
  targeting_mode: "Risk-targeted",
  costing_method: "Admission + bed days",
  eligible_population: 5000,
  annual_fall_risk: 0.24,
  intervention_cost_per_person: 180,
  relative_risk_reduction: 0.18,
  time_horizon_years: 3,
  uptake_rate: 0.7,
  adherence_rate: 0.75,
  participation_dropoff_rate: 0.08,
  effect_decay_rate: 0.06,
  admission_rate_after_fall: 0.22,
  average_length_of_stay: 7,
  cost_per_admission: 3200,
  cost_per_bed_day: 420,
  qaly_loss_per_serious_fall: 0.055,
  cost_effectiveness_threshold: 20000,
  discount_rate: 0.035,
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function getTargetingMultiplier(mode: Inputs["targeting_mode"]) {
  switch (mode) {
    case "Universal":
      return 0.9;
    case "Risk-targeted":
      return 1;
    case "High-risk only":
      return 1.15;
    default:
      return 1;
  }
}

function runModel(inputs: Inputs): SafeStepModelResults {
  const yearlyResults: SafeStepYearlyResultRow[] = [];

  let cumulativeProgrammeCost = 0;
  let cumulativeGrossSavings = 0;
  let discountedFallsAvoidedTotal = 0;
  let discountedAdmissionsAvoidedTotal = 0;
  let discountedBedDaysAvoidedTotal = 0;
  let discountedQalysTotal = 0;

  const targetingMultiplier = getTargetingMultiplier(inputs.targeting_mode);

  for (let year = 1; year <= inputs.time_horizon_years; year += 1) {
    const participants =
      inputs.eligible_population *
      inputs.uptake_rate *
      inputs.adherence_rate *
      Math.pow(1 - inputs.participation_dropoff_rate, year - 1);

    const effectiveRiskReduction =
      inputs.relative_risk_reduction *
      Math.pow(1 - inputs.effect_decay_rate, year - 1) *
      targetingMultiplier;

    const fallsAvoidedRaw =
      participants * inputs.annual_fall_risk * clamp(effectiveRiskReduction, 0, 1);

    const admissionsAvoidedRaw =
      fallsAvoidedRaw * clamp(inputs.admission_rate_after_fall, 0, 1);

    const bedDaysAvoidedRaw =
      admissionsAvoidedRaw * Math.max(0, inputs.average_length_of_stay);

    const programmeCostRaw =
      participants * Math.max(0, inputs.intervention_cost_per_person);

    const grossSavingsRaw =
      inputs.costing_method === "Admission + bed days"
        ? admissionsAvoidedRaw * inputs.cost_per_admission +
          bedDaysAvoidedRaw * inputs.cost_per_bed_day
        : admissionsAvoidedRaw * inputs.cost_per_admission;

    const discountFactor = 1 / Math.pow(1 + inputs.discount_rate, year - 1);

    const fallsAvoidedDiscounted = fallsAvoidedRaw * discountFactor;
    const admissionsAvoidedDiscounted = admissionsAvoidedRaw * discountFactor;
    const bedDaysAvoidedDiscounted = bedDaysAvoidedRaw * discountFactor;
    const programmeCostDiscounted = programmeCostRaw * discountFactor;
    const grossSavingsDiscounted = grossSavingsRaw * discountFactor;
    const qalysDiscounted =
      fallsAvoidedRaw *
      Math.max(0, inputs.qaly_loss_per_serious_fall) *
      discountFactor;

    discountedFallsAvoidedTotal += fallsAvoidedDiscounted;
    discountedAdmissionsAvoidedTotal += admissionsAvoidedDiscounted;
    discountedBedDaysAvoidedTotal += bedDaysAvoidedDiscounted;
    discountedQalysTotal += qalysDiscounted;

    cumulativeProgrammeCost += programmeCostDiscounted;
    cumulativeGrossSavings += grossSavingsDiscounted;

    yearlyResults.push({
      year,
      falls_avoided: round(fallsAvoidedDiscounted),
      cumulative_programme_cost: cumulativeProgrammeCost,
      cumulative_gross_savings: cumulativeGrossSavings,
    });
  }

  const discountedNetCostTotal = cumulativeProgrammeCost - cumulativeGrossSavings;
  const discountedCostPerQaly =
    discountedQalysTotal > 0
      ? discountedNetCostTotal / discountedQalysTotal
      : Number.POSITIVE_INFINITY;

  return {
    falls_avoided_total: round(discountedFallsAvoidedTotal),
    admissions_avoided_total: round(discountedAdmissionsAvoidedTotal),
    bed_days_avoided_total: round(discountedBedDaysAvoidedTotal),
    discounted_programme_cost_total: cumulativeProgrammeCost,
    discounted_gross_savings_total: cumulativeGrossSavings,
    discounted_net_cost_total: discountedNetCostTotal,
    discounted_qalys_gained_total: discountedQalysTotal,
    discounted_cost_per_qaly: Number.isFinite(discountedCostPerQaly)
      ? discountedCostPerQaly
      : 0,
    yearly_results: yearlyResults,
  };
}

function getDecisionStatus(results: SafeStepModelResults, threshold: number) {
  if (results.discounted_net_cost_total < 0) {
    return "Appears cost-saving";
  }

  if (results.discounted_cost_per_qaly <= threshold) {
    return "Appears cost-effective";
  }

  return "Above current threshold";
}

function runBoundedUncertainty(inputs: Inputs): SafeStepUncertaintyRow[] {
  const scenarios = [
    {
      case: "Low",
      riskMultiplier: 0.85,
      effectMultiplier: 0.8,
      costMultiplier: 1.1,
    },
    {
      case: "Base",
      riskMultiplier: 1,
      effectMultiplier: 1,
      costMultiplier: 1,
    },
    {
      case: "High",
      riskMultiplier: 1.15,
      effectMultiplier: 1.15,
      costMultiplier: 0.92,
    },
  ] as const;

  return scenarios.map((scenario) => {
    const scenarioInputs: Inputs = {
      ...inputs,
      annual_fall_risk: clamp(inputs.annual_fall_risk * scenario.riskMultiplier, 0, 1),
      relative_risk_reduction: clamp(
        inputs.relative_risk_reduction * scenario.effectMultiplier,
        0,
        1,
      ),
      intervention_cost_per_person: Math.max(
        0,
        inputs.intervention_cost_per_person * scenario.costMultiplier,
      ),
    };

    const results = runModel(scenarioInputs);

    return {
      case: scenario.case,
      discounted_cost_per_qaly: results.discounted_cost_per_qaly,
      falls_avoided_total: results.falls_avoided_total,
      decision_status: getDecisionStatus(
        results,
        inputs.cost_effectiveness_threshold,
      ),
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { inputs?: Partial<Inputs> };

    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      ...(body.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);

    const reportData = buildSafeStepReportData({
      inputs,
      results,
      uncertainty,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <SafeStepReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="safestep-report.pdf"',
      },
    });
  } catch (error) {
    console.error("SafeStep PDF export failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate SafeStep PDF",
        detail:
          error instanceof Error ? error.message : "Unknown export error",
      },
      { status: 500 },
    );
  }
}