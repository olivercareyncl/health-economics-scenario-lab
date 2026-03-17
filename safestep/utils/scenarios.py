def get_base_case(defaults: dict) -> dict:
    return defaults.copy()


def get_conservative_delivery(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["uptake_rate"] = 0.40
    scenario["adherence_rate"] = 0.70
    scenario["relative_risk_reduction"] = 0.10
    scenario["intervention_cost_per_person"] = 300
    return scenario


def get_broader_reach(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["uptake_rate"] = 0.70
    scenario["adherence_rate"] = 0.80
    return scenario


def get_higher_risk_targeting(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["eligible_population"] = 2500
    scenario["annual_fall_risk"] = 0.45
    scenario["relative_risk_reduction"] = 0.20
    return scenario


def get_stronger_effect(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["relative_risk_reduction"] = 0.30
    return scenario


SCENARIO_MAP = {
    "Base case": get_base_case,
    "Conservative delivery": get_conservative_delivery,
    "Broader reach": get_broader_reach,
    "Higher-risk targeting": get_higher_risk_targeting,
    "Stronger effect": get_stronger_effect,
}
