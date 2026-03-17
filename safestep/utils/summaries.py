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


def assess_uncertainty_robustness(uncertainty_df, threshold: float) -> str:
    all_below = (uncertainty_df["discounted_cost_per_qaly"] <= threshold).all()
    all_cost_saving = (uncertainty_df["discounted_net_cost_total"] < 0).all()
    any_below = (uncertainty_df["discounted_cost_per_qaly"] <= threshold).any()

    if all_cost_saving:
        return "The case appears robustly cost-saving across bounded low, base, and high cases."
    if all_below:
        return "The case appears fairly robust across bounded low, base, and high cases."
    if any_below:
        return "The case looks fragile: some bounded cases are below threshold, while others are not."
    return "The case remains above threshold across the bounded cases."


def generate_overall_signal(results: dict, inputs: dict, uncertainty_df) -> str:
    threshold = inputs["cost_effectiveness_threshold"]
    robustness = assess_uncertainty_robustness(uncertainty_df, threshold)

    if results["discounted_net_cost_total"] < 0:
        return f"Promising for further exploration. The current configuration appears cost-saving. {robustness}"
    if 0 < results["discounted_cost_per_qaly"] <= threshold:
        return f"Promising, but still assumption-dependent. The current configuration appears cost-effective rather than cost-saving. {robustness}"
    return f"Currently weak as a decision case. The intervention delivers benefit, but the economics are not yet convincing. {robustness}"


def generate_structured_recommendation(inputs: dict, results: dict, uncertainty_df) -> dict:
    threshold = inputs["cost_effectiveness_threshold"]
    robustness = assess_uncertainty_robustness(uncertainty_df, threshold)
    main_dependency = get_main_driver_text(inputs)

    if inputs["costing_method"] == "Combined illustrative view":
        main_fragility = (
            "The result is sensitive to how impact is valued, especially if admission and bed-day savings overlap."
        )
    elif inputs["targeting_mode"] == "Broad population":
        main_fragility = (
            "The result may depend on whether broad delivery is diluting value that would look stronger in a higher-risk subgroup."
        )
    elif inputs["participation_dropoff_rate"] >= 0.10:
        main_fragility = "The case may weaken if participation persistence is worse than assumed."
    else:
        main_fragility = robustness

    if inputs["targeting_mode"] == "Broad population":
        best_next_step = "Test whether a more targeted delivery model improves value without losing too much impact."
    elif inputs["costing_method"] == "Combined illustrative view":
        best_next_step = "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation."
    elif results["discounted_cost_per_qaly"] > threshold:
        best_next_step = "Validate the highest-leverage assumptions locally, especially cost inputs and expected persistence of effect."
    else:
        best_next_step = "Pressure-test the strongest assumptions locally before moving from exploratory use to decision support."

    return {
        "main_dependency": main_dependency,
        "main_fragility": main_fragility,
        "best_next_step": best_next_step,
    }


def generate_decision_readiness(inputs: dict, results: dict, uncertainty_df) -> dict:
    validate_next = []

    if inputs["costing_method"] == "Combined illustrative view":
        validate_next.append("Validate whether admission costs and bed-day values overlap under local costing rules.")
    else:
        validate_next.append("Validate the local cost inputs used in the economic framing.")

    if inputs["targeting_mode"] != "Broad population":
        validate_next.append("Confirm the real prevalence and operational identifiability of the higher-risk subgroup.")
    else:
        validate_next.append("Confirm whether a more targeted intervention strategy would be operationally feasible.")

    if inputs["participation_dropoff_rate"] >= 0.10:
        validate_next.append("Check whether annual participation drop-off is realistic for the delivery model being considered.")
    else:
        validate_next.append("Validate whether participation can realistically remain as stable as assumed.")

    if inputs["effect_decay_rate"] >= 0.10:
        validate_next.append("Review whether the intervention effect is likely to decay at the assumed rate over time.")

    if results["break_even_horizon"].startswith(">"):
        validate_next.append("The model does not reach threshold within the tested horizon, so local cost and effect assumptions should be reviewed first.")
    else:
        validate_next.append("Check whether the implied break-even horizon is realistic in the local planning context.")

    readiness_note = (
        "This sandbox is best treated as decision-preparation support. The next step should be to validate the highest-leverage local assumptions before any real-world use."
    )

    return {
        "validate_next": validate_next[:5],
        "readiness_note": readiness_note,
    }


def get_comparator_summary(base_results: dict, comparator_results: dict, comparator_label: str) -> dict:
    delta_falls = comparator_results["falls_avoided_total"] - base_results["falls_avoided_total"]
    delta_net_cost = comparator_results["discounted_net_cost_total"] - base_results["discounted_net_cost_total"]
    delta_cost_per_qaly = comparator_results["discounted_cost_per_qaly"] - base_results["discounted_cost_per_qaly"]

    if delta_falls > 0 and delta_net_cost < 0:
        summary_text = (
            f"Against the current configuration, **{comparator_label}** looks stronger on both impact and efficiency."
        )
    elif delta_falls > 0:
        summary_text = (
            f"Against the current configuration, **{comparator_label}** improves health impact, but at a weaker economic position."
        )
    elif delta_net_cost < 0:
        summary_text = (
            f"Against the current configuration, **{comparator_label}** improves the economic position, but with less health gain."
        )
    else:
        summary_text = (
            f"Against the current configuration, **{comparator_label}** does not currently look stronger on either impact or economics."
        )

    return {
        "delta_falls": delta_falls,
        "delta_net_cost": delta_net_cost,
        "delta_cost_per_qaly": delta_cost_per_qaly,
        "summary_text": summary_text,
    }


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


def summarise_scenario_strengths(scenario_df) -> str:
    best_value = scenario_df.loc[scenario_df["Discounted cost per QALY"].idxmin()]
    best_efficiency = scenario_df.loc[scenario_df["Discounted net cost"].idxmin()]
    best_impact = scenario_df.loc[scenario_df["Falls avoided"].idxmax()]

    if best_value["Scenario"] == best_efficiency["Scenario"] == best_impact["Scenario"]:
        return (
            f"Under the current settings, **{best_value['Scenario']}** is simultaneously strongest for value, efficiency, and impact."
        )

    return (
        f"Under the current settings, **{best_value['Scenario']}** looks strongest for value, "
        f"**{best_efficiency['Scenario']}** looks strongest for efficiency, and "
        f"**{best_impact['Scenario']}** looks strongest for impact."
    )


def generate_interpretation(results: dict, inputs: dict, uncertainty_df) -> dict:
    threshold = inputs["cost_effectiveness_threshold"]
    horizon = inputs["time_horizon_years"]
    break_even_horizon = results["break_even_horizon"]
    uncertainty_text = assess_uncertainty_robustness(uncertainty_df, threshold)
    dependency = get_main_driver_text(inputs)
    readiness = generate_decision_readiness(inputs, results, uncertainty_df)

    if results["discounted_net_cost_total"] < 0:
        what_model_suggests = (
            f"SafeStep suggests the programme generates measurable health benefit and a discounted net saving over {horizon} year"
            f"{'s' if horizon != 1 else ''}. The current case is promising, but still depends on assumptions that remain partly illustrative."
        )
    elif 0 < results["discounted_cost_per_qaly"] <= threshold:
        what_model_suggests = (
            f"SafeStep suggests the programme delivers measurable health benefit and appears cost-effective over {horizon} year"
            f"{'s' if horizon != 1 else ''}, although it does not appear cost-saving. The result looks promising, but still assumption-dependent."
        )
    else:
        what_model_suggests = (
            f"SafeStep suggests the programme delivers measurable health benefit over {horizon} year"
            f"{'s' if horizon != 1 else ''}, but the discounted economic case remains above the current threshold."
        )

    what_drives_result = (
        f"The current result depends most strongly on {dependency}, as well as the chosen costing method, the quality of targeting, "
        f"and whether participation and effect persist over time."
    )

    if inputs["costing_method"] == "Combined illustrative view":
        what_looks_fragile = (
            "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap."
        )
    elif inputs["targeting_mode"] == "Broad population":
        what_looks_fragile = (
            "The case may be fragile because broad delivery can dilute value if the highest-risk patients are only a subset of the eligible population."
        )
    else:
        what_looks_fragile = uncertainty_text

    what_to_validate_next = (
        f"Before using this in a real decision conversation, the most important next checks are: {readiness['validate_next'][0]} "
        f"Then check whether the intervention would still look worthwhile over around {break_even_horizon} under locally credible assumptions."
    )

    limitations = (
        "This sandbox still does not capture full service pathway complexity, formal evidence synthesis, comparator trial data, or richer uncertainty modelling. "
        "It remains a structured exploratory tool rather than a formal appraisal model."
    )

    return {
        "what_model_suggests": what_model_suggests,
        "what_drives_result": what_drives_result,
        "what_looks_fragile": what_looks_fragile,
        "what_to_validate_next": what_to_validate_next,
        "limitations": limitations,
    }