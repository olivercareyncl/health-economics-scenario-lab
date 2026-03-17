def safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


def clamp_rate(value: float) -> float:
    return max(0.0, min(1.0, value))


def run_model(inputs: dict) -> dict:
    treated_population = (
        inputs["eligible_population"]
        * inputs["uptake_rate"]
        * inputs["adherence_rate"]
    )

    expected_falls_baseline = treated_population * inputs["annual_fall_risk"]
    falls_avoided = expected_falls_baseline * inputs["relative_risk_reduction"]
    falls_after_intervention = expected_falls_baseline - falls_avoided

    admissions_avoided = falls_avoided * inputs["admission_rate_after_fall"]
    bed_days_avoided = admissions_avoided * inputs["average_length_of_stay"]

    programme_cost = treated_population * inputs["intervention_cost_per_person"]
    gross_savings = admissions_avoided * inputs["cost_per_admission"]
    net_cost = programme_cost - gross_savings

    qaly_gained = falls_avoided * inputs["qaly_loss_per_serious_fall"]
    cost_per_qaly = safe_divide(net_cost, qaly_gained)
    roi = safe_divide(gross_savings, programme_cost)
    cost_per_fall_avoided = safe_divide(net_cost, falls_avoided)

    break_even_effectiveness = calculate_break_even_effectiveness(inputs)
    break_even_effectiveness = clamp_rate(break_even_effectiveness)

    return {
        "treated_population": treated_population,
        "expected_falls_baseline": expected_falls_baseline,
        "falls_after_intervention": falls_after_intervention,
        "falls_avoided": falls_avoided,
        "admissions_avoided": admissions_avoided,
        "bed_days_avoided": bed_days_avoided,
        "programme_cost": programme_cost,
        "gross_savings": gross_savings,
        "net_cost": net_cost,
        "qaly_gained": qaly_gained,
        "cost_per_qaly": cost_per_qaly,
        "roi": roi,
        "cost_per_fall_avoided": cost_per_fall_avoided,
        "break_even_effectiveness": break_even_effectiveness,
    }


def calculate_break_even_effectiveness(inputs: dict) -> float:
    treated_population = (
        inputs["eligible_population"]
        * inputs["uptake_rate"]
        * inputs["adherence_rate"]
    )

    baseline_falls = treated_population * inputs["annual_fall_risk"]
    qaly_per_fall = inputs["qaly_loss_per_serious_fall"]
    threshold = inputs["cost_effectiveness_threshold"]
    cost_per_person = inputs["intervention_cost_per_person"]
    admission_rate = inputs["admission_rate_after_fall"]
    cost_per_admission = inputs["cost_per_admission"]

    numerator = treated_population * cost_per_person
    denominator = baseline_falls * (
        admission_rate * cost_per_admission + qaly_per_fall * threshold
    )

    if denominator <= 0:
        return 0.0

    return numerator / denominator
