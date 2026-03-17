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
    if inputs["targeting_mode"] == "Secondary prevention focus":
        return "concentrated recurrent event risk in a secondary prevention population"
    if inputs["costing_method"] == "Combined illustrative view":
        return "the chosen costing method and the blend of avoided-event savings"
    if inputs["intervention_cost_per_patient_reached"] >= 350:
        return "intervention cost per patient"
    if inputs["risk_reduction_in_recurrent_events"] >= 0.20:
        return "recurrent event risk reduction"
    if inputs["sustained_engagement_rate"] <= 0.70:
        return "sustained engagement and persistence"
    return "baseline recurrent event risk"


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
        "Currently weak as a decision case. The intervention improves outcomes, "
        f"but the economics are not yet convincing. {robustness}"
    )


def generate_structured_recommendation(inputs: dict, results: dict, uncertainty_df) -> dict:
    threshold = inputs["cost_effectiveness_threshold"]
    robustness = assess_uncertainty_robustness(uncertainty_df, threshold)
    main_dependency = get_main_driver_text(inputs)

    if inputs["costing_method"] == "Combined illustrative view":
        main_fragility = (
            "The result is sensitive to how value is counted, especially if event, admission, and bed-day effects overlap."
        )
    elif inputs["targeting_mode"] == "Broad cardiovascular risk cohort":
        main_fragility = (
            "The result may weaken if baseline recurrent event risk is too diluted in a broader cardiovascular risk population."
        )
    elif inputs["sustained_engagement_rate"] <= 0.70 or inputs["annual_participation_dropoff_rate"] >= 0.10:
        main_fragility = "The case may weaken if sustained engagement falls faster than assumed over time."
    else:
        main_fragility = robustness

    if inputs["targeting_mode"] != "Secondary prevention focus":
        best_next_step = "Test whether the intervention looks stronger when focused on a more clearly identifiable secondary prevention population."
    elif inputs["costing_method"] == "Combined illustrative view":
        best_next_step = "Stress-test the costing approach using a cleaner local method before using the result in a live decision conversation."
    elif results["discounted_cost_per_qaly"] > threshold:
        best_next_step = (
            "Validate the highest-leverage assumptions locally, especially recurrent event risk, risk reduction, and delivery cost."
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
        validate_next.append("Validate whether event, admission, and bed-day savings overlap under local costing rules.")
    else:
        validate_next.append("Validate the local cost inputs used in the economic framing.")

    if inputs["targeting_mode"] == "Broad cardiovascular risk cohort":
        validate_next.append("Check whether the intervention should be modelled more credibly as high-risk or secondary prevention rather than broad risk management.")
    else:
        validate_next.append("Confirm the real prevalence and operational identifiability of the intended high-risk or secondary prevention cohort.")

    validate_next.append("Validate the baseline recurrent cardiovascular event rate in the local population.")
    validate_next.append("Check whether the assumed admission probability per event is realistic for the event mix being proxied.")
    validate_next.append("Review whether sustained engagement and participation drop-off are plausible in real delivery conditions.")

    if results["break_even_horizon"].startswith(">"):
        validate_next.append(
            "The model does not reach threshold within the tested horizon, so baseline risk, effect size, and delivery cost should be reviewed first."
        )
    else:
        validate_next.append("Check whether the implied break-even horizon is realistic in the local planning context.")

    readiness_note = (
        "This sandbox is best treated as decision-preparation support. The next step should be to validate the highest-leverage local assumptions before any real-world use."
    )

    return {
        "validate_next": validate_next[:6],
        "readiness_note": readiness_note,
    }


def summarise_scenario_strengths(scenario_df) -> str:
    best_value = scenario_df.loc[scenario_df["Discounted cost per QALY"].idxmin()]
    best_efficiency = scenario_df.loc[scenario_df["Discounted net cost"].idxmin()]
    best_impact = scenario_df.loc[scenario_df["Events avoided"].idxmax()]

    if (
        best_value["Scenario"] == best_efficiency["Scenario"]
        and best_efficiency["Scenario"] == best_impact["Scenario"]
    ):
        return (
            f"Under the current settings, **{best_value['Scenario']}** is simultaneously strongest for value, efficiency, and avoided recurrent events."
        )

    return (
        f"Under the current settings, **{best_value['Scenario']}** looks strongest for value, "
        f"**{best_efficiency['Scenario']}** looks strongest for efficiency, and "
        f"**{best_impact['Scenario']}** looks strongest for recurrent events avoided."
    )


def generate_overview_summary(results: dict, inputs: dict, uncertainty_df) -> str:
    threshold = inputs["cost_effectiveness_threshold"]
    main_driver = get_main_driver_text(inputs)
    uncertainty_text = assess_uncertainty_robustness(uncertainty_df, threshold)

    events = f"{results['events_avoided_total']:.0f}"
    admissions = f"{results['admissions_avoided_total']:.0f}"
    bed_days = f"{results['bed_days_avoided_total']:.0f}"
    horizon = inputs["time_horizon_years"]
    targeting = inputs["targeting_mode"].lower()
    costing = inputs["costing_method"].lower()

    if results["discounted_net_cost_total"] < 0:
        return (
            f"Over {horizon} year{'s' if horizon != 1 else ''}, StableHeart suggests the intervention could avoid around "
            f"{events} recurrent acute cardiovascular events, {admissions} admissions, and {bed_days} bed days while appearing cost-saving on a discounted basis. "
            f"The current case reflects {targeting} using {costing}. The result is most strongly shaped by {main_driver}. {uncertainty_text}"
        )

    if 0 < results["discounted_cost_per_qaly"] <= threshold:
        return (
            f"Over {horizon} year{'s' if horizon != 1 else ''}, StableHeart suggests the intervention creates meaningful clinical and economic benefit, "
            f"with around {events} recurrent events avoided and {admissions} admissions avoided. It does not appear cost-saving, but it does sit within the current threshold on a discounted basis. "
            f"The current case reflects {targeting} using {costing}. The result is most strongly shaped by {main_driver}. {uncertainty_text}"
        )

    return (
        f"Over {horizon} year{'s' if horizon != 1 else ''}, StableHeart suggests the intervention creates measurable benefit, "
        f"with around {events} recurrent events avoided and {admissions} admissions avoided, but the discounted economic case remains above the current threshold. "
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
            f"StableHeart suggests the intervention generates measurable benefit and a discounted net saving over {horizon} year"
            f"{'s' if horizon != 1 else ''}. The current case is promising, but still depends on assumptions that remain partly illustrative."
        )
    elif 0 < results["discounted_cost_per_qaly"] <= threshold:
        what_model_suggests = (
            f"StableHeart suggests the intervention delivers measurable benefit and appears cost-effective over {horizon} year"
            f"{'s' if horizon != 1 else ''}, although it does not appear cost-saving. The result looks promising, but still assumption-dependent."
        )
    else:
        what_model_suggests = (
            f"StableHeart suggests the intervention delivers measurable benefit over {horizon} year"
            f"{'s' if horizon != 1 else ''}, but the discounted economic case remains above the current threshold."
        )

    what_drives_result = (
        f"The current result depends most strongly on {dependency}, as well as the baseline recurrent event rate, the quality of targeting, "
        f"and whether meaningful engagement and effect persist over time."
    )

    where_value_is_coming_from = (
        "The core value mechanism in StableHeart is avoided recurrent acute cardiovascular events. "
        "Those avoided events drive admissions avoided, bed days avoided, QALYs gained, and the largest share of economic benefit."
    )

    if inputs["costing_method"] == "Combined illustrative view":
        what_looks_fragile = (
            "The economic signal may be fragile because the combined costing approach is intentionally illustrative and may overstate value if local cost components overlap."
        )
    elif inputs["targeting_mode"] == "Broad cardiovascular risk cohort":
        what_looks_fragile = (
            "The case may be fragile because a broad cardiovascular risk cohort can dilute recurrent event risk, making it harder for avoided events to offset programme costs."
        )
    else:
        what_looks_fragile = uncertainty_text

    what_to_validate_next = (
        f"Before using this in a real decision conversation, the most important next checks are: {readiness['validate_next'][0]} "
        f"Then check whether the intervention would still look worthwhile over around {break_even_horizon} under locally credible assumptions."
    )

    limitations = (
        "This sandbox uses a simplified composite cardiovascular event proxy and does not distinguish MI, stroke, heart failure, or other event types. "
        "It does not model disease progression, mortality, patient-level heterogeneity, or richer uncertainty and therefore remains a structured exploratory tool rather than a formal appraisal model."
    )

    return {
        "what_model_suggests": what_model_suggests,
        "what_drives_result": what_drives_result,
        "where_value_is_coming_from": where_value_is_coming_from,
        "what_looks_fragile": what_looks_fragile,
        "what_to_validate_next": what_to_validate_next,
        "limitations": limitations,
    }