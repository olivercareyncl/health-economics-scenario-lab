from utils.formatters import format_currency, format_number, format_percent


ASSUMPTION_META = {
    "eligible_population": {
        "label": "Eligible population",
        "unit": "patients",
        "formatter": format_number,
        "description": "Estimated high-risk or secondary prevention population in scope.",
        "source_type": "Operational estimate",
        "confidence_level": "Medium",
    },
    "baseline_recurrent_event_rate": {
        "label": "Baseline recurrent cardiovascular event rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated annual rate of recurrent acute cardiovascular events in the target population.",
        "source_type": "Evidence-informed proxy",
        "confidence_level": "Medium",
    },
    "admission_probability_per_event": {
        "label": "Admission probability per event",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated share of recurrent cardiovascular events that result in admission.",
        "source_type": "Evidence-informed proxy",
        "confidence_level": "Medium",
    },
    "average_length_of_stay": {
        "label": "Average length of stay",
        "unit": "days",
        "formatter": lambda x: f"{x:,.1f}",
        "description": "Estimated average inpatient stay for admitted events.",
        "source_type": "Operational estimate",
        "confidence_level": "Medium",
    },
    "intervention_reach_rate": {
        "label": "Intervention reach",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated share of the eligible population reached by the intervention.",
        "source_type": "Operational estimate",
        "confidence_level": "Medium",
    },
    "sustained_engagement_rate": {
        "label": "Sustained engagement / adherence",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated proportion of reached patients who sustain meaningful engagement or adherence.",
        "source_type": "Evidence-informed proxy",
        "confidence_level": "Low",
    },
    "annual_participation_dropoff_rate": {
        "label": "Annual participation drop-off",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated annual decline in active participation over time.",
        "source_type": "Illustrative default",
        "confidence_level": "Low",
    },
    "risk_reduction_in_recurrent_events": {
        "label": "Risk reduction in recurrent events",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated reduction in recurrent acute cardiovascular events under proactive management.",
        "source_type": "Evidence-informed proxy",
        "confidence_level": "Low",
    },
    "annual_effect_decay_rate": {
        "label": "Annual effect decay",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated annual weakening of intervention effect over time.",
        "source_type": "Illustrative default",
        "confidence_level": "Low",
    },
    "intervention_cost_per_patient_reached": {
        "label": "Intervention cost per patient reached",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Estimated cost of proactive management per patient reached.",
        "source_type": "Operational estimate",
        "confidence_level": "Medium",
    },
    "cost_per_cardiovascular_event": {
        "label": "Cost per cardiovascular event",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Estimated cost associated with a recurrent acute cardiovascular event.",
        "source_type": "Evidence-informed proxy",
        "confidence_level": "Medium",
    },
    "cost_per_admission": {
        "label": "Cost per admission",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Estimated cost per admission triggered by an acute event.",
        "source_type": "Operational estimate",
        "confidence_level": "Medium",
    },
    "cost_per_bed_day": {
        "label": "Cost per bed day",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Illustrative bed-day value for exploratory costing.",
        "source_type": "Illustrative default",
        "confidence_level": "Low",
    },
    "costing_method": {
        "label": "Costing method",
        "unit": "",
        "formatter": lambda x: x,
        "description": "Method used to value the economic effect of avoided recurrent events.",
        "source_type": "User override",
        "confidence_level": "Medium",
    },
    "qaly_gain_per_event_avoided": {
        "label": "QALY gain per event avoided",
        "unit": "QALYs",
        "formatter": lambda x: f"{x:.2f}",
        "description": "Estimated QALY gain associated with avoiding a recurrent acute cardiovascular event.",
        "source_type": "Evidence-informed proxy",
        "confidence_level": "Low",
    },
    "targeting_mode": {
        "label": "Targeting mode",
        "unit": "",
        "formatter": lambda x: x,
        "description": "Strategic targeting approach used in the model.",
        "source_type": "User override",
        "confidence_level": "Medium",
    },
    "time_horizon_years": {
        "label": "Time horizon",
        "unit": "years",
        "formatter": lambda x: f"{int(x)}",
        "description": "Number of years over which outcomes are modelled.",
        "source_type": "User override",
        "confidence_level": "High",
    },
    "discount_rate": {
        "label": "Discount rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Annual rate used to discount future costs and QALYs.",
        "source_type": "Evidence-informed proxy",
        "confidence_level": "High",
    },
    "cost_effectiveness_threshold": {
        "label": "Cost-effectiveness threshold",
        "unit": "GBP per QALY",
        "formatter": format_currency,
        "description": "Illustrative threshold used to interpret discounted cost per QALY.",
        "source_type": "Illustrative default",
        "confidence_level": "High",
    },
}


ASSUMPTION_ORDER = [
    "eligible_population",
    "baseline_recurrent_event_rate",
    "admission_probability_per_event",
    "average_length_of_stay",
    "intervention_reach_rate",
    "sustained_engagement_rate",
    "annual_participation_dropoff_rate",
    "risk_reduction_in_recurrent_events",
    "annual_effect_decay_rate",
    "intervention_cost_per_patient_reached",
    "cost_per_cardiovascular_event",
    "cost_per_admission",
    "cost_per_bed_day",
    "costing_method",
    "qaly_gain_per_event_avoided",
    "targeting_mode",
    "time_horizon_years",
    "discount_rate",
    "cost_effectiveness_threshold",
]


def get_assumption_confidence_summary() -> dict:
    summary = {
        "High": 0,
        "Medium": 0,
        "Low": 0,
    }

    for meta in ASSUMPTION_META.values():
        confidence = meta["confidence_level"]
        if confidence in summary:
            summary[confidence] += 1

    summary["summary_text"] = (
        f"{summary['High']} high-confidence, "
        f"{summary['Medium']} medium-confidence, and "
        f"{summary['Low']} low-confidence assumptions are currently in play."
    )
    return summary