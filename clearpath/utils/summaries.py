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
        return "targeting and concentration of later diagnosis"
    if inputs["costing_method"] == "Combined illustrative view":
        return "the chosen costing method and the achievable diagnosis shift"
    if inputs["intervention_cost_per_case_reached"] >= 500:
        return "delivery cost per case reached"
    if inputs["achievable_reduction_in_late_diagnosis"] <= 0.07:
        return "the achievable reduction in late diagnosis"
    if inputs["participation_dropoff_rate"] >= 0.15:
        return "participation persistence over time"
    if inputs["qaly_gain_per_case_shifted"] <= 0.15:
        return "the assumed QALY gain from earlier diagnosis"
    return "a combination of achievable shift, targeting, and delivery cost"


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
        return (
            "Promising, but still assumption-dependent. "
            f"The current configuration appears cost-effective rather than cost-saving. {robustness}"
        )
    return (
        "Currently weak as a decision case. Earlier diagnosis delivers benefit, "
        f"but the economics are not yet convincing. {robustness}"
    )


def generate_structured_recommendation(inputs: dict, results: dict, uncertainty_df) -> dict:
    threshold = inputs["cost_effectiveness_threshold"]
    robustness = assess_uncertainty_robustness(uncertainty_df, threshold)
    main_dependency = get_main_driver_text(inputs)

    if inputs["costing_method"] == "Combined illustrative view":
        main_fragility = (
            "The result is sensitive to how value is counted, especially if treatment and acute savings overlap."
        )
    elif inputs["targeting_mode"] == "Broad population":
        main_fragility = (
            "The result may depend on whether broad implementation is diluting value that would look stronger in a higher-risk subgroup."
        )
    elif inputs["participation_dropoff_rate"] >= 0.10:
        main_fragility = "The case may weaken if reach falls faster than assumed over time."
    else:
        main_fragility = robustness

    if inputs["targeting_mode"] == "Broad population":
        best_next_step = "Test whether a more targeted implementation improves value without losing too much impact."
    elif inputs["costing_method"] == "Combined illustrative view":
        best_next_step = (
            "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation."
        )
    elif results["discounted_cost_per_qaly"] > threshold:
        best_next_step = (
            "Validate the highest-leverage assumptions locally, especially shift size, cost inputs, and expected persistence of effect."
        )
    else:
        best_next_step = (
            "Pressure-test the strongest assumptions locally before moving from exploratory use to decision support."
        )

    return {
        "main_dependency": main_dependency,
        "main_fragility": main_fragility,
        "best_next_step": best_next_step,
    }


def generate_decision_readiness(inputs: dict, results: dict, uncertainty_df) -> dict:
    validate_next = []

    if inputs["costing_method"] == "Combined illustrative view":
        validate_next.append("Validate whether treatment and acute activity savings overlap under local costing rules.")
    else:
        validate_next.append("Validate the local cost inputs used in the economic framing.")

    if inputs["targeting_mode"] != "Broad population":
        validate_next.append("Confirm the real prevalence and operational identifiability of the higher-risk group.")
    else:
        validate_next.append("Confirm whether a more targeted implementation strategy would be operationally feasible.")

    if inputs["achievable_reduction_in_late_diagnosis"] <= 0.07:
        validate_next.append(
            "Check whether the assumed reduction in late diagnosis is realistic for the intervention being considered."
        )
    else:
        validate_next.append(
            "Validate whether the assumed shift from later to earlier diagnosis is achievable in practice."
        )

    if inputs["participation_dropoff_rate"] >= 0.10:
        validate_next.append("Review whether effective reach is likely to fall at the assumed rate over time.")

    if results["break_even_horizon"].startswith(">"):
        validate_next.append(
            "The model does not reach threshold within the tested horizon, so local cost and effect assumptions should be reviewed first."
        )
    else:
        validate_next.append("Check whether the implied break-even horizon is realistic in the local planning context.")

    readiness_note = (
        "This sandbox is best treated as decision-preparation support. The next step should be to validate the highest-leverage local assumptions before any real-world use."
    )

    return {
        "validate_next": validate_next[:5],
        "readiness_note": readiness_note,
    }


def summarise_scenario_strengths(scenario_df) -> str:
    best_value = scenario_df.loc[scenario_df["Discounted cost per QALY"].idxmin()]
    best_efficiency = scenario_df.loc[scenario_df["Discounted net cost"].idxmin()]
    best_impact = scenario_df.loc[scenario_df["Cases shifted earlier"].idxmax()]

    if (
        best_value["Scenario"] == best_efficiency["Scenario"]
        and best_efficiency["Scenario"] == best_impact["Scenario"]
    ):
        return (
            f"Under the current settings, **{best_value['Scenario']}** is simultaneously strongest for value, efficiency, and impact."
        )

    return (
        f"Under the current settings, **{best_value['Scenario']}** looks strongest for value, "
        f"**{best_efficiency['Scenario']}** looks strongest for efficiency, and "
        f"**{best_impact['Scenario']}** looks strongest for impact."
    )


def generate_overview_summary(results: dict, inputs: dict, uncertainty_df) -> str:
    threshold = inputs["cost_effectiveness_threshold"]
    main_driver = get_main_driver_text(inputs)
    uncertainty_text = assess_uncertainty_robustness(uncertainty_df, threshold)

    shifted = f"{results['cases_shifted_total']:.0f}"
    emergencies = f"{results['emergency_presentations_avoided_total']:.0f}"
    admissions = f"{results['admissions_avoided_total']:.0f}"
    horizon = inputs["time_horizon_years"]
    targeting = inputs["targeting_mode"].lower()
    costing = inputs["costing_method"].lower()

    if results["discounted_net_cost_total"] < 0:
        return (
            f"Over {horizon} year{'s' if horizon != 1 else ''}, ClearPath suggests the intervention could shift around "
            f"{shifted} cases earlier, avoid {emergencies} emergency presentations and {admissions} admissions, while appearing cost-saving on a discounted basis. "
            f"The current case reflects {targeting} using {costing}. The result is most strongly shaped by {main_driver}. {uncertainty_text}"
        )

    if 0 < results["discounted_cost_per_qaly"] <= threshold:
        return (
            f"Over {horizon} year{'s' if horizon != 1 else ''}, ClearPath suggests the intervention creates meaningful pathway and outcome benefit, "
            f"with around {shifted} cases shifted earlier and {admissions} admissions avoided. It does not appear cost-saving, but it does sit within the current threshold on a discounted basis. "
            f"The current case reflects {targeting} using {costing}. The result is most strongly shaped by {main_driver}. {uncertainty_text}"
        )

    return (
        f"Over {horizon} year{'s' if horizon != 1 else ''}, ClearPath suggests the intervention creates measurable benefit, "
        f"with around {shifted} cases shifted earlier and {admissions} admissions avoided, but the discounted economic case remains above the current threshold. "
        f"The current case reflects {targeting} using {costing}. The result is most strongly shaped by {main_driver}. {uncertainty_text}"
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
            f"ClearPath suggests the intervention generates measurable pathway benefit and a discounted net saving over {horizon} year"
            f"{'s' if horizon != 1 else ''}. The current case is promising, but still depends on assumptions that remain partly illustrative."
        )
    elif 0 < results["discounted_cost_per_qaly"] <= threshold:
        what_model_suggests = (
            f"ClearPath suggests the intervention delivers measurable pathway and outcome benefit and appears cost-effective over {horizon} year"
            f"{'s' if horizon != 1 else ''}, although it does not appear cost-saving. The result looks promising, but still assumption-dependent."
        )
    else:
        what_model_suggests = (
            f"ClearPath suggests the intervention delivers measurable benefit over {horizon} year"
            f"{'s' if horizon != 1 else ''}, but the discounted economic case remains above the current threshold."
        )

    what_drives_result = (
        f"The current result depends most strongly on {dependency}, as well as the chosen costing method, the quality of targeting, "
        f"and whether intervention reach and effect persist over time."
    )

    if inputs["costing_method"] == "Combined illustrative view":
        what_looks_fragile = (
            "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap."
        )
    elif inputs["targeting_mode"] == "Broad population":
        what_looks_fragile = (
            "The case may be fragile because broad implementation can dilute value if the highest-opportunity patients are only a subset of the incident population."
        )
    else:
        what_looks_fragile = uncertainty_text

    what_to_validate_next = (
        f"Before using this in a real decision conversation, the most important next checks are: {readiness['validate_next'][0]} "
        f"Then check whether the intervention would still look worthwhile over around {break_even_horizon} under locally credible assumptions."
    )

    limitations = (
        "This sandbox does not capture full staging complexity, disease progression, survival modelling, comparator trial evidence, or richer uncertainty modelling. "
        "It remains a structured exploratory tool rather than a formal appraisal model."
    )

    return {
        "what_model_suggests": what_model_suggests,
        "what_drives_result": what_drives_result,
        "what_looks_fragile": what_looks_fragile,
        "what_to_validate_next": what_to_validate_next,
        "limitations": limitations,
    }