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
    adjusted_eligible_population = inputs["eligible_population"] * targeting["population_multiplier"]
    adjusted_annual_fall_risk = clamp_rate(inputs["annual_fall_risk"] * targeting["risk_multiplier"])
    adjusted_uptake_rate = clamp_rate(inputs["uptake_rate"] * targeting["uptake_multiplier"])

    return {
        "adjusted_eligible_population": adjusted_eligible_population,
        "adjusted_annual_fall_risk": adjusted_annual_fall_risk,
        "adjusted_uptake_rate": adjusted_uptake_rate,
    }


def calculate_gross_savings(admissions_avoided: float, bed_days_avoided: float, inputs: dict) -> float:
    costing = COSTING_METHOD_MAP[inputs["costing_method"]]

    admission_savings = admissions_avoided * inputs["cost_per_admission"]
    bed_day_value = bed_days_avoided * inputs["cost_per_bed_day"]

    if costing["mode"] == "admission":
        return admission_savings
    if costing["mode"] == "bed_day":
        return bed_day_value
    return admission_savings + bed_day_value


def _run_model_core(inputs: dict) -> dict:
    targeting = get_targeting_adjustments(inputs)

    base_treated_population = (
        targeting["adjusted_eligible_population"]
        * targeting["adjusted_uptake_rate"]
        * inputs["adherence_rate"]
    )

    yearly_rows = []
    cumulative_programme_cost = 0.0
    cumulative_gross_savings = 0.0
    cumulative_net_cost = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        annual_effectiveness = inputs["relative_risk_reduction"] * (
            (1 - inputs["effect_decay_rate"]) ** (year - 1)
        )
        annual_effectiveness = clamp_rate(annual_effectiveness)

        treated_population = base_treated_population * (
            (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        )

        expected_falls_baseline = treated_population * targeting["adjusted_annual_fall_risk"]
        falls_avoided = expected_falls_baseline * annual_effectiveness
        falls_after_intervention = expected_falls_baseline - falls_avoided

        admissions_avoided = falls_avoided * inputs["admission_rate_after_fall"]
        bed_days_avoided = admissions_avoided * inputs["average_length_of_stay"]

        programme_cost = treated_population * inputs["intervention_cost_per_person"]
        gross_savings = calculate_gross_savings(admissions_avoided, bed_days_avoided, inputs)
        net_cost = programme_cost - gross_savings

        qalys_gained = falls_avoided * inputs["qaly_loss_per_serious_fall"]

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
                "treated_population": treated_population,
                "annual_effectiveness": annual_effectiveness,
                "expected_falls_baseline": expected_falls_baseline,
                "falls_after_intervention": falls_after_intervention,
                "falls_avoided": falls_avoided,
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

    falls_avoided_total = yearly_results["falls_avoided"].sum()
    admissions_avoided_total = yearly_results["admissions_avoided"].sum()
    bed_days_avoided_total = yearly_results["bed_days_avoided"].sum()
    programme_cost_total = yearly_results["programme_cost"].sum()
    gross_savings_total = yearly_results["gross_savings"].sum()
    net_cost_total = yearly_results["net_cost"].sum()
    discounted_programme_cost_total = yearly_results["discounted_programme_cost"].sum()
    discounted_gross_savings_total = yearly_results["discounted_gross_savings"].sum()
    discounted_net_cost_total = yearly_results["discounted_net_cost"].sum()
    discounted_qalys_total = yearly_results["discounted_qalys"].sum()

    discounted_cost_per_qaly = safe_divide(discounted_net_cost_total, discounted_qalys_total)
    roi = safe_divide(gross_savings_total, programme_cost_total)

    return {
        "treated_population_year_1": yearly_results.iloc[0]["treated_population"],
        "adjusted_eligible_population": targeting["adjusted_eligible_population"],
        "adjusted_annual_fall_risk": targeting["adjusted_annual_fall_risk"],
        "adjusted_uptake_rate": targeting["adjusted_uptake_rate"],
        "falls_avoided_total": falls_avoided_total,
        "admissions_avoided_total": admissions_avoided_total,
        "bed_days_avoided_total": bed_days_avoided_total,
        "programme_cost_total": programme_cost_total,
        "gross_savings_total": gross_savings_total,
        "net_cost_total": net_cost_total,
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

    break_even_effectiveness = clamp_rate(calculate_break_even_effectiveness(inputs))
    break_even_cost_per_participant = calculate_break_even_cost_per_participant(inputs)
    break_even_horizon = calculate_break_even_horizon(inputs, max_years=10)

    core.update(
        {
            "break_even_effectiveness": break_even_effectiveness,
            "break_even_cost_per_participant": break_even_cost_per_participant,
            "break_even_horizon": break_even_horizon,
        }
    )
    return core


def calculate_break_even_effectiveness(inputs: dict) -> float:
    targeting = get_targeting_adjustments(inputs)

    base_treated_population = (
        targeting["adjusted_eligible_population"]
        * targeting["adjusted_uptake_rate"]
        * inputs["adherence_rate"]
    )

    numerator = 0.0
    denominator = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        treated_population = base_treated_population * (
            (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        )
        expected_falls_baseline = treated_population * targeting["adjusted_annual_fall_risk"]
        annual_decay_multiplier = (1 - inputs["effect_decay_rate"]) ** (year - 1)

        admissions_per_unit_effect = (
            expected_falls_baseline
            * annual_decay_multiplier
            * inputs["admission_rate_after_fall"]
        )
        bed_days_per_unit_effect = admissions_per_unit_effect * inputs["average_length_of_stay"]

        gross_savings_per_unit_effect = calculate_gross_savings(
            admissions_per_unit_effect,
            bed_days_per_unit_effect,
            inputs,
        )
        qaly_per_unit_effect = expected_falls_baseline * annual_decay_multiplier * inputs["qaly_loss_per_serious_fall"]

        discount_factor = get_discount_factor(year, inputs["discount_rate"])

        numerator += treated_population * inputs["intervention_cost_per_person"] * discount_factor
        denominator += (
            gross_savings_per_unit_effect
            + qaly_per_unit_effect * inputs["cost_effectiveness_threshold"]
        ) * discount_factor

    return safe_divide(numerator, denominator)


def calculate_break_even_cost_per_participant(inputs: dict) -> float:
    targeting = get_targeting_adjustments(inputs)

    base_treated_population = (
        targeting["adjusted_eligible_population"]
        * targeting["adjusted_uptake_rate"]
        * inputs["adherence_rate"]
    )

    total_discounted_treated = 0.0
    total_discounted_value = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        treated_population = base_treated_population * (
            (1 - inputs["participation_dropoff_rate"]) ** (year - 1)
        )
        annual_effectiveness = inputs["relative_risk_reduction"] * (
            (1 - inputs["effect_decay_rate"]) ** (year - 1)
        )
        annual_effectiveness = clamp_rate(annual_effectiveness)

        expected_falls_baseline = treated_population * targeting["adjusted_annual_fall_risk"]
        falls_avoided = expected_falls_baseline * annual_effectiveness
        admissions_avoided = falls_avoided * inputs["admission_rate_after_fall"]
        bed_days_avoided = admissions_avoided * inputs["average_length_of_stay"]

        gross_savings = calculate_gross_savings(admissions_avoided, bed_days_avoided, inputs)
        qaly_value = falls_avoided * inputs["qaly_loss_per_serious_fall"] * inputs["cost_effectiveness_threshold"]

        discount_factor = get_discount_factor(year, inputs["discount_rate"])

        total_discounted_treated += treated_population * discount_factor
        total_discounted_value += (gross_savings + qaly_value) * discount_factor

    return safe_divide(total_discounted_value, total_discounted_treated)


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
            "relative_risk_reduction": clamp_rate(inputs["relative_risk_reduction"] * 0.8),
            "intervention_cost_per_person": inputs["intervention_cost_per_person"] * 1.2,
            "annual_fall_risk": clamp_rate(inputs["annual_fall_risk"] * 0.9),
            "participation_dropoff_rate": clamp_rate(inputs["participation_dropoff_rate"] * 1.2),
            "dominant_domain": "Delivery assumptions",
        },
        "Base": {
            "dominant_domain": "Base case",
        },
        "High": {
            "relative_risk_reduction": clamp_rate(inputs["relative_risk_reduction"] * 1.2),
            "intervention_cost_per_person": inputs["intervention_cost_per_person"] * 0.8,
            "annual_fall_risk": clamp_rate(inputs["annual_fall_risk"] * 1.1),
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
                "falls_avoided_total": result["falls_avoided_total"],
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
    comparator_inputs["cost_per_admission"] = base_inputs["cost_per_admission"]
    comparator_inputs["cost_per_bed_day"] = base_inputs["cost_per_bed_day"]
    comparator_inputs["qaly_loss_per_serious_fall"] = base_inputs["qaly_loss_per_serious_fall"]

    return comparator_inputs
    