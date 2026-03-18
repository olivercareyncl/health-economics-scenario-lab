from copy import deepcopy

import pandas as pd


def _apply_targeting_mode(inputs: dict) -> dict:
    adjusted = deepcopy(inputs)
    mode = adjusted.get("targeting_mode", "Complication-risk focus")

    if mode == "Broad at-risk population":
        adjusted["eligible_population"] *= 1.25
        adjusted["baseline_complication_rate"] *= 0.75
        adjusted["complication_risk_reduction"] *= 0.85
    elif mode == "Poorly controlled diabetes targeting":
        adjusted["eligible_population"] *= 0.9
        adjusted["baseline_complication_rate"] *= 1.15
        adjusted["complication_risk_reduction"] *= 1.05
    elif mode == "Complication-risk focus":
        adjusted["eligible_population"] *= 0.75
        adjusted["baseline_complication_rate"] *= 1.35
        adjusted["complication_risk_reduction"] *= 1.15

    adjusted["baseline_complication_rate"] = min(
        max(adjusted["baseline_complication_rate"], 0.0), 1.0
    )
    adjusted["complication_risk_reduction"] = min(
        max(adjusted["complication_risk_reduction"], 0.0), 0.95
    )

    return adjusted


def _get_discount_factor(year: int, discount_rate: float) -> float:
    return 1 / ((1 + discount_rate) ** year)


def _get_costing_method_savings(
    costing_method: str,
    complications_avoided: float,
    admissions_avoided: float,
    bed_days_avoided: float,
    cost_per_diabetes_complication: float,
    cost_per_admission: float,
    cost_per_bed_day: float,
) -> float:
    complication_and_admission_savings = (
        complications_avoided * cost_per_diabetes_complication
        + admissions_avoided * cost_per_admission
    )
    bed_day_savings = bed_days_avoided * cost_per_bed_day

    if costing_method == "Complication and admission savings only":
        return complication_and_admission_savings
    if costing_method == "Bed-day value only":
        return bed_day_savings
    if costing_method == "Combined illustrative view":
        return complication_and_admission_savings + bed_day_savings

    return complication_and_admission_savings


def run_model(inputs: dict) -> dict:
    model_inputs = _apply_targeting_mode(inputs)

    eligible_population = float(model_inputs["eligible_population"])
    baseline_complication_rate = float(model_inputs["baseline_complication_rate"])
    admission_probability_per_complication = float(
        model_inputs["admission_probability_per_complication"]
    )
    average_length_of_stay = float(model_inputs["average_length_of_stay"])
    intervention_reach_rate = float(model_inputs["intervention_reach_rate"])
    sustained_engagement_rate = float(model_inputs["sustained_engagement_rate"])
    annual_participation_dropoff_rate = float(
        model_inputs["annual_participation_dropoff_rate"]
    )
    complication_risk_reduction = float(model_inputs["complication_risk_reduction"])
    annual_effect_decay_rate = float(model_inputs["annual_effect_decay_rate"])
    intervention_cost_per_patient_reached = float(
        model_inputs["intervention_cost_per_patient_reached"]
    )
    cost_per_diabetes_complication = float(model_inputs["cost_per_diabetes_complication"])
    cost_per_admission = float(model_inputs["cost_per_admission"])
    cost_per_bed_day = float(model_inputs["cost_per_bed_day"])
    costing_method = model_inputs["costing_method"]
    qaly_gain_per_complication_avoided = float(
        model_inputs["qaly_gain_per_complication_avoided"]
    )
    time_horizon_years = int(model_inputs["time_horizon_years"])
    discount_rate = float(model_inputs["discount_rate"])
    cost_effectiveness_threshold = float(model_inputs["cost_effectiveness_threshold"])

    yearly_rows = []

    complications_avoided_total = 0.0
    admissions_avoided_total = 0.0
    bed_days_avoided_total = 0.0
    patients_reached_total = 0.0
    programme_cost_total = 0.0
    gross_savings_total = 0.0
    qalys_gained_total = 0.0
    discounted_net_cost_total = 0.0
    discounted_qalys_total = 0.0

    cumulative_net_cost = 0.0
    treated_population_year_1 = 0.0

    for year in range(1, time_horizon_years + 1):
        participation_factor = max(
            (1 - annual_participation_dropoff_rate) ** (year - 1), 0.0
        )
        effect_factor = max((1 - annual_effect_decay_rate) ** (year - 1), 0.0)

        patients_reached = (
            eligible_population * intervention_reach_rate * sustained_engagement_rate * participation_factor
        )
        if year == 1:
            treated_population_year_1 = patients_reached

        effective_risk_reduction = complication_risk_reduction * effect_factor

        complications_avoided = (
            patients_reached * baseline_complication_rate * effective_risk_reduction
        )
        admissions_avoided = complications_avoided * admission_probability_per_complication
        bed_days_avoided = admissions_avoided * average_length_of_stay

        programme_cost = patients_reached * intervention_cost_per_patient_reached
        gross_savings = _get_costing_method_savings(
            costing_method=costing_method,
            complications_avoided=complications_avoided,
            admissions_avoided=admissions_avoided,
            bed_days_avoided=bed_days_avoided,
            cost_per_diabetes_complication=cost_per_diabetes_complication,
            cost_per_admission=cost_per_admission,
            cost_per_bed_day=cost_per_bed_day,
        )
        net_cost = programme_cost - gross_savings
        qalys_gained = complications_avoided * qaly_gain_per_complication_avoided

        discount_factor = _get_discount_factor(year, discount_rate)
        discounted_net_cost = net_cost * discount_factor
        discounted_qalys = qalys_gained * discount_factor

        cumulative_net_cost += discounted_net_cost

        complications_avoided_total += complications_avoided
        admissions_avoided_total += admissions_avoided
        bed_days_avoided_total += bed_days_avoided
        patients_reached_total += patients_reached
        programme_cost_total += programme_cost
        gross_savings_total += gross_savings
        qalys_gained_total += qalys_gained
        discounted_net_cost_total += discounted_net_cost
        discounted_qalys_total += discounted_qalys

        yearly_rows.append(
            {
                "year": year,
                "patients_reached": patients_reached,
                "complications_avoided": complications_avoided,
                "admissions_avoided": admissions_avoided,
                "bed_days_avoided": bed_days_avoided,
                "programme_cost": programme_cost,
                "gross_savings": gross_savings,
                "net_cost": net_cost,
                "qalys_gained": qalys_gained,
                "discounted_net_cost": discounted_net_cost,
                "cumulative_net_cost": cumulative_net_cost,
            }
        )

    yearly_results = pd.DataFrame(yearly_rows)

    if discounted_qalys_total > 0:
        discounted_cost_per_qaly = discounted_net_cost_total / discounted_qalys_total
    else:
        discounted_cost_per_qaly = 0.0

    if programme_cost_total > 0:
        roi = gross_savings_total / programme_cost_total
    else:
        roi = 0.0

    gross_savings_per_patient = (
        gross_savings_total / patients_reached_total if patients_reached_total > 0 else 0.0
    )
    discounted_qaly_per_patient = (
        discounted_qalys_total / patients_reached_total if patients_reached_total > 0 else 0.0
    )

    break_even_cost_per_patient = gross_savings_per_patient + (
        cost_effectiveness_threshold * discounted_qaly_per_patient
    )

    if baseline_complication_rate > 0 and sustained_engagement_rate > 0:
        required_risk_reduction = min(
            max(
                complication_risk_reduction
                * (
                    break_even_cost_per_patient / intervention_cost_per_patient_reached
                    if intervention_cost_per_patient_reached > 0
                    else 0.0
                ),
                0.0,
            ),
            1.0,
        )
    else:
        required_risk_reduction = 0.0

    if complication_risk_reduction > 0 and sustained_engagement_rate > 0:
        required_baseline_complication_rate = min(
            max(
                baseline_complication_rate
                * (
                    break_even_cost_per_patient / intervention_cost_per_patient_reached
                    if intervention_cost_per_patient_reached > 0
                    else 0.0
                ),
                0.0,
            ),
            1.0,
        )
    else:
        required_baseline_complication_rate = 0.0

    break_even_horizon = "Not reached"
    for year in range(1, time_horizon_years + 1):
        partial_df = yearly_results[yearly_results["year"] <= year]
        partial_discounted_net_cost = partial_df["discounted_net_cost"].sum()
        partial_discounted_qalys = (
            partial_df["qalys_gained"]
            * partial_df["year"].apply(lambda y: _get_discount_factor(int(y), discount_rate))
        ).sum()

        if partial_discounted_qalys > 0:
            partial_cost_per_qaly = partial_discounted_net_cost / partial_discounted_qalys
            if partial_cost_per_qaly <= cost_effectiveness_threshold:
                break_even_horizon = f"{year} year{'s' if year > 1 else ''}"
                break
        elif partial_discounted_net_cost <= 0:
            break_even_horizon = f"{year} year{'s' if year > 1 else ''}"
            break

    return {
        "yearly_results": yearly_results,
        "treated_population_year_1": treated_population_year_1,
        "patients_reached_total": patients_reached_total,
        "complications_avoided_total": complications_avoided_total,
        "admissions_avoided_total": admissions_avoided_total,
        "bed_days_avoided_total": bed_days_avoided_total,
        "programme_cost_total": programme_cost_total,
        "gross_savings_total": gross_savings_total,
        "discounted_net_cost_total": discounted_net_cost_total,
        "discounted_qalys_total": discounted_qalys_total,
        "discounted_cost_per_qaly": discounted_cost_per_qaly,
        "qalys_gained_total": qalys_gained_total,
        "roi": roi,
        "break_even_cost_per_patient": break_even_cost_per_patient,
        "break_even_risk_reduction_required": required_risk_reduction,
        "break_even_baseline_complication_rate_required": required_baseline_complication_rate,
        "break_even_horizon": break_even_horizon,
    }


def run_bounded_uncertainty(inputs: dict) -> pd.DataFrame:
    scenarios = {
        "Low case": {
            "baseline_complication_rate": 0.85,
            "complication_risk_reduction": 0.8,
            "intervention_cost_per_patient_reached": 1.15,
            "sustained_engagement_rate": 0.9,
            "qaly_gain_per_complication_avoided": 0.85,
        },
        "Base case": {},
        "High case": {
            "baseline_complication_rate": 1.15,
            "complication_risk_reduction": 1.2,
            "intervention_cost_per_patient_reached": 0.85,
            "sustained_engagement_rate": 1.1,
            "qaly_gain_per_complication_avoided": 1.15,
        },
    }

    rows = []
    threshold = float(inputs["cost_effectiveness_threshold"])

    for case_name, multipliers in scenarios.items():
        case_inputs = deepcopy(inputs)

        for key, multiplier in multipliers.items():
            case_inputs[key] = case_inputs[key] * multiplier

        case_inputs["baseline_complication_rate"] = min(
            max(case_inputs["baseline_complication_rate"], 0.0), 1.0
        )
        case_inputs["complication_risk_reduction"] = min(
            max(case_inputs["complication_risk_reduction"], 0.0), 0.95
        )
        case_inputs["sustained_engagement_rate"] = min(
            max(case_inputs["sustained_engagement_rate"], 0.0), 1.0
        )

        results = run_model(case_inputs)

        if results["discounted_net_cost_total"] <= 0:
            decision_status = "Appears cost-saving"
        elif (
            results["discounted_qalys_total"] > 0
            and results["discounted_cost_per_qaly"] <= threshold
        ):
            decision_status = "Appears cost-effective"
        else:
            decision_status = "Above current threshold"

        if case_name == "Low case":
            dominant_domain = "Effectiveness and delivery"
        elif case_name == "High case":
            dominant_domain = "Targeting and achievable impact"
        else:
            dominant_domain = "Balanced base assumptions"

        rows.append(
            {
                "case": case_name,
                "complications_avoided_total": results["complications_avoided_total"],
                "discounted_net_cost_total": results["discounted_net_cost_total"],
                "discounted_cost_per_qaly": results["discounted_cost_per_qaly"],
                "decision_status": decision_status,
                "dominant_domain": dominant_domain,
            }
        )

    return pd.DataFrame(rows)


def build_comparator_case(defaults: dict, inputs: dict, comparator_mode: str) -> dict:
    comparator_inputs = deepcopy(inputs)

    comparator_map = {
        "Poorly controlled diabetes targeting": {
            "targeting_mode": "Poorly controlled diabetes targeting",
        },
        "Complication-risk focus": {
            "targeting_mode": "Complication-risk focus",
        },
        "Lower-cost delivery": {
            "intervention_cost_per_patient_reached": defaults["intervention_cost_per_patient_reached"] * 0.8,
        },
        "Stronger risk reduction": {
            "complication_risk_reduction": min(defaults["complication_risk_reduction"] * 1.25, 0.95),
        },
        "Targeted and stronger effect": {
            "targeting_mode": "Complication-risk focus",
            "complication_risk_reduction": min(defaults["complication_risk_reduction"] * 1.2, 0.95),
        },
    }

    for key, value in comparator_map.get(comparator_mode, {}).items():
        comparator_inputs[key] = value

    return comparator_inputs