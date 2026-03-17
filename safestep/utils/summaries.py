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


def assess_uncertainty_robustness(uncertainty_df, threshold: float) -> str:
    all_below = (uncertainty_df["discounted_cost_per_qaly"] <= threshold).all()
    all_cost_saving = (uncertainty_df["discounted_net_cost_total"] < 0).all()
    any_below = (uncertainty_df["discounted_cost_per_qaly"] <= threshold).any()

    if all_cost_saving:
        return "The result appears robustly cost-saving across the bounded uncertainty cases."
    if all_below:
        return "The result appears fairly robust across the bounded uncertainty cases."
    if any_below:
        return "The result looks fragile: some bounded cases are below threshold, while others are not."
    return "The result remains above threshold across the bounded uncertainty cases."


def get_main_driver_text(inputs: dict) -> str:
    if inputs["targeting_mode"] != "Broad population":
        return "targeting and baseline risk concentration"
    if inputs["costing_method"] == "Combined illustrative view":
        return "the chosen costing method and intervention effectiveness"
    if inputs["intervention_cost_per_person"] >= 300:
        return "delivery cost per participant"
    if inputs["relative_risk_reduction"] <= 0.15:
        return "intervention effectiveness"
    if inputs["participation_dropoff_rate"] >= 0.15:
        return "participation persistence over time"
    if inputs["effect_decay_rate"] >= 0.15:
        return "how quickly the intervention effect decays over time"
    return "a combination of intervention effectiveness, targeting, and delivery cost"


def generate_overview_summary(results: dict, inputs: dict, uncertainty_df) -> str:
    threshold = inputs["cost_effectiveness_threshold"]
    main_driver = get_main_driver_text(inputs)
    uncertainty_text = assess_uncertainty_robustness(uncertainty_df, threshold)

    falls = f"{results['falls_avoided_total']:.0f}"
    admissions = f"{results['admissions_avoided_total']:.0f}"
    horizon = inputs["time_horizon_years"]
    targeting = inputs["targeting_mode"].lower()
    costing = inputs["costing_method"].lower()

    if results["discounted_net_cost_total"] < 0:
        return (
            f"Over {horizon} year{'s' if horizon != 1 else ''}, SafeStep suggests the programme could avoid around "
            f"{falls} falls and {admissions} admissions while appearing cost-saving on a discounted basis. "
            f"The current case reflects {targeting} using {costing}. The result is most strongly shaped by {main_driver}. "
            f"{uncertainty_text}"
        )

    if 0 < results["discounted_cost_per_qaly"] <= threshold:
        return (
            f"Over {horizon} year{'s' if horizon != 1 else ''}, SafeStep suggests the programme delivers meaningful health benefit, "
            f"with around {falls} falls avoided and {admissions} admissions avoided. It does not appear cost-saving, but it does sit "
            f"within the current threshold on a discounted basis. The current case reflects {targeting} using {costing}. "
            f"The result is most strongly shaped by {main_driver}. {uncertainty_text}"
        )

    return (
        f"Over {horizon} year{'s' if horizon != 1 else ''}, SafeStep suggests the programme delivers measurable benefit, "
        f"with around {falls} falls avoided and {admissions} admissions avoided, but the discounted economic case remains above the current threshold. "
        f"The current case reflects {targeting} using {costing}. The result is most strongly shaped by {main_driver}. "
        f"{uncertainty_text}"
    )


def generate_interpretation(results: dict, inputs: dict, uncertainty_df) -> dict:
    threshold = inputs["cost_effectiveness_threshold"]
    main_driver = get_main_driver_text(inputs)
    horizon = inputs["time_horizon_years"]
    break_even_horizon = results["break_even_horizon"]
    uncertainty_text = assess_uncertainty_robustness(uncertainty_df, threshold)

    if results["discounted_net_cost_total"] < 0:
        what_model_suggests = (
            f"SafeStep suggests the programme generates measurable health benefit and a discounted net saving over {horizon} year"
            f"{'s' if horizon != 1 else ''}. The current case looks stronger because of the chosen targeting and costing assumptions."
        )
    elif 0 < results["discounted_cost_per_qaly"] <= threshold:
        what_model_suggests = (
            f"SafeStep suggests the programme delivers measurable health benefit and appears cost-effective over {horizon} year"
            f"{'s' if horizon != 1 else ''}, although it does not appear cost-saving. The case is credible, but still sensitive to the delivery set-up."
        )
    else:
        what_model_suggests = (
            f"SafeStep suggests the programme delivers measurable health benefit over {horizon} year"
            f"{'s' if horizon != 1 else ''}, but the discounted economic case remains above the current threshold."
        )

    what_drives_result = (
        f"The result is mainly driven by {main_driver}, along with the selected costing method, the persistence of participation over time, "
        f"and whether the intervention is applied broadly or focused on a higher-risk subgroup."
    )

    what_improves_case = (
        f"The case becomes stronger when delivery cost falls, effectiveness increases, participation persists for longer, "
        f"or the intervention is more tightly targeted toward higher-risk patients. Under the current assumptions, the model suggests the programme "
        f"would need around {break_even_horizon} to reach the threshold if all else stayed the same."
    )

    limitations = (
        f"{uncertainty_text} Before real use, the most important things to validate would be local costing assumptions, how risk is distributed in the target population, "
        f"and whether participation and effect persist in practice. This remains a rapid exploratory sandbox, not a formal appraisal model."
    )

    return {
        "what_model_suggests": what_model_suggests,
        "what_drives_result": what_drives_result,
        "what_improves_case": what_improves_case,
        "limitations": limitations,
    }