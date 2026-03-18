from utils.formatters import format_currency, format_number, format_percent

ASSUMPTION_ORDER = [
    "eligible_population",
    "baseline_complication_rate",
    "admission_probability_per_complication",
    "average_length_of_stay",
    "intervention_reach_rate",
    "sustained_engagement_rate",
    "annual_participation_dropoff_rate",
    "complication_risk_reduction",
    "annual_effect_decay_rate",
    "intervention_cost_per_patient_reached",
    "cost_per_diabetes_complication",
    "cost_per_admission",
    "cost_per_bed_day",
    "costing_method",
    "qaly_gain_per_complication_avoided",
    "targeting_mode",
    "time_horizon_years",
    "discount_rate",
    "cost_effectiveness_threshold",
]

ASSUMPTION_META = {
    "eligible_population": {
        "label": "Eligible population",
        "formatter": format_number,
        "unit": "people",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
        "description": "Estimated size of the population eligible for proactive diabetes prevention or management.",
    },
    "baseline_complication_rate": {
        "label": "Baseline diabetes complication rate",
        "formatter": format_percent,
        "unit": "annual rate",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
        "description": "Annual probability of a composite diabetes complication event before intervention.",
    },
    "admission_probability_per_complication": {
        "label": "Admission probability per complication",
        "formatter": format_percent,
        "unit": "probability",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
        "description": "Proportion of composite complication events expected to result in admission.",
    },
    "average_length_of_stay": {
        "label": "Average length of stay",
        "formatter": lambda x: f"{x:,.1f}",
        "unit": "days",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
        "description": "Average inpatient length of stay for an admitted complication event.",
    },
    "intervention_reach_rate": {
        "label": "Intervention reach",
        "formatter": format_percent,
        "unit": "rate",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
        "description": "Share of the eligible population reached by the intervention.",
    },
    "sustained_engagement_rate": {
        "label": "Sustained engagement / adherence",
        "formatter": format_percent,
        "unit": "rate",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
        "description": "Share of reached patients who remain engaged enough for the intervention to have effect.",
    },
    "annual_participation_dropoff_rate": {
        "label": "Annual participation drop-off",
        "formatter": format_percent,
        "unit": "annual rate",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
        "description": "Annual reduction in ongoing participation or persistence over time.",
    },
    "complication_risk_reduction": {
        "label": "Complication risk reduction",
        "formatter": format_percent,
        "unit": "relative reduction",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
        "description": "Relative reduction in composite complication risk associated with the intervention.",
    },
    "annual_effect_decay_rate": {
        "label": "Annual effect decay",
        "formatter": format_percent,
        "unit": "annual rate",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
        "description": "Annual weakening of intervention effect over time.",
    },
    "intervention_cost_per_patient_reached": {
        "label": "Intervention cost per patient reached",
        "formatter": format_currency,
        "unit": "per patient",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
        "description": "Average delivery cost per patient reached by the intervention.",
    },
    "cost_per_diabetes_complication": {
        "label": "Cost per diabetes complication",
        "formatter": format_currency,
        "unit": "per event",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
        "description": "Average system cost associated with a composite diabetes complication event.",
    },
    "cost_per_admission": {
        "label": "Cost per admission",
        "formatter": format_currency,
        "unit": "per admission",
        "source_type": "Operational estimate",
        "confidence": "High confidence",
        "description": "Average cost of an admission resulting from a complication event.",
    },
    "cost_per_bed_day": {
        "label": "Cost per bed day",
        "formatter": format_currency,
        "unit": "per bed day",
        "source_type": "Operational estimate",
        "confidence": "High confidence",
        "description": "Average value or cost associated with one inpatient bed day.",
    },
    "costing_method": {
        "label": "Costing method",
        "formatter": str,
        "unit": "selection",
        "source_type": "User override",
        "confidence": "High confidence",
        "description": "Selected costing logic used to estimate savings in the model.",
    },
    "qaly_gain_per_complication_avoided": {
        "label": "QALY gain per complication avoided",
        "formatter": lambda x: f"{x:,.2f}",
        "unit": "QALYs",
        "source_type": "Evidence-informed proxy",
        "confidence": "Low confidence",
        "description": "Illustrative health gain attached to each composite complication avoided.",
    },
    "targeting_mode": {
        "label": "Targeting mode",
        "formatter": str,
        "unit": "selection",
        "source_type": "User override",
        "confidence": "High confidence",
        "description": "Strategic targeting approach used to shape reach, risk, and benefit concentration.",
    },
    "time_horizon_years": {
        "label": "Time horizon",
        "formatter": lambda x: f"{int(x)}",
        "unit": "years",
        "source_type": "User override",
        "confidence": "High confidence",
        "description": "Selected number of years over which costs and outcomes are modelled.",
    },
    "discount_rate": {
        "label": "Discount rate",
        "formatter": format_percent,
        "unit": "annual rate",
        "source_type": "User override",
        "confidence": "High confidence",
        "description": "Annual discount rate applied to future costs and QALYs.",
    },
    "cost_effectiveness_threshold": {
        "label": "Cost-effectiveness threshold",
        "formatter": format_currency,
        "unit": "per QALY",
        "source_type": "User override",
        "confidence": "High confidence",
        "description": "Threshold used to interpret whether the intervention appears cost-effective.",
    },
}


def get_assumption_confidence_summary() -> dict:
    summary = {
        "High confidence": 0,
        "Medium confidence": 0,
        "Low confidence": 0,
    }

    for meta in ASSUMPTION_META.values():
        confidence = meta["confidence"]
        if confidence in summary:
            summary[confidence] += 1

    return summary