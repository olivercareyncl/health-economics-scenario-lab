TARGETING_MODE_OPTIONS = [
    "Broad pathway redesign",
    "Higher-risk targeting",
    "High-utiliser targeting",
]

COSTING_METHOD_OPTIONS = [
    "Admission and follow-up savings only",
    "Bed-day value only",
    "Combined illustrative view",
]

COMPARATOR_OPTIONS = [
    "Follow-up reduction focus",
    "Admission reduction focus",
    "High-utiliser targeting",
    "Lower-cost redesign",
    "Targeted and stronger redesign",
]

TARGETING_MODE_MAP = {
    "Broad pathway redesign": {
        "population_multiplier": 1.0,
        "reach_multiplier": 1.0,
        "risk_multiplier": 1.0,
    },
    "Higher-risk targeting": {
        "population_multiplier": 0.65,
        "reach_multiplier": 1.05,
        "risk_multiplier": 1.30,
    },
    "High-utiliser targeting": {
        "population_multiplier": 0.40,
        "reach_multiplier": 1.10,
        "risk_multiplier": 1.50,
    },
}

COSTING_METHOD_MAP = {
    "Admission and follow-up savings only": {"mode": "admission_followup"},
    "Bed-day value only": {"mode": "bed_day"},
    "Combined illustrative view": {"mode": "combined"},
}


def get_base_case(defaults: dict) -> dict:
    return defaults.copy()


def get_follow_up_reduction_focus(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["reduction_in_follow_up_contacts"] = defaults["reduction_in_follow_up_contacts"] * 1.4
    scenario["reduction_in_admission_rate"] = defaults["reduction_in_admission_rate"] * 0.8
    return scenario


def get_admission_reduction_focus(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["reduction_in_admission_rate"] = defaults["reduction_in_admission_rate"] * 1.4
    scenario["reduction_in_follow_up_contacts"] = defaults["reduction_in_follow_up_contacts"] * 0.8
    return scenario


def get_high_utiliser_targeting(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "High-utiliser targeting"
    return scenario


def get_lower_cost_redesign(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["redesign_cost_per_patient"] = defaults["redesign_cost_per_patient"] * 0.8
    return scenario


def get_targeted_and_stronger_redesign(defaults: dict) -> dict:
    scenario = defaults.copy()
    scenario["targeting_mode"] = "Higher-risk targeting"
    scenario["proportion_shifted_to_lower_cost_setting"] = defaults["proportion_shifted_to_lower_cost_setting"] * 1.15
    scenario["reduction_in_admission_rate"] = defaults["reduction_in_admission_rate"] * 1.15
    scenario["reduction_in_follow_up_contacts"] = defaults["reduction_in_follow_up_contacts"] * 1.15
    scenario["reduction_in_length_of_stay"] = defaults["reduction_in_length_of_stay"] * 1.15
    return scenario


SCENARIO_MAP = {
    "Base case": get_base_case,
    "Follow-up reduction focus": get_follow_up_reduction_focus,
    "Admission reduction focus": get_admission_reduction_focus,
    "High-utiliser targeting": get_high_utiliser_targeting,
    "Lower-cost redesign": get_lower_cost_redesign,
    "Targeted and stronger redesign": get_targeted_and_stronger_redesign,
}
