TARGETING_MODE_OPTIONS = [
    "Broad waiting list",
    "Higher-risk targeting",
    "Long-wait targeting",
]

COSTING_METHOD_OPTIONS = [
    "Escalation and admission savings only",
    "Bed-day value only",
    "Combined illustrative view",
]

COMPARATOR_OPTIONS = [
    "Demand reduction focus",
    "Throughput boost",
    "Long-wait targeting",
    "Lower-cost delivery",
    "Targeted and stronger effect",
]

TARGETING_MODE_MAP = {
    "Broad waiting list": {
        "population_multiplier": 1.0,
        "reach_multiplier": 1.0,
        "risk_multiplier": 1.0,
    },
    "Higher-risk targeting": {
        "population_multiplier": 0.60,
        "reach_multiplier": 1.05,
        "risk_multiplier": 1.30,
    },
    "Long-wait targeting": {
        "population_multiplier": 0.45,
        "reach_multiplier": 1.10,
        "risk_multiplier": 1.45,
    },
}

COSTING_METHOD_MAP = {
    "Escalation and admission savings only": {"mode": "acute"},
    "Bed-day value only": {"mode": "bed_day"},
    "Combined illustrative view": {"mode": "combined"},
}


def get_base_case(defaults: dict) -> dict:
    return defaults.copy()


def get_demand_reduction_focus(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["demand_reduction_effect"] = defaults["demand_reduction_effect"] * 1.4
    scenario["throughput_increase_effect"] = defaults["throughput_increase_effect"] * 0.7
    return scenario


def get_throughput_boost(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["throughput_increase_effect"] = defaults["throughput_increase_effect"] * 1.4
    scenario["demand_reduction_effect"] = defaults["demand_reduction_effect"] * 0.7
    return scenario


def get_long_wait_targeting(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Long-wait targeting"
    return scenario


def get_lower_cost_delivery(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["intervention_cost_per_patient_reached"] = defaults["intervention_cost_per_patient_reached"] * 0.8
    return scenario


def get_targeted_and_stronger(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Higher-risk targeting"
    scenario["demand_reduction_effect"] = defaults["demand_reduction_effect"] * 1.15
    scenario["throughput_increase_effect"] = defaults["throughput_increase_effect"] * 1.15
    scenario["escalation_reduction_effect"] = defaults["escalation_reduction_effect"] * 1.15
    return scenario


SCENARIO_MAP = {
    "Base case": get_base_case,
    "Demand reduction focus": get_demand_reduction_focus,
    "Throughput boost": get_throughput_boost,
    "Long-wait targeting": get_long_wait_targeting,
    "Lower-cost delivery": get_lower_cost_delivery,
    "Targeted and stronger effect": get_targeted_and_stronger,
}
