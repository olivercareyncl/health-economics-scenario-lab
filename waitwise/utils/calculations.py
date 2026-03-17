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
    adjusted_waiting_list = inputs["starting_waiting_list_size"] * targeting["population_multiplier"]
    adjusted_reach_rate = clamp_rate(inputs["intervention_reach_rate"] * targeting["reach_multiplier"])
    adjusted_escalation_rate = clamp_rate(inputs["monthly_escalation_rate"] * targeting["risk_multiplier"])

    return {
        "adjusted_waiting_list": adjusted_waiting_list,
        "adjusted_reach_rate": adjusted_reach_rate,
        "adjusted_escalation_rate": adjusted_escalation_rate,
    }


def calculate_gross_savings(
    escalations_avoided: float,
    admissions_avoided: float,
    bed_days_avoided: float,
    inputs: dict,
) -> float:
    costing = COSTING_METHOD_MAP[inputs["costing_method"]]
    escalation_and_admission_savings = (
        escalations_avoided * inputs["cost_per_escalation"]
        + admissions_avoided * inputs["cost_per_admission"]
    )
    bed_day_value = bed_days_avoided * inputs["cost_per_bed_day"]

    if costing["mode"] == "acute":
        return escalation_and_admission_savings
    if costing["mode"] == "bed_day":
        return bed_day_value
    return escalation_and_admission_savings + bed_day_value


def _run_model_core(inputs: dict) -> dict:
    targeting = get_targeting_adjustments(inputs)

    starting_waiting_list = targeting["adjusted_waiting_list"]
    monthly_inflow = inputs["monthly_inflow"]
    monthly_throughput = inputs["baseline_monthly_throughput"]

    yearly_rows = []
    cumulative_programme_cost = 0.0
    cumulative_gross_savings = 0.0
    cumulative_net_cost = 0.0
    waiting_list_current = starting_waiting_list

    for year in range(1, inputs["time_horizon_years"] + 1):
        effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)
        participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)

        effective_reach = targeting["adjusted_reach_rate"] * participation_multiplier
        demand_reduction = inputs["demand_reduction_effect"] * effect_multiplier
        throughput_increase = inputs["throughput_increase_effect"] * effect_multiplier
        escalation_reduction = inputs["escalation_reduction_effect"] * effect_multiplier

        annual_inflow = monthly_inflow * 12
        annual_baseline_throughput = monthly_throughput * 12

        reduced_inflow = annual_inflow * (1 - (demand_reduction * effective_reach))
        improved_throughput = annual_baseline_throughput * (1 + (throughput_increase * effective_reach))

        waiting_list_next = max(waiting_list_current + reduced_inflow - improved_throughput, 0)
        baseline_waiting_list_next = max(waiting_list_current + annual_inflow - annual_baseline_throughput, 0)

        waiting_list_reduction = max(baseline_waiting_list_next - waiting_list_next, 0)

        annual_escalations_baseline = waiting_list_current * targeting["adjusted_escalation_rate"] * 12
        escalations_avoided = annual_escalations_baseline * escalation_reduction * effective_reach
        admissions_avoided = escalations_avoided * inputs["admission_rate_after_escalation"]
        bed_days_avoided = admissions_avoided * inputs["average_length_of_stay"]

        patients_reached = waiting_list_current * effective_reach
        programme_cost = patients_reached * inputs["intervention_cost_per_patient_reached"]
        gross_savings = calculate_gross_savings(
            escalations_avoided,
            admissions_avoided,
            bed_days_avoided,
            inputs,
        )
        net_cost = programme_cost - gross_savings
        qalys_gained = escalations_avoided * inputs["qaly_gain_per_escalation_avoided"]

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
                "waiting_list_start": waiting_list_current,
                "waiting_list_end": waiting_list_next,
                "waiting_list_reduction": waiting_list_reduction,
                "escalations_avoided": escalations_avoided,
                "admissions_avoided": admissions_avoided,
                "bed_days_avoided": bed_days_avoided,
                "patients_reached": patients_reached,
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

        waiting_list_current = waiting_list_next

    yearly_results = pd.DataFrame(yearly_rows)

    waiting_list_reduction_total = yearly_results["waiting_list_reduction"].sum()
    escalations_avoided_total = yearly_results["escalations_avoided"].sum()
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
        "waiting_list_start_year_1": yearly_results.iloc[0]["waiting_list_start"],
        "waiting_list_end_final": yearly_results.iloc[-1]["waiting_list_end"],
        "waiting_list_reduction_total": waiting_list_reduction_total,
        "escalations_avoided_total": escalations_avoided_total,
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
            "break_even_effect_required": clamp_rate(calculate_break_even_effect(inputs)),
            "break_even_cost_per_patient": calculate_break_even_cost_per_patient(inputs),
            "break_even_horizon": calculate_break_even_horizon(inputs, max_years=10),
        }
    )
    return core


def calculate_break_even_effect(inputs: dict) -> float:
    targeting = get_targeting_adjustments(inputs)
    waiting_list_base = targeting["adjusted_waiting_list"]

    numerator = 0.0
    denominator = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)
        effective_reach = targeting["adjusted_reach_rate"] * participation_multiplier

        patients_reached = waiting_list_base * effective_reach
        escalations_avoided_per_unit = (
            waiting_list_base
            * targeting["adjusted_escalation_rate"]
            * 12
            * effect_multiplier
            * effective_reach
        )
        admissions_avoided_per_unit = escalations_avoided_per_unit * inputs["admission_rate_after_escalation"]
        bed_days_avoided_per_unit = admissions_avoided_per_unit * inputs["average_length_of_stay"]

        gross_savings_per_unit = calculate_gross_savings(
            escalations_avoided_per_unit,
            admissions_avoided_per_unit,
            bed_days_avoided_per_unit,
            inputs,
        )
        qaly_value_per_unit = (
            escalations_avoided_per_unit
            * inputs["qaly_gain_per_escalation_avoided"]
            * inputs["cost_effectiveness_threshold"]
        )

        discount_factor = get_discount_factor(year, inputs["discount_rate"])
        numerator += patients_reached * inputs["intervention_cost_per_patient_reached"] * discount_factor
        denominator += (gross_savings_per_unit + qaly_value_per_unit) * discount_factor

    return safe_divide(numerator, denominator)


def calculate_break_even_cost_per_patient(inputs: dict) -> float:
    targeting = get_targeting_adjustments(inputs)
    waiting_list_base = targeting["adjusted_waiting_list"]

    total_discounted_patients_reached = 0.0
    total_discounted_value = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        participation_multiplier = (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        effect_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)
        effective_reach = targeting["adjusted_reach_rate"] * participation_multiplier

        patients_reached = waiting_list_base * effective_reach
        blended_effect = (
            inputs["demand_reduction_effect"]
            + inputs["throughput_increase_effect"]
            + inputs["escalation_reduction_effect"]
        ) / 3

        escalations_avoided = (
            waiting_list_base
            * targeting["adjusted_escalation_rate"]
            * 12
            * blended_effect
            * effect_multiplier
            * effective_reach
        )
        admissions_avoided = escalations_avoided * inputs["admission_rate_after_escalation"]
        bed_days_avoided = admissions_avoided * inputs["average_length_of_stay"]

        gross_savings = calculate_gross_savings(
            escalations_avoided,
            admissions_avoided,
            bed_days_avoided,
            inputs,
        )
        qaly_value = (
            escalations_avoided
            * inputs["qaly_gain_per_escalation_avoided"]
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
            "demand_reduction_effect": clamp_rate(inputs["demand_reduction_effect"] * 0.8),
            "throughput_increase_effect": clamp_rate(inputs["throughput_increase_effect"] * 0.8),
            "escalation_reduction_effect": clamp_rate(inputs["escalation_reduction_effect"] * 0.8),
            "intervention_cost_per_patient_reached": inputs["intervention_cost_per_patient_reached"] * 1.2,
            "qaly_gain_per_escalation_avoided": inputs["qaly_gain_per_escalation_avoided"] * 0.8,
            "participation_dropoff_rate": clamp_rate(inputs["participation_dropoff_rate"] * 1.2),
            "dominant_domain": "Delivery assumptions",
        },
        "Base": {
            "dominant_domain": "Base case",
        },
        "High": {
            "demand_reduction_effect": clamp_rate(inputs["demand_reduction_effect"] * 1.2),
            "throughput_increase_effect": clamp_rate(inputs["throughput_increase_effect"] * 1.2),
            "escalation_reduction_effect": clamp_rate(inputs["escalation_reduction_effect"] * 1.2),
            "intervention_cost_per_patient_reached": inputs["intervention_cost_per_patient_reached"] * 0.8,
            "qaly_gain_per_escalation_avoided": inputs["qaly_gain_per_escalation_avoided"] * 1.2,
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
                "waiting_list_reduction_total": result["waiting_list_reduction_total"],
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
    comparator_inputs["cost_per_escalation"] = base_inputs["cost_per_escalation"]
    comparator_inputs["cost_per_admission"] = base_inputs["cost_per_admission"]
    comparator_inputs["cost_per_bed_day"] = base_inputs["cost_per_bed_day"]
    comparator_inputs["qaly_gain_per_escalation_avoided"] = base_inputs["qaly_gain_per_escalation_avoided"]

    return comparator_inputs
