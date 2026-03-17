TARGETING_MODE_OPTIONS = [
    "Secondary prevention focus",
    "High-risk targeting",
    "Broad cardiovascular risk cohort",
]

COSTING_METHOD_OPTIONS = [
    "Event and admission savings only",
    "Bed-day value only",
    "Combined illustrative view",
]

COMPARATOR_OPTIONS = [
    "Lower-cost delivery",
    "Stronger risk reduction",
    "High-risk targeting",
    "Secondary prevention focus",
    "Targeted high-impact intervention",
]

TARGETING_MODE_MAP = {
    "Broad cardiovascular risk cohort": {
        "population_multiplier": 1.0,
        "reach_multiplier": 1.0,
        "risk_multiplier": 0.75,
    },
    "High-risk targeting": {
        "population_multiplier": 0.70,
        "reach_multiplier": 1.05,
        "risk_multiplier": 1.15,
    },
    "Secondary prevention focus": {
        "population_multiplier": 0.55,
        "reach_multiplier": 1.10,
        "risk_multiplier": 1.35,
    },
}

COSTING_METHOD_MAP = {
    "Event and admission savings only": {"mode": "event_admission"},
    "Bed-day value only": {"mode": "bed_day"},
    "Combined illustrative view": {"mode": "combined"},
}


def get_base_case(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Secondary prevention focus"
    return scenario


def get_lower_cost_delivery(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["intervention_cost_per_patient_reached"] = defaults["intervention_cost_per_patient_reached"] * 0.8
    scenario["targeting_mode"] = "Secondary prevention focus"
    return scenario


def get_stronger_risk_reduction(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["risk_reduction_in_recurrent_events"] = defaults["risk_reduction_in_recurrent_events"] * 1.3
    scenario["targeting_mode"] = "Secondary prevention focus"
    return scenario


def get_high_risk_targeting(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "High-risk targeting"
    return scenario


def get_secondary_prevention_focus(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Secondary prevention focus"
    return scenario


def get_targeted_high_impact_intervention(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Secondary prevention focus"
    scenario["risk_reduction_in_recurrent_events"] = defaults["risk_reduction_in_recurrent_events"] * 1.2
    scenario["sustained_engagement_rate"] = min(defaults["sustained_engagement_rate"] * 1.08, 1.0)
    scenario["intervention_reach_rate"] = min(defaults["intervention_reach_rate"] * 1.05, 1.0)
    return scenario


SCENARIO_MAP = {
    "Base case": get_base_case,
    "Lower-cost delivery": get_lower_cost_delivery,
    "Stronger risk reduction": get_stronger_risk_reduction,
    "High-risk targeting": get_high_risk_targeting,
    "Secondary prevention focus": get_secondary_prevention_focus,
    "Targeted high-impact intervention": get_targeted_high_impact_intervention,
}