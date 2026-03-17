def get_decision_status(results: dict, threshold: float) -> str:
    if results["discounted_net_cost_total"] < 0:
        return "Appears cost-saving"
    if results["discounted_cost_per_qaly"] > 0 and results["discounted_cost_per_qaly"] <= threshold:
        return "Appears cost-effective"
    return "Above current threshold"


def get_net_cost_label(results: dict) -> str:
    if results["discounted_net_cost_total"] < 0:
        return "Discounted net saving"
    return "Discounted net cost"


def get_main_driver_text(inputs: dict) -> str:
    if inputs["intervention_cost_per_person"] >= 300:
        return "delivery cost per participant"
    if inputs["relative_risk_reduction"] <= 0.15:
        return "intervention effectiveness"
    if inputs["effect_decay_rate"] >= 0.15:
        return "how quickly the intervention effect decays over time"
    if inputs["annual_fall_risk"] >= 0.40:
        return "baseline fall risk in the targeted population"
    if inputs["admission_rate_after_fall"] >= 0.25:
        return "the proportion of falls that lead to admission"
    if inputs["qaly_loss_per_serious_fall"] >= 0.07:
        return "the assumed quality-of-life loss associated with serious falls"

    return "a combination of intervention effectiveness, persistence of effect, and delivery cost"


def generate_overview_summary(results: dict, inputs: dict) -> str:
    threshold = inputs["cost_effectiveness_threshold"]
    main_driver = get_main_driver_text(inputs)

    falls = f"{results['falls_avoided_total']:.0f}"
    admissions = f"{results['admissions_avoided_total']:.0f}"
    bed_days = f"{results['bed_days_avoided_total']:.0f}"
    horizon = inputs["time_horizon_years"]

    if results["discounted_net_cost_total"] < 0:
        return (
            f"Over {horizon} year{'s' if horizon != 1 else ''}, SafeStep suggests the programme could avoid around "
            f"{falls} falls, {admissions} admissions, and {bed_days} bed days, while appearing cost-saving on a discounted basis. "
            f"The case is most strongly shaped by {main_driver}."
        )

    if 0 < results["discounted_cost_per_qaly"] <= threshold:
        return (
            f"Over {horizon} year{'s' if horizon != 1 else ''}, SafeStep suggests the programme delivers a meaningful health benefit, "
            f"with around {falls} falls avoided and {admissions} admissions avoided. "
            f"It does not appear cost-saving, but it does sit within the current cost-effectiveness threshold on a discounted basis. "
            f"The case is most strongly shaped by {main_driver}."
        )

    return (
        f"Over {horizon} year{'s' if horizon != 1 else ''}, SafeStep suggests the programme delivers measurable benefit, "
        f"with around {falls} falls avoided, {admissions} admissions avoided, and {bed_days} bed days saved. "
        f"However, the discounted economic case remains above the current threshold. "
        f"The case is most strongly shaped by {main_driver}."
    )


def generate_interpretation(results: dict, inputs: dict) -> dict:
    threshold = inputs["cost_effectiveness_threshold"]
    main_driver = get_main_driver_text(inputs)
    horizon = inputs["time_horizon_years"]
    break_even_horizon = results["break_even_horizon"]

    if results["discounted_net_cost_total"] < 0:
        what_model_suggests = (
            f"SafeStep suggests the programme generates measurable health benefit and a discounted net saving over {horizon} year"
            f"{'s' if horizon != 1 else ''}. The model estimates around {results['falls_avoided_total']:.0f} falls avoided and "
            f"{results['admissions_avoided_total']:.0f} admissions avoided."
        )
    elif 0 < results["discounted_cost_per_qaly"] <= threshold:
        what_model_suggests = (
            f"SafeStep suggests the programme delivers measurable health benefit and appears cost-effective over {horizon} year"
            f"{'s' if horizon != 1 else ''}, although it does not appear cost-saving. The model estimates around "
            f"{results['falls_avoided_total']:.0f} falls avoided and {results['admissions_avoided_total']:.0f} admissions avoided."
        )
    else:
        what_model_suggests = (
            f"SafeStep suggests the programme delivers measurable health benefit over {horizon} year"
            f"{'s' if horizon != 1 else ''}, but the discounted economic case remains above the current threshold. "
            f"The model estimates around {results['falls_avoided_total']:.0f} falls avoided and {results['admissions_avoided_total']:.0f} admissions avoided."
        )

    what_drives_result = (
        f"The result is mainly driven by {main_driver}, along with the selected time horizon and the interaction between programme reach, "
        f"baseline fall risk, and the share of falls that lead to admission."
    )

    what_improves_case = (
        f"The case becomes stronger when the intervention is delivered at lower cost, achieves a larger reduction in falls, "
        f"retains its effect for longer, or is targeted toward a higher-risk population. Under the current assumptions, the model suggests "
        f"the programme would need around {break_even_horizon} to reach the cost-effectiveness threshold if all else stayed the same."
    )

    limitations = (
        "This sandbox does not capture wider social care effects, fear of falling, carer burden, implementation friction, "
        "drop-out over time beyond the simple decay input, or longer-term quality-of-life gains beyond the QALY proxy used here. "
        "It is intended for rapid exploration, not formal appraisal."
    )

    return {
        "what_model_suggests": what_model_suggests,
        "what_drives_result": what_drives_result,
        "what_improves_case": what_improves_case,
        "limitations": limitations,
    }
