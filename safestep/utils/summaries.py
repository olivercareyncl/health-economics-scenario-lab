from utils.metadata import ASSUMPTION_META


def get_decision_status(results: dict, threshold: float) -> str:
    if results["net_cost"] < 0:
        return "Appears cost-saving"
    if results["cost_per_qaly"] > 0 and results["cost_per_qaly"] <= threshold:
        return "Appears cost-effective"
    return "Above current threshold"


def get_net_cost_label(results: dict) -> str:
    if results["net_cost"] < 0:
        return "Net saving"
    return "Net cost"


def get_main_driver_text(inputs: dict) -> str:
    drivers = {
        "intervention effectiveness": inputs["relative_risk_reduction"],
        "delivery cost per participant": inputs["intervention_cost_per_person"],
        "baseline fall risk": inputs["annual_fall_risk"],
        "proportion of falls leading to admission": inputs["admission_rate_after_fall"],
        "QALY loss per serious fall": inputs["qaly_loss_per_serious_fall"],
    }

    if inputs["intervention_cost_per_person"] >= 300:
        return "delivery cost per participant"
    if inputs["relative_risk_reduction"] <= 0.15:
        return "intervention effectiveness"
    if inputs["annual_fall_risk"] >= 0.40:
        return "baseline fall risk in the targeted population"
    if inputs["admission_rate_after_fall"] >= 0.25:
        return "the proportion of falls that lead to admission"
    if inputs["qaly_loss_per_serious_fall"] >= 0.07:
        return "the assumed quality-of-life loss associated with serious falls"

    return "a combination of intervention effectiveness and delivery cost"


def generate_overview_summary(results: dict, inputs: dict) -> str:
    threshold = inputs["cost_effectiveness_threshold"]
    decision_status = get_decision_status(results, threshold)
    main_driver = get_main_driver_text(inputs)

    falls = f"{results['falls_avoided']:.0f}"
    admissions = f"{results['admissions_avoided']:.0f}"
    bed_days = f"{results['bed_days_avoided']:.0f}"

    if results["net_cost"] < 0:
        return (
            f"Under the current assumptions, SafeStep suggests the programme could avoid around {falls} falls, "
            f"{admissions} admissions, and {bed_days} bed days, while appearing cost-saving overall. "
            f"The result is most strongly shaped by {main_driver}."
        )

    if 0 < results["cost_per_qaly"] <= threshold:
        return (
            f"Under the current assumptions, SafeStep suggests the programme delivers a meaningful health benefit, "
            f"with around {falls} falls avoided and {admissions} admissions avoided. "
            f"It does not appear cost-saving, but it does sit within the current cost-effectiveness threshold. "
            f"The result is most strongly shaped by {main_driver}."
        )

    return (
        f"Under the current assumptions, SafeStep suggests the programme delivers measurable benefit, "
        f"with around {falls} falls avoided, {admissions} admissions avoided, and {bed_days} bed days saved. "
        f"However, the economic case remains above the current threshold. "
        f"The result is most strongly shaped by {main_driver}."
    )


def generate_interpretation(results: dict, inputs: dict) -> dict:
    threshold = inputs["cost_effectiveness_threshold"]
    decision_status = get_decision_status(results, threshold)
    main_driver = get_main_driver_text(inputs)

    if results["net_cost"] < 0:
        what_model_suggests = (
            f"SafeStep suggests the programme generates both measurable health benefit and a net saving under the current assumptions. "
            f"The model estimates around {results['falls_avoided']:.0f} falls avoided and {results['admissions_avoided']:.0f} admissions avoided."
        )
    elif 0 < results["cost_per_qaly"] <= threshold:
        what_model_suggests = (
            f"SafeStep suggests the programme delivers measurable health benefit and appears cost-effective under the current assumptions, "
            f"although it does not appear cost-saving. The model estimates around {results['falls_avoided']:.0f} falls avoided and "
            f"{results['admissions_avoided']:.0f} admissions avoided."
        )
    else:
        what_model_suggests = (
            f"SafeStep suggests the programme delivers measurable health benefit, but the economic case remains above the current threshold. "
            f"The model estimates around {results['falls_avoided']:.0f} falls avoided and {results['admissions_avoided']:.0f} admissions avoided."
        )

    what_drives_result = (
        f"The result is mainly driven by {main_driver}, along with the interaction between programme reach, baseline fall risk, "
        f"and the proportion of falls that lead to admission."
    )

    what_improves_case = (
        "The case becomes stronger when the intervention is delivered at lower cost, achieves a larger reduction in falls, "
        "or is targeted toward a higher-risk population where avoidable events are more concentrated."
    )

    limitations = (
        "This sandbox does not capture wider social care effects, fear of falling, carer burden, implementation friction, "
        "or longer-term quality-of-life gains beyond the simple QALY proxy used here. It is intended for rapid exploration, not formal appraisal."
    )

    return {
        "what_model_suggests": what_model_suggests,
        "what_drives_result": what_drives_result,
        "what_improves_case": what_improves_case,
        "limitations": limitations,
    }
