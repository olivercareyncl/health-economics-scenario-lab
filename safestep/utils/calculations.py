import pandas as pd


def safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


def clamp_rate(value: float) -> float:
    return max(0.0, min(1.0, value))


def get_discount_factor(year: int, discount_rate: float) -> float:
    return 1 / ((1 + discount_rate) ** (year - 1))


def run_model(inputs: dict) -> dict:
    treated_population = (
        inputs["eligible_population"]
        * inputs["uptake_rate"]
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

        expected_falls_baseline = treated_population * inputs["annual_fall_risk"]
        falls_avoided = expected_falls_baseline * annual_effectiveness
        falls_after_intervention = expected_falls_baseline - falls_avoided

        admissions_avoided = falls_avoided * inputs["admission_rate_after_fall"]
        bed_days_avoided = admissions_avoided * inputs["average_length_of_stay"]

        programme_cost = treated_population * inputs["intervention_cost_per_person"]
        gross_savings = admissions_avoided * inputs["cost_per_admission"]
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
    qalys_gained_total = yearly_results["qalys_gained"].sum()

    discounted_programme_cost_total = yearly_results["discounted_programme_cost"].sum()
    discounted_gross_savings_total = yearly_results["discounted_gross_savings"].sum()
    discounted_net_cost_total = yearly_results["discounted_net_cost"].sum()
    discounted_qalys_total = yearly_results["discounted_qalys"].sum()

    discounted_cost_per_qaly = safe_divide(discounted_net_cost_total, discounted_qalys_total)
    roi = safe_divide(gross_savings_total, programme_cost_total)
    cost_per_fall_avoided = safe_divide(discounted_net_cost_total, falls_avoided_total)

    break_even_effectiveness = calculate_break_even_effectiveness(inputs)
    break_even_effectiveness = clamp_rate(break_even_effectiveness)

    break_even_cost_per_participant = calculate_break_even_cost_per_participant(inputs)
    break_even_horizon = calculate_break_even_horizon(inputs, max_years=10)

    return {
        "treated_population": treated_population,
        "falls_avoided_total": falls_avoided_total,
        "admissions_avoided_total": admissions_avoided_total,
        "bed_days_avoided_total": bed_days_avoided_total,
        "programme_cost_total": programme_cost_total,
        "gross_savings_total": gross_savings_total,
        "net_cost_total": net_cost_total,
        "qalys_gained_total": qalys_gained_total,
        "discounted_programme_cost_total": discounted_programme_cost_total,
        "discounted_gross_savings_total": discounted_gross_savings_total,
        "discounted_net_cost_total": discounted_net_cost_total,
        "discounted_qalys_total": discounted_qalys_total,
        "discounted_cost_per_qaly": discounted_cost_per_qaly,
        "roi": roi,
        "cost_per_fall_avoided": cost_per_fall_avoided,
        "break_even_effectiveness": break_even_effectiveness,
        "break_even_cost_per_participant": break_even_cost_per_participant,
        "break_even_horizon": break_even_horizon,
        "yearly_results": yearly_results,
    }


def calculate_break_even_effectiveness(inputs: dict) -> float:
    treated_population = (
        inputs["eligible_population"]
        * inputs["uptake_rate"]
        * inputs["adherence_rate"]
    )

    discount_sum = sum(
        get_discount_factor(year, inputs["discount_rate"])
        * ((1 - inputs["effect_decay_rate"]) ** (year - 1))
        for year in range(1, inputs["time_horizon_years"] + 1)
    )

    baseline_falls = treated_population * inputs["annual_fall_risk"]
    qaly_per_fall = inputs["qaly_loss_per_serious_fall"]
    threshold = inputs["cost_effectiveness_threshold"]
    cost_per_person = inputs["intervention_cost_per_person"]
    admission_rate = inputs["admission_rate_after_fall"]
    cost_per_admission = inputs["cost_per_admission"]

    numerator = (
        treated_population
        * cost_per_person
        * sum(get_discount_factor(year, inputs["discount_rate"]) for year in range(1, inputs["time_horizon_years"] + 1))
    )

    denominator = baseline_falls * discount_sum * (
        admission_rate * cost_per_admission + qaly_per_fall * threshold
    )

    if denominator <= 0:
        return 0.0

    return numerator / denominator


def calculate_break_even_cost_per_participant(inputs: dict) -> float:
    treated_population = (
        inputs["eligible_population"]
        * inputs["uptake_rate"]
        * inputs["adherence_rate"]
    )

    if treated_population <= 0:
        return 0.0

    total_discounted_benefit_value = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        annual_effectiveness = inputs["relative_risk_reduction"] * (
            (1 - inputs["effect_decay_rate"]) ** (year - 1)
        )
        annual_effectiveness = clamp_rate(annual_effectiveness)

        expected_falls_baseline = treated_population * inputs["annual_fall_risk"]
        falls_avoided = expected_falls_baseline * annual_effectiveness
        admissions_avoided = falls_avoided * inputs["admission_rate_after_fall"]
        qalys_gained = falls_avoided * inputs["qaly_loss_per_serious_fall"]

        discount_factor = get_discount_factor(year, inputs["discount_rate"])

        value = (
            admissions_avoided * inputs["cost_per_admission"]
            + qalys_gained * inputs["cost_effectiveness_threshold"]
        ) * discount_factor

        total_discounted_benefit_value += value

    total_discounted_treated_people = treated_population * sum(
        get_discount_factor(year, inputs["discount_rate"])
        for year in range(1, inputs["time_horizon_years"] + 1)
    )

    return safe_divide(total_discounted_benefit_value, total_discounted_treated_people)


def calculate_break_even_horizon(inputs: dict, max_years: int = 10) -> str:
    for horizon in range(1, max_years + 1):
        test_inputs = inputs.copy()
        test_inputs["time_horizon_years"] = horizon
        result = run_model_shallow(test_inputs)
        if (
            result["discounted_cost_per_qaly"] > 0
            and result["discounted_cost_per_qaly"] <= inputs["cost_effectiveness_threshold"]
        ):
            return f"{horizon} year{'s' if horizon != 1 else ''}"

    return f">{max_years} years"


def run_model_shallow(inputs: dict) -> dict:
    treated_population = (
        inputs["eligible_population"]
        * inputs["uptake_rate"]
        * inputs["adherence_rate"]
    )

    discounted_net_cost_total = 0.0
    discounted_qalys_total = 0.0

    for year in range(1, inputs["time_horizon_years"] + 1):
        annual_effectiveness = inputs["relative_risk_reduction"] * (
            (1 - inputs["effect_decay_rate"]) ** (year - 1)
        )
        annual_effectiveness = clamp_rate(annual_effectiveness)

        expected_falls_baseline = treated_population * inputs["annual_fall_risk"]
        falls_avoided = expected_falls_baseline * annual_effectiveness
        admissions_avoided = falls_avoided * inputs["admission_rate_after_fall"]

        programme_cost = treated_population * inputs["intervention_cost_per_person"]
        gross_savings = admissions_avoided * inputs["cost_per_admission"]
        net_cost = programme_cost - gross_savings
        qalys_gained = falls_avoided * inputs["qaly_loss_per_serious_fall"]

        discount_factor = get_discount_factor(year, inputs["discount_rate"])
        discounted_net_cost_total += net_cost * discount_factor
        discounted_qalys_total += qalys_gained * discount_factor

    return {
        "discounted_cost_per_qaly": safe_divide(discounted_net_cost_total, discounted_qalys_total)
    }
