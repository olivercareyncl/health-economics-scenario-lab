TARGETING_MODE_OPTIONS = [
    "Broad population",
    "Higher-risk targeting",
    "Tighter high-risk targeting",
]

COSTING_METHOD_OPTIONS = [
    "Treatment cost difference only",
    "Emergency/admission savings only",
    "Combined illustrative view",
]

COMPARATOR_OPTIONS = [
    "Higher-risk targeting",
    "Tighter high-risk targeting",
    "Modest shift",
    "Stronger shift",
    "Lower-cost delivery",
    "Targeted and stronger shift",
]

TARGETING_MODE_MAP = {
    "Broad population": {
        "population_multiplier": 1.0,
        "late_rate_multiplier": 1.0,
        "reach_multiplier": 1.0,
        "shift_multiplier": 1.0,
    },
    "Higher-risk targeting": {
        "population_multiplier": 0.70,
        "late_rate_multiplier": 1.25,
        "reach_multiplier": 1.05,
        "shift_multiplier": 1.10,
    },
    "Tighter high-risk targeting": {
        "population_multiplier": 0.45,
        "late_rate_multiplier": 1.50,
        "reach_multiplier": 1.10,
        "shift_multiplier": 1.20,
    },
}

COSTING_METHOD_MAP = {
    "Treatment cost difference only": {"mode": "treatment"},
    "Emergency/admission savings only": {"mode": "acute"},
    "Combined illustrative view": {"mode": "combined"},
}


def get_base_case(defaults: dict) -> dict:
    return defaults.copy()


def get_modest_shift(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["achievable_reduction_in_late_diagnosis"] = max(
        0.0,
        defaults["achievable_reduction_in_late_diagnosis"] * 0.7,
    )
    return scenario


def get_stronger_shift(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["achievable_reduction_in_late_diagnosis"] = min(
        0.5,
        defaults["achievable_reduction_in_late_diagnosis"] * 1.3,
    )
    return scenario


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
    scenario["intervention_cost_per_case_reached"] = (
        defaults["intervention_cost_per_case_reached"] * 0.8
    )
    return scenario


def get_targeted_and_stronger(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Higher-risk targeting"
    scenario["achievable_reduction_in_late_diagnosis"] = min(
        0.5,
        defaults["achievable_reduction_in_late_diagnosis"] * 1.2,
    )
    return scenario


SCENARIO_MAP = {
    "Base case": get_base_case,
    "Modest shift": get_modest_shift,
    "Stronger shift": get_stronger_shift,
    "Higher-risk targeting": get_higher_risk_targeting,
    "Tighter high-risk targeting": get_tighter_high_risk_targeting,
    "Lower-cost delivery": get_lower_cost_delivery,
    "Targeted and stronger shift": get_targeted_and_stronger,
}