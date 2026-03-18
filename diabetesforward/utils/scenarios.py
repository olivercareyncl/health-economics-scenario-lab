TARGETING_MODE_OPTIONS = [
    "Broad at-risk population",
    "Poorly controlled diabetes targeting",
    "Complication-risk focus",
]

COSTING_METHOD_OPTIONS = [
    "Complication and admission savings only",
    "Bed-day value only",
    "Combined illustrative view",
]

COMPARATOR_OPTIONS = [
    "Poorly controlled diabetes targeting",
    "Complication-risk focus",
    "Lower-cost delivery",
    "Stronger risk reduction",
    "Targeted and stronger effect",
]


def _base_case(defaults: dict) -> dict:
    return {
        "targeting_mode": "Complication-risk focus",
        "eligible_population": defaults["eligible_population"],
        "baseline_complication_rate": defaults["baseline_complication_rate"],
        "intervention_reach_rate": defaults["intervention_reach_rate"],
        "sustained_engagement_rate": defaults["sustained_engagement_rate"],
        "complication_risk_reduction": defaults["complication_risk_reduction"],
        "intervention_cost_per_patient_reached": defaults["intervention_cost_per_patient_reached"],
    }


def _lower_cost_delivery(defaults: dict) -> dict:
    return {
        "targeting_mode": "Complication-risk focus",
        "intervention_cost_per_patient_reached": defaults["intervention_cost_per_patient_reached"] * 0.8,
        "intervention_reach_rate": min(defaults["intervention_reach_rate"] * 1.05, 1.0),
    }


def _stronger_risk_reduction(defaults: dict) -> dict:
    return {
        "targeting_mode": "Complication-risk focus",
        "complication_risk_reduction": min(defaults["complication_risk_reduction"] * 1.25, 0.95),
        "sustained_engagement_rate": min(defaults["sustained_engagement_rate"] * 1.05, 1.0),
    }


def _poorly_controlled_targeting(defaults: dict) -> dict:
    return {
        "targeting_mode": "Poorly controlled diabetes targeting",
        "eligible_population": defaults["eligible_population"] * 0.95,
        "baseline_complication_rate": min(defaults["baseline_complication_rate"] * 1.15, 1.0),
        "complication_risk_reduction": min(defaults["complication_risk_reduction"] * 1.05, 0.95),
    }


def _complication_risk_focus(defaults: dict) -> dict:
    return {
        "targeting_mode": "Complication-risk focus",
        "eligible_population": defaults["eligible_population"] * 0.8,
        "baseline_complication_rate": min(defaults["baseline_complication_rate"] * 1.3, 1.0),
        "complication_risk_reduction": min(defaults["complication_risk_reduction"] * 1.1, 0.95),
        "sustained_engagement_rate": min(defaults["sustained_engagement_rate"] * 1.05, 1.0),
    }


def _targeted_high_impact(defaults: dict) -> dict:
    return {
        "targeting_mode": "Complication-risk focus",
        "eligible_population": defaults["eligible_population"] * 0.75,
        "baseline_complication_rate": min(defaults["baseline_complication_rate"] * 1.35, 1.0),
        "intervention_reach_rate": min(defaults["intervention_reach_rate"] * 0.95, 1.0),
        "sustained_engagement_rate": min(defaults["sustained_engagement_rate"] * 1.1, 1.0),
        "complication_risk_reduction": min(defaults["complication_risk_reduction"] * 1.3, 0.95),
        "intervention_cost_per_patient_reached": defaults["intervention_cost_per_patient_reached"] * 1.05,
    }


SCENARIO_MAP = {
    "Base case": _base_case,
    "Lower-cost delivery": _lower_cost_delivery,
    "Stronger risk reduction": _stronger_risk_reduction,
    "Poorly controlled diabetes targeting": _poorly_controlled_targeting,
    "Complication-risk focus": _complication_risk_focus,
    "Targeted high-impact intervention": _targeted_high_impact,
}