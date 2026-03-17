TARGETING_MODE_OPTIONS = [
    "Broad frailty cohort",
    "Higher-risk targeting",
    "Frequent-admitter targeting",
]

COSTING_METHOD_OPTIONS = [
    "Admission and crisis savings only",
    "Bed-day value only",
    "Combined illustrative view",
]

COMPARATOR_OPTIONS = [
    "Crisis prevention focus",
    "Admission reduction focus",
    "Frequent-admitter targeting",
    "Lower-cost support model",
    "Targeted and stronger support",
]

TARGETING_MODE_MAP = {
    "Broad frailty cohort": {
        "population_multiplier": 1.0,
        "reach_multiplier": 1.0,
        "risk_multiplier": 1.0,
    },
    "Higher-risk targeting": {
        "population_multiplier": 0.65,
        "reach_multiplier": 1.05,
        "risk_multiplier": 1.30,
    },
    "Frequent-admitter targeting": {
        "population_multiplier": 0.40,
        "reach_multiplier": 1.10,
        "risk_multiplier": 1.55,
    },
}

COSTING_METHOD_MAP = {
    "Admission and crisis savings only": {"mode": "admission_crisis"},
    "Bed-day value only": {"mode": "bed_day"},
    "Combined illustrative view": {"mode": "combined"},
}


def get_base_case(defaults: dict) -> dict:
    return defaults.copy()


def get_crisis_prevention_focus(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["reduction_in_crisis_event_rate"] = defaults["reduction_in_crisis_event_rate"] * 1.4
    scenario["reduction_in_admission_rate"] = defaults["reduction_in_admission_rate"] * 0.9
    scenario["reduction_in_length_of_stay"] = defaults["reduction_in_length_of_stay"] * 0.9
    return scenario


def get_admission_reduction_focus(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["reduction_in_admission_rate"] = defaults["reduction_in_admission_rate"] * 1.4
    scenario["reduction_in_crisis_event_rate"] = defaults["reduction_in_crisis_event_rate"] * 0.9
    scenario["reduction_in_length_of_stay"] = defaults["reduction_in_length_of_stay"] * 1.05
    return scenario


def get_frequent_admitter_targeting(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Frequent-admitter targeting"
    return scenario


def get_lower_cost_support_model(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["support_cost_per_patient"] = defaults["support_cost_per_patient"] * 0.8
    return scenario


def get_targeted_and_stronger_support(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Higher-risk targeting"
    scenario["reduction_in_crisis_event_rate"] = defaults["reduction_in_crisis_event_rate"] * 1.15
    scenario["reduction_in_admission_rate"] = defaults["reduction_in_admission_rate"] * 1.15
    scenario["reduction_in_length_of_stay"] = defaults["reduction_in_length_of_stay"] * 1.15
    scenario["implementation_reach_rate"] = min(defaults["implementation_reach_rate"] * 1.05, 1.0)
    return scenario


SCENARIO_MAP = {
    "Base case": get_base_case,
    "Crisis prevention focus": get_crisis_prevention_focus,
    "Admission reduction focus": get_admission_reduction_focus,
    "Frequent-admitter targeting": get_frequent_admitter_targeting,
    "Lower-cost support model": get_lower_cost_support_model,
    "Targeted and stronger support": get_targeted_and_stronger_support,
}
