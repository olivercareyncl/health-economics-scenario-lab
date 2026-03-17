def get_decision_status(results: dict, threshold: float) -> str:
    if results["net_cost"] < 0:
        return "Appears cost-saving"
    if results["cost_per_qaly"] > 0 and results["cost_per_qaly"] <= threshold:
        return "Appears cost-effective, but not cost-saving"
    return "Appears unlikely to be cost-effective under current assumptions"


def generate_overview_summary(results: dict) -> str:
    if results["net_cost"] < 0:
        return (
            f"Under the current assumptions, SafeStep suggests the programme avoids "
            f"around {results['falls_avoided']:.0f} falls and {results['admissions_avoided']:.0f} admissions, "
            f"while appearing cost-saving overall."
        )

    return (
        f"Under the current assumptions, SafeStep suggests the programme avoids "
        f"around {results['falls_avoided']:.0f} falls and {results['admissions_avoided']:.0f} admissions, "
        f"but does not appear cost-saving over the selected time horizon."
    )


def generate_interpretation(results: dict, inputs: dict, threshold: float) -> dict:
    decision_status = get_decision_status(results, threshold)

    what_model_suggests = (
        f"SafeStep suggests that the programme generates measurable health benefit, "
        f"with an estimated {results['falls_avoided']:.0f} falls avoided and "
        f"{results['admissions_avoided']:.0f} admissions avoided. "
        f"Overall, it {decision_status.lower()}."
    )

    what_drives_result = (
        "The result is mainly driven by intervention effectiveness, cost per participant, "
        "annual fall risk, and the proportion of falls leading to admission."
    )

    what_improves_case = (
        "The programme becomes more economically attractive if delivery costs fall, "
        "effectiveness improves, or the intervention is targeted at a higher-risk population."
    )

    limitations = (
        "This sandbox does not capture wider social care effects, fear of falling, "
        "carer burden, implementation constraints, or longer-term quality-of-life gains."
    )

    return {
        "what_model_suggests": what_model_suggests,
        "what_drives_result": what_drives_result,
        "what_improves_case": what_improves_case,
        "limitations": limitations,
    }
