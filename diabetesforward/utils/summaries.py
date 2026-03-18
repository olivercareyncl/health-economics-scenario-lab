def get_decision_status(results: dict, threshold: float) -> str:
    discounted_net_cost = results.get("discounted_net_cost_total", 0.0)
    discounted_qalys = results.get("discounted_qalys_total", 0.0)
    discounted_cost_per_qaly = results.get("discounted_cost_per_qaly", 0.0)

    if discounted_net_cost <= 0:
        return "Appears cost-saving"
    if discounted_qalys > 0 and discounted_cost_per_qaly <= threshold:
        return "Appears cost-effective"
    return "Above current threshold"


def get_net_cost_label(results: dict) -> str:
    if results.get("discounted_net_cost_total", 0.0) <= 0:
        return "Discounted net saving"
    return "Discounted net cost"


def get_main_driver_text(inputs: dict) -> str:
    costing_method = inputs.get("costing_method", "")
    targeting_mode = inputs.get("targeting_mode", "")

    if targeting_mode == "Complication-risk focus":
        targeting_text = "high baseline complication risk in a concentrated cohort"
    elif targeting_mode == "Poorly controlled diabetes targeting":
        targeting_text = "elevated deterioration risk in a more targeted diabetes cohort"
    else:
        targeting_text = "scale and reach across a broader at-risk population"

    if costing_method == "Complication and admission savings only":
        savings_text = "avoided complications and admissions"
    elif costing_method == "Bed-day value only":
        savings_text = "avoided bed-day value"
    else:
        savings_text = "a combined illustrative view of avoided complications, admissions, and bed days"

    return f"The main economic driver is {targeting_text}, translated into {savings_text}."


def assess_uncertainty_robustness(uncertainty_df, threshold: float) -> str:
    statuses = uncertainty_df["decision_status"].tolist()

    if all(status == "Appears cost-saving" for status in statuses):
        return "The result looks robust across the bounded uncertainty range and remains cost-saving in all cases."
    if all(status in ["Appears cost-saving", "Appears cost-effective"] for status in statuses):
        return "The result remains on the favourable side of the threshold across the bounded uncertainty range."
    if any(status in ["Appears cost-saving", "Appears cost-effective"] for status in statuses):
        return "The result is directionally promising, but bounded uncertainty shows that the conclusion is still fragile."
    return "The result does not remain favourable across the bounded uncertainty range."


def generate_overview_summary(results: dict, inputs: dict, uncertainty_df) -> str:
    threshold = float(inputs.get("cost_effectiveness_threshold", 20000.0))

    decision_status = get_decision_status(results, threshold)
    complications = results["complications_avoided_total"]
    admissions = results["admissions_avoided_total"]
    bed_days = results["bed_days_avoided_total"]
    net_cost = results["discounted_net_cost_total"]
    cpy = results["discounted_cost_per_qaly"]

    base_text = (
        f"Under the current assumptions, the intervention is estimated to avoid about "
        f"{complications:,.0f} complications, {admissions:,.0f} admissions, and {bed_days:,.0f} bed days "
        f"over the selected horizon."
    )

    if decision_status == "Appears cost-saving":
        value_text = f"On this basis, the model suggests a discounted net saving of £{abs(net_cost):,.0f}."
    elif decision_status == "Appears cost-effective":
        value_text = (
            f"On this basis, the model suggests a discounted cost per QALY of about £{cpy:,.0f}, "
            f"which is below the selected threshold."
        )
    else:
        value_text = (
            f"On this basis, the model suggests a discounted cost per QALY of about £{cpy:,.0f}, "
            f"which remains above the selected threshold."
        )

    uncertainty_text = assess_uncertainty_robustness(uncertainty_df, threshold)
    return f"{base_text} {value_text} {uncertainty_text}"


def generate_overall_signal(results: dict, inputs: dict, uncertainty_df) -> str:
    threshold = float(inputs.get("cost_effectiveness_threshold", 20000.0))
    decision_status = get_decision_status(results, threshold)
    robustness = assess_uncertainty_robustness(uncertainty_df, threshold)

    if decision_status == "Appears cost-saving":
        return f"The current configuration looks economically strong. {robustness}"
    if decision_status == "Appears cost-effective":
        return f"The current configuration looks potentially viable, but the value case still depends on assumptions holding. {robustness}"
    return f"The current configuration does not yet show a strong value case. {robustness}"


def generate_structured_recommendation(inputs: dict, results: dict, uncertainty_df) -> dict:
    threshold = float(inputs.get("cost_effectiveness_threshold", 20000.0))
    decision_status = get_decision_status(results, threshold)

    if inputs.get("targeting_mode") == "Complication-risk focus":
        main_dependency = "The case depends heavily on working in a population with genuinely high baseline complication risk."
    elif inputs.get("targeting_mode") == "Poorly controlled diabetes targeting":
        main_dependency = "The case depends on targeting poorly controlled patients where risk and avoidable deterioration are concentrated."
    else:
        main_dependency = "The case depends on achieving enough aggregate impact across a broader lower-risk population."

    if inputs.get("intervention_cost_per_patient_reached", 0) > results.get("break_even_cost_per_patient", 0):
        main_fragility = "Delivery cost is currently above the implied break-even level, so the result is fragile to implementation cost."
    elif inputs.get("sustained_engagement_rate", 0) < 0.7:
        main_fragility = "The result is fragile to whether engagement and persistence are high enough to maintain effect."
    else:
        main_fragility = "The result is most fragile to whether estimated risk reduction is achievable in routine practice."

    if decision_status == "Appears cost-saving":
        best_next_step = "Validate baseline complication rates, achievable reach, and whether savings overlap under local costing rules."
    elif decision_status == "Appears cost-effective":
        best_next_step = "Stress-test the effect size and delivery cost assumptions against local operational evidence before escalation."
    else:
        best_next_step = "Refine targeting, reduce delivery cost, or test a stronger-risk-reduction scenario before progressing."

    return {
        "main_dependency": main_dependency,
        "main_fragility": main_fragility,
        "best_next_step": best_next_step,
    }


def generate_decision_readiness(inputs: dict, results: dict, uncertainty_df) -> dict:
    threshold = float(inputs.get("cost_effectiveness_threshold", 20000.0))

    checks = [
        "Validate the true size of the eligible cohort and how many patients can realistically be reached.",
        "Check whether the baseline complication rate is grounded in local operational or audit data.",
        "Test whether the assumed level of sustained engagement is plausible in routine delivery.",
        "Confirm whether local costing already embeds any overlap between complication, admission, and bed-day value.",
    ]

    if get_decision_status(results, threshold) == "Above current threshold":
        checks.insert(
            0,
            "Clarify whether a narrower higher-risk subgroup would produce a more credible value case.",
        )

    readiness_note = assess_uncertainty_robustness(uncertainty_df, threshold)

    return {
        "validate_next": checks[:5],
        "readiness_note": readiness_note,
    }


def generate_interpretation(results: dict, inputs: dict, uncertainty_df) -> dict:
    threshold = float(inputs.get("cost_effectiveness_threshold", 20000.0))
    decision_status = get_decision_status(results, threshold)
    net_cost_label = get_net_cost_label(results)

    what_model_suggests = generate_overview_summary(results, inputs, uncertainty_df)

    what_drives_result = (
        f"The result is driven by the interaction between baseline complication risk, intervention reach, sustained engagement, "
        f"and the assumed relative reduction in complications. In economic terms, the case strengthens when higher-risk patients are "
        f"reached at a delivery cost below roughly £{results['break_even_cost_per_patient']:,.0f} per patient."
    )

    where_value_is_coming_from = (
        f"Value is mainly coming from avoided complications, fewer admissions, and reduced bed use under the selected costing method. "
        f"The model currently reports a {net_cost_label.lower()} of £{abs(results['discounted_net_cost_total']):,.0f} over the selected horizon."
    )

    if decision_status == "Appears cost-saving":
        what_looks_fragile = (
            "Even where the model appears cost-saving, the conclusion can still weaken if baseline risk is overstated, "
            "engagement falls away, or savings overlap in local costing rules."
        )
    else:
        what_looks_fragile = (
            "The current result looks fragile to changes in complication risk reduction, delivery cost, engagement, and baseline risk."
        )

    what_to_validate_next = (
        "The next validation step should focus on local complication rates, realistic reach and persistence, and whether the selected "
        "costing method reflects genuine avoidable system cost rather than illustrative value only."
    )

    limitations = (
        "This sandbox uses a simplified composite complication proxy and does not model long-term disease progression, specific complication "
        "types, patient heterogeneity, treatment switching, or formal probabilistic uncertainty."
    )

    return {
        "what_model_suggests": what_model_suggests,
        "what_drives_result": what_drives_result,
        "where_value_is_coming_from": where_value_is_coming_from,
        "what_looks_fragile": what_looks_fragile,
        "what_to_validate_next": what_to_validate_next,
        "limitations": limitations,
    }


def summarise_scenario_strengths(scenario_df) -> str:
    if scenario_df.empty:
        return "No scenario comparison is available."

    best_value_idx = scenario_df["Discounted cost per QALY"].replace(0, float("inf")).idxmin()
    best_efficiency_idx = scenario_df["Discounted net cost"].idxmin()
    best_impact_idx = scenario_df["Complications avoided"].idxmax()

    best_value = scenario_df.loc[best_value_idx, "Scenario"]
    best_efficiency = scenario_df.loc[best_efficiency_idx, "Scenario"]
    best_impact = scenario_df.loc[best_impact_idx, "Scenario"]

    return (
        f"In this scenario set, {best_value} performs best on cost-effectiveness, "
        f"{best_efficiency} performs best on discounted net cost, and "
        f"{best_impact} delivers the largest reduction in complications."
    )