TARGETING_MODE_OPTIONS = [
    "Broad population",
    "Higher-risk targeting",
    "Tighter high-risk targeting",
]

COSTING_METHOD_OPTIONS = [
    "Admission cost only",
    "Bed-day value only",
    "Combined illustrative view",
]

TARGETING_MODE_MAP = {
    "Broad population": {
        "population_multiplier": 1.0,
        "risk_multiplier": 1.0,
        "uptake_multiplier": 1.0,
    },
    "Higher-risk targeting": {
        "population_multiplier": 0.60,
        "risk_multiplier": 1.40,
        "uptake_multiplier": 1.05,
    },
    "Tighter high-risk targeting": {
        "population_multiplier": 0.35,
        "risk_multiplier": 1.80,
        "uptake_multiplier": 1.10,
    },
}

COSTING_METHOD_MAP = {
    "Admission cost only": {"mode": "admission"},
    "Bed-day value only": {"mode": "bed_day"},
    "Combined illustrative view": {"mode": "combined"},
}


def get_base_case(defaults: dict) -> dict:
    return defaults.copy()


def get_higher_risk_targeting(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Higher-risk targeting"
    return scenario


def get_tighter_high_risk_targeting(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Tighter high-risk targeting"
    return scenario


def get_lower_cost_delivery(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["intervention_cost_per_person"] = defaults["intervention_cost_per_person"] * 0.8
    return scenario


def get_stronger_effect(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["relative_risk_reduction"] = min(1.0, defaults["relative_risk_reduction"] * 1.25)
    return scenario


def get_targeted_and_stronger(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Higher-risk targeting"
    scenario["relative_risk_reduction"] = min(1.0, defaults["relative_risk_reduction"] * 1.15)
    return scenario


SCENARIO_MAP = {
    "Base case": get_base_case,
    "Higher-risk targeting": get_higher_risk_targeting,
    "Tighter high-risk targeting": get_tighter_high_risk_targeting,
    "Lower-cost delivery": get_lower_cost_delivery,
    "Stronger effect": get_stronger_effect,
    "Targeted and stronger effect": get_targeted_and_stronger,
}