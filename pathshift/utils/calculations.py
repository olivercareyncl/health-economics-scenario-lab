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
    adjusted_cohort = inputs["annual_cohort_size"] * targeting["population_multiplier"]
    adjusted_reach_rate = clamp_rate(inputs["implementation_reach_rate"] * targeting["reach_multiplier"])
    adjusted_admission_rate = clamp_rate(inputs["current_admission_rate"] * targeting["risk_multiplier"])

    return {
        "adjusted_cohort": adjusted_cohort,
        "adjusted_reach_rate": adjusted_reach_rate,
        "adjusted_admission_rate": adjusted_admission_rate,
    }


def calculate_gross_savings(
    admissions_avoided: float,
    follow_ups_avoided: float,
    bed_days_avoided: float,
    acute_to_community_shift: float,
    inputs: dict,
) -> float:
    costing = COSTING_METHOD_MAP[inputs["costing_method"]]

    admission_and_follow_up_savings = (
        admissions_avoided * inputs["cost_per_admission"]
        + follow_ups_avoided * inputs["cost_per_follow_up_contact"]
        + acute_to_community_shift
        * (inputs["cost_per_acute_managed_patient"] - inputs["cost_per_community_managed_patient"])
    )
    bed_day_value = bed_days_avoided * inputs["cost_per_bed_day"]

    if costing["mode"] == "admission_followup":
        return admission_and_follow_up_savings
    if costing["mode"] == "bed_day":
        return bed_day_value
    return admission_and_follow_up_savings + bed_day_value


def _run_model_core(inputs: dict) -> dict:
    targeting = get_targeting_adjustments(inputs)
    base_reached_patients = targeting["adjusted_cohort"] * targeting["adjusted_reach_rate"]

    yearly_rows = []
    cumulative_programme_cost = 0.0
    cumulative_gross_savings = 0.0
    cumulative_net_cost = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)
        participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)

        patients_reached = base_reached_patients * participation_multiplier

        setting_shift_rate = clamp_rate(inputs["proportion_shifted_to_lower_cost_setting"] * effect_multiplier)
        admission_reduction_rate = clamp_rate(inputs["reduction_in_admission_rate"] * effect_multiplier)
        follow_up_reduction_rate = clamp_rate(inputs["reduction_in_follow_up_contacts"] * effect_multiplier)
        los_reduction_rate = clamp_rate(inputs["reduction_in_length_of_stay"] * effect_multiplier)

        patients_shifted_in_pathway = patients_reached * setting_shift_rate
        acute_to_community_shift = patients_shifted_in_pathway

        admissions_baseline = patients_reached * targeting["adjusted_admission_rate"]
        admissions_avoided = admissions_baseline * admission_reduction_rate

        follow_ups_baseline = patients_reached * inputs["current_follow_up_contacts_per_patient"]
        follow_ups_avoided = follow_ups_baseline * follow_up_reduction_rate

        baseline_bed_days = admissions_baseline * inputs["current_average_length_of_stay"]
        bed_days_avoided_from_admissions = admissions_avoided * inputs["current_average_length_of_stay"]
        bed_days_avoided_from_los = baseline_bed_days * los_reduction_rate
        bed_days_avoided = bed_days_avoided_from_admissions + bed_days_avoided_from_los

        programme_cost = patients_reached * inputs["redesign_cost_per_patient"]
        gross_savings = calculate_gross_savings(
            admissions_avoided,
            follow_ups_avoided,
            bed_days_avoided,
            acute_to_community_shift,
            inputs,
        )
        net_cost = programme_cost - gross_savings
        qalys_gained = patients_reached * setting_shift_rate * inputs["qaly_gain_per_patient_improved"]

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
                "patients_reached": patients_reached,
                "patients_shifted_in_pathway": patients_shifted_in_pathway,
                "admissions_avoided": admissions_avoided,
                "follow_ups_avoided": follow_ups_avoided,
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

    patients_shifted_total = yearly_results["patients_shifted_in_pathway"].sum()
    admissions_avoided_total = yearly_results["admissions_avoided"].sum()
    follow_ups_avoided_total = yearly_results["follow_ups_avoided"].sum()
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
        "patients_shifted_total": patients_shifted_total,
        "admissions_avoided_total": admissions_avoided_total,
        "follow_ups_avoided_total": follow_ups_avoided_total,
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
            "break_even_effect_required": clamp_rate(calculate_break_even_effect(inputs)),
            "break_even_cost_per_patient": calculate_break_even_cost_per_patient(inputs),
            "break_even_horizon": calculate_break_even_horizon(inputs, max_years=10),
        }
    )
    return core


def calculate_break_even_effect(inputs: dict) -> float:
    targeting = get_targeting_adjustments(inputs)
    base_reached_patients = targeting["adjusted_cohort"] * targeting["adjusted_reach_rate"]

    numerator = 0.0
    denominator = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)

        patients_reached = base_reached_patients * participation_multiplier

        admissions_per_unit = patients_reached * targeting["adjusted_admission_rate"] * effect_multiplier
        follow_ups_per_unit = patients_reached * inputs["current_follow_up_contacts_per_patient"] * effect_multiplier
        bed_days_per_unit = (
            patients_reached
            * targeting["adjusted_admission_rate"]
            * inputs["current_average_length_of_stay"]
            * effect_multiplier
        )
        acute_shift_per_unit = patients_reached * effect_multiplier

        gross_savings_per_unit = calculate_gross_savings(
            admissions_per_unit,
            follow_ups_per_unit,
            bed_days_per_unit,
            acute_shift_per_unit,
            inputs,
        )
        qaly_value_per_unit = (
            patients_reached
            * effect_multiplier
            * inputs["qaly_gain_per_patient_improved"]
            * inputs["cost_effectiveness_threshold"]
        )

        discount_factor = get_discount_factor(year, inputs["discount_rate"])
        numerator += patients_reached * inputs["redesign_cost_per_patient"] * discount_factor
        denominator += (gross_savings_per_unit + qaly_value_per_unit) * discount_factor

    return safe_divide(numerator, denominator)


def calculate_break_even_cost_per_patient(inputs: dict) -> float:
    targeting = get_targeting_adjustments(inputs)
    base_reached_patients = targeting["adjusted_cohort"] * targeting["adjusted_reach_rate"]

    total_discounted_patients_reached = 0.0
    total_discounted_value = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)

        patients_reached = base_reached_patients * participation_multiplier

        setting_shift_rate = clamp_rate(inputs["proportion_shifted_to_lower_cost_setting"] * effect_multiplier)
        admission_reduction_rate = clamp_rate(inputs["reduction_in_admission_rate"] * effect_multiplier)
        follow_up_reduction_rate = clamp_rate(inputs["reduction_in_follow_up_contacts"] * effect_multiplier)
        los_reduction_rate = clamp_rate(inputs["reduction_in_length_of_stay"] * effect_multiplier)

        patients_shifted = patients_reached * setting_shift_rate
        admissions_baseline = patients_reached * targeting["adjusted_admission_rate"]
        admissions_avoided = admissions_baseline * admission_reduction_rate
        follow_ups_avoided = (
            patients_reached * inputs["current_follow_up_contacts_per_patient"] * follow_up_reduction_rate
        )
        baseline_bed_days = admissions_baseline * inputs["current_average_length_of_stay"]
        bed_days_avoided = (
            admissions_avoided * inputs["current_average_length_of_stay"]
            + baseline_bed_days * los_reduction_rate
        )

        gross_savings = calculate_gross_savings(
            admissions_avoided,
            follow_ups_avoided,
            bed_days_avoided,
            patients_shifted,
            inputs,
        )
        qaly_value = (
            patients_shifted
            * inputs["qaly_gain_per_patient_improved"]
            * inputs["cost_effectiveness_threshold"]
        )

        discount_factor = get_discount_factor(year, inputs["discount_rate"])
        total_discounted_patients_reached += patients_reached * discount_factor
        total_discounted_value += (gross_savings + qaly_value) * discount_factor

    return safe_divide(total_discounted_value, total_discounted_patients_reached)


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
            "proportion_shifted_to_lower_cost_setting": clamp_rate(inputs["proportion_shifted_to_lower_cost_setting"] * 0.8),
            "reduction_in_admission_rate": clamp_rate(inputs["reduction_in_admission_rate"] * 0.8),
            "reduction_in_follow_up_contacts": clamp_rate(inputs["reduction_in_follow_up_contacts"] * 0.8),
            "reduction_in_length_of_stay": clamp_rate(inputs["reduction_in_length_of_stay"] * 0.8),
            "redesign_cost_per_patient": inputs["redesign_cost_per_patient"] * 1.2,
            "qaly_gain_per_patient_improved": inputs["qaly_gain_per_patient_improved"] * 0.8,
            "participation_dropoff_rate": clamp_rate(inputs["participation_dropoff_rate"] * 1.2),
            "dominant_domain": "Delivery assumptions",
        },
        "Base": {
            "dominant_domain": "Base case",
        },
        "High": {
            "proportion_shifted_to_lower_cost_setting": clamp_rate(inputs["proportion_shifted_to_lower_cost_setting"] * 1.2),
            "reduction_in_admission_rate": clamp_rate(inputs["reduction_in_admission_rate"] * 1.2),
            "reduction_in_follow_up_contacts": clamp_rate(inputs["reduction_in_follow_up_contacts"] * 1.2),
            "reduction_in_length_of_stay": clamp_rate(inputs["reduction_in_length_of_stay"] * 1.2),
            "redesign_cost_per_patient": inputs["redesign_cost_per_patient"] * 0.8,
            "qaly_gain_per_patient_improved": inputs["qaly_gain_per_patient_improved"] * 1.2,
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
                "patients_shifted_total": result["patients_shifted_total"],
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
    comparator_inputs["cost_per_acute_managed_patient"] = base_inputs["cost_per_acute_managed_patient"]
    comparator_inputs["cost_per_community_managed_patient"] = base_inputs["cost_per_community_managed_patient"]
    comparator_inputs["cost_per_follow_up_contact"] = base_inputs["cost_per_follow_up_contact"]
    comparator_inputs["cost_per_admission"] = base_inputs["cost_per_admission"]
    comparator_inputs["cost_per_bed_day"] = base_inputs["cost_per_bed_day"]
    comparator_inputs["qaly_gain_per_patient_improved"] = base_inputs["qaly_gain_per_patient_improved"]

    return comparator_inputs
