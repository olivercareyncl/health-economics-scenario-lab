import pandas as pd

from utils.scenarios import COSTING_METHOD_MAP, SCENARIO_MAP, TARGETING_MODE_MAP


def safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


def clamp_rate(value: float) -> float:
    return max(0.0, min(1.0, value))


def get_discount_factor(year: int, discount_rate: float) -> float:
    return 1 / ((1 + discount_rate) ** (year - 1))


def get_targeting_adjustments(inputs: dict) -> dict:
    targeting = TARGETING_MODE_MAP[inputs["targeting_mode"]]
    adjusted_incident_cases = inputs["annual_incident_cases"] * targeting["population_multiplier"]
    adjusted_late_diagnosis_rate = clamp_rate(
        inputs["current_late_diagnosis_rate"] * targeting["late_rate_multiplier"]
    )
    adjusted_reach_rate = clamp_rate(inputs["intervention_reach_rate"] * targeting["reach_multiplier"])
    adjusted_reduction = clamp_rate(
        inputs["achievable_reduction_in_late_diagnosis"] * targeting["shift_multiplier"]
    )

    return {
        "adjusted_incident_cases": adjusted_incident_cases,
        "adjusted_late_diagnosis_rate": adjusted_late_diagnosis_rate,
        "adjusted_reach_rate": adjusted_reach_rate,
        "adjusted_reduction": adjusted_reduction,
    }


def calculate_gross_savings(
    cases_shifted_earlier: float,
    admissions_avoided: float,
    bed_days_avoided: float,
    inputs: dict,
) -> float:
    costing = COSTING_METHOD_MAP[inputs["costing_method"]]

    treatment_savings = cases_shifted_earlier * (
        inputs["treatment_cost_late"] - inputs["treatment_cost_early"]
    )
    emergency_savings = admissions_avoided * inputs["cost_per_emergency_admission"]
    bed_day_value = bed_days_avoided * inputs["cost_per_bed_day"]
    acute_savings = emergency_savings + bed_day_value

    if costing["mode"] == "treatment":
        return treatment_savings
    if costing["mode"] == "acute":
        return acute_savings
    return treatment_savings + acute_savings


def _run_model_core(inputs: dict) -> dict:
    targeting = get_targeting_adjustments(inputs)
    base_cases_reached = targeting["adjusted_incident_cases"] * targeting["adjusted_reach_rate"]

    yearly_rows = []
    cumulative_programme_cost = 0.0
    cumulative_gross_savings = 0.0
    cumulative_net_cost = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        annual_effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)
        annual_participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)

        cases_reached = base_cases_reached * annual_participation_multiplier
        achieved_reduction = targeting["adjusted_reduction"] * annual_effect_multiplier
        achieved_reduction = clamp_rate(achieved_reduction)

        max_shiftable_cases = targeting["adjusted_incident_cases"] * targeting["adjusted_late_diagnosis_rate"]
        raw_cases_shifted = cases_reached * achieved_reduction
        cases_shifted_earlier = min(raw_cases_shifted, max_shiftable_cases)

        emergency_presentations_avoided = cases_shifted_earlier * (
            inputs["late_emergency_presentation_rate"] - inputs["early_emergency_presentation_rate"]
        )
        admissions_avoided = emergency_presentations_avoided * inputs["admissions_per_emergency_presentation"]
        bed_days_avoided = admissions_avoided * inputs["average_length_of_stay"]

        programme_cost = cases_reached * inputs["intervention_cost_per_case_reached"]
        gross_savings = calculate_gross_savings(
            cases_shifted_earlier,
            admissions_avoided,
            bed_days_avoided,
            inputs,
        )
        net_cost = programme_cost - gross_savings
        qalys_gained = cases_shifted_earlier * inputs["qaly_gain_per_case_shifted"]

        discount_factor = get_discount_factor(year, inputs["discount_rate"])
        discounted_programme_cost = programme_cost * discount_factor
        discounted_gross_savings = gross_savings * discount_factor
        discounted_net_cost = net_cost * discount_factor
        discounted_qalys = qalys_gained * discount_factor

        cumulative_programme_cost += programme_cost
        cumulative_gross_savings += gross_savings
        cumulative_net_cost += net_cost

        yearly_rows.append(
            {
                "year": year,
                "cases_reached": cases_reached,
                "cases_shifted_earlier": cases_shifted_earlier,
                "emergency_presentations_avoided": emergency_presentations_avoided,
                "admissions_avoided": admissions_avoided,
                "bed_days_avoided": bed_days_avoided,
                "programme_cost": programme_cost,
                "gross_savings": gross_savings,
                "net_cost": net_cost,
                "qalys_gained": qalys_gained,
                "discount_factor": discount_factor,
                "discounted_programme_cost": discounted_programme_cost,
                "discounted_gross_savings": discounted_gross_savings,
                "discounted_net_cost": discounted_net_cost,
                "discounted_qalys": discounted_qalys,
                "cumulative_programme_cost": cumulative_programme_cost,
                "cumulative_gross_savings": cumulative_gross_savings,
                "cumulative_net_cost": cumulative_net_cost,
            }
        )

    yearly_results = pd.DataFrame(yearly_rows)

    cases_shifted_total = yearly_results["cases_shifted_earlier"].sum()
    emergency_presentations_avoided_total = yearly_results["emergency_presentations_avoided"].sum()
    admissions_avoided_total = yearly_results["admissions_avoided"].sum()
    bed_days_avoided_total = yearly_results["bed_days_avoided"].sum()
    programme_cost_total = yearly_results["programme_cost"].sum()
    gross_savings_total = yearly_results["gross_savings"].sum()
    discounted_programme_cost_total = yearly_results["discounted_programme_cost"].sum()
    discounted_gross_savings_total = yearly_results["discounted_gross_savings"].sum()
    discounted_net_cost_total = yearly_results["discounted_net_cost"].sum()
    discounted_qalys_total = yearly_results["discounted_qalys"].sum()

    discounted_cost_per_qaly = safe_divide(discounted_net_cost_total, discounted_qalys_total)
    roi = safe_divide(gross_savings_total, programme_cost_total)

    return {
        "cases_reached_year_1": yearly_results.iloc[0]["cases_reached"],
        "adjusted_incident_cases": targeting["adjusted_incident_cases"],
        "adjusted_late_diagnosis_rate": targeting["adjusted_late_diagnosis_rate"],
        "adjusted_reach_rate": targeting["adjusted_reach_rate"],
        "adjusted_reduction": targeting["adjusted_reduction"],
        "cases_shifted_total": cases_shifted_total,
        "emergency_presentations_avoided_total": emergency_presentations_avoided_total,
        "admissions_avoided_total": admissions_avoided_total,
        "bed_days_avoided_total": bed_days_avoided_total,
        "programme_cost_total": programme_cost_total,
        "gross_savings_total": gross_savings_total,
        "discounted_programme_cost_total": discounted_programme_cost_total,
        "discounted_gross_savings_total": discounted_gross_savings_total,
        "discounted_net_cost_total": discounted_net_cost_total,
        "discounted_qalys_total": discounted_qalys_total,
        "discounted_cost_per_qaly": discounted_cost_per_qaly,
        "roi": roi,
        "yearly_results": yearly_results,
    }


def run_model(inputs: dict) -> dict:
    core = _run_model_core(inputs)
    core.update(
        {
            "break_even_reduction_in_late_diagnosis": clamp_rate(
                calculate_break_even_reduction(inputs)
            ),
            "break_even_cost_per_case": calculate_break_even_cost_per_case(inputs),
            "break_even_horizon": calculate_break_even_horizon(inputs, max_years=10),
        }
    )
    return core


def calculate_break_even_reduction(inputs: dict) -> float:
    targeting = get_targeting_adjustments(inputs)
    base_cases_reached = targeting["adjusted_incident_cases"] * targeting["adjusted_reach_rate"]

    numerator = 0.0
    denominator = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)
        cases_reached = base_cases_reached * participation_multiplier
        discount_factor = get_discount_factor(year, inputs["discount_rate"])

        cases_shifted_per_unit = cases_reached * effect_multiplier
        emergency_avoided_per_unit = cases_shifted_per_unit * (
            inputs["late_emergency_presentation_rate"] - inputs["early_emergency_presentation_rate"]
        )
        admissions_avoided_per_unit = emergency_avoided_per_unit * inputs["admissions_per_emergency_presentation"]
        bed_days_avoided_per_unit = admissions_avoided_per_unit * inputs["average_length_of_stay"]

        gross_savings_per_unit = calculate_gross_savings(
            cases_shifted_per_unit,
            admissions_avoided_per_unit,
            bed_days_avoided_per_unit,
            inputs,
        )
        qaly_value_per_unit = (
            cases_shifted_per_unit
            * inputs["qaly_gain_per_case_shifted"]
            * inputs["cost_effectiveness_threshold"]
        )

        numerator += cases_reached * inputs["intervention_cost_per_case_reached"] * discount_factor
        denominator += (gross_savings_per_unit + qaly_value_per_unit) * discount_factor

    return safe_divide(numerator, denominator)


def calculate_break_even_cost_per_case(inputs: dict) -> float:
    targeting = get_targeting_adjustments(inputs)
    base_cases_reached = targeting["adjusted_incident_cases"] * targeting["adjusted_reach_rate"]

    total_discounted_cases_reached = 0.0
    total_discounted_value = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)

        cases_reached = base_cases_reached * participation_multiplier
        cases_shifted_earlier = cases_reached * targeting["adjusted_reduction"] * effect_multiplier
        cases_shifted_earlier = min(
            cases_shifted_earlier,
            targeting["adjusted_incident_cases"] * targeting["adjusted_late_diagnosis_rate"],
        )

        emergency_presentations_avoided = cases_shifted_earlier * (
            inputs["late_emergency_presentation_rate"] - inputs["early_emergency_presentation_rate"]
        )
        admissions_avoided = emergency_presentations_avoided * inputs["admissions_per_emergency_presentation"]
        bed_days_avoided = admissions_avoided * inputs["average_length_of_stay"]

        gross_savings = calculate_gross_savings(
            cases_shifted_earlier,
            admissions_avoided,
            bed_days_avoided,
            inputs,
        )
        qaly_value = (
            cases_shifted_earlier
            * inputs["qaly_gain_per_case_shifted"]
            * inputs["cost_effectiveness_threshold"]
        )

        discount_factor = get_discount_factor(year, inputs["discount_rate"])

        total_discounted_cases_reached += cases_reached * discount_factor
        total_discounted_value += (gross_savings + qaly_value) * discount_factor

    return safe_divide(total_discounted_value, total_discounted_cases_reached)


def calculate_break_even_horizon(inputs: dict, max_years: int = 10) -> str:
    for horizon in range(1, max_years + 1):
        test_inputs = inputs.copy()
        test_inputs["time_horizon_years"] = horizon
        result = _run_model_core(test_inputs)
        if (
            result["discounted_cost_per_qaly"] > 0
            and result["discounted_cost_per_qaly"] <= inputs["cost_effectiveness_threshold"]
        ):
            return f"{horizon} year{'s' if horizon != 1 else ''}"
        if result["discounted_net_cost_total"] < 0:
            return f"{horizon} year{'s' if horizon != 1 else ''}"
    return f">{max_years} years"


def run_bounded_uncertainty(inputs: dict) -> pd.DataFrame:
    cases = {
        "Low": {
            "achievable_reduction_in_late_diagnosis": clamp_rate(
                inputs["achievable_reduction_in_late_diagnosis"] * 0.8
            ),
            "intervention_cost_per_case_reached": inputs["intervention_cost_per_case_reached"] * 1.2,
            "qaly_gain_per_case_shifted": inputs["qaly_gain_per_case_shifted"] * 0.8,
            "participation_dropoff_rate": clamp_rate(inputs["participation_dropoff_rate"] * 1.2),
            "dominant_domain": "Delivery assumptions",
        },
        "Base": {
            "dominant_domain": "Base case",
        },
        "High": {
            "achievable_reduction_in_late_diagnosis": clamp_rate(
                inputs["achievable_reduction_in_late_diagnosis"] * 1.2
            ),
            "intervention_cost_per_case_reached": inputs["intervention_cost_per_case_reached"] * 0.8,
            "qaly_gain_per_case_shifted": inputs["qaly_gain_per_case_shifted"] * 1.2,
            "participation_dropoff_rate": clamp_rate(inputs["participation_dropoff_rate"] * 0.8),
            "dominant_domain": "Clinical and delivery assumptions",
        },
    }

    rows = []
    for case_name, overrides in cases.items():
        case_inputs = inputs.copy()
        dominant_domain = overrides.pop("dominant_domain")
        case_inputs.update(overrides)
        result = _run_model_core(case_inputs)

        if result["discounted_net_cost_total"] < 0:
            decision_status = "Appears cost-saving"
        elif 0 < result["discounted_cost_per_qaly"] <= inputs["cost_effectiveness_threshold"]:
            decision_status = "Appears cost-effective"
        else:
            decision_status = "Above current threshold"

        rows.append(
            {
                "case": case_name,
                "cases_shifted_total": result["cases_shifted_total"],
                "discounted_net_cost_total": result["discounted_net_cost_total"],
                "discounted_cost_per_qaly": result["discounted_cost_per_qaly"],
                "dominant_domain": dominant_domain,
                "decision_status": decision_status,
            }
        )

    return pd.DataFrame(rows)


def build_comparator_case(defaults: dict, base_inputs: dict, comparator_mode: str) -> dict:
    comparator_inputs = defaults.copy()

    if comparator_mode in SCENARIO_MAP:
        comparator_inputs.update(SCENARIO_MAP[comparator_mode](defaults))
    else:
        comparator_inputs.update(base_inputs)

    comparator_inputs["time_horizon_years"] = base_inputs["time_horizon_years"]
    comparator_inputs["discount_rate"] = base_inputs["discount_rate"]
    comparator_inputs["costing_method"] = base_inputs["costing_method"]
    comparator_inputs["cost_effectiveness_threshold"] = base_inputs["cost_effectiveness_threshold"]
    comparator_inputs["cost_per_emergency_admission"] = base_inputs["cost_per_emergency_admission"]
    comparator_inputs["cost_per_bed_day"] = base_inputs["cost_per_bed_day"]
    comparator_inputs["treatment_cost_early"] = base_inputs["treatment_cost_early"]
    comparator_inputs["treatment_cost_late"] = base_inputs["treatment_cost_late"]
    comparator_inputs["qaly_gain_per_case_shifted"] = base_inputs["qaly_gain_per_case_shifted"]

    return comparator_inputs