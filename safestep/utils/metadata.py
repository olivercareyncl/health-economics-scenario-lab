from utils.formatters import (
    format_currency,
    format_number,
    format_percent,
)


ASSUMPTION_META = {
    "eligible_population": {
        "label": "Eligible population",
        "unit": "people",
        "formatter": format_number,
        "description": "Population considered eligible for the intervention.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "uptake_rate": {
        "label": "Programme uptake",
        "unit": "%",
        "formatter": format_percent,
        "description": "Share of the eligible population that starts the intervention.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "adherence_rate": {
        "label": "Programme completion",
        "unit": "%",
        "formatter": format_percent,
        "description": "Share of those taking up the intervention who complete it.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "participation_dropoff_rate": {
        "label": "Annual participation drop-off",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated year-on-year drop in the number of people still effectively receiving the intervention.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "targeting_mode": {
        "label": "Targeting mode",
        "unit": "",
        "formatter": lambda x: x,
        "description": "How broadly or narrowly the intervention is focused across the eligible population.",
        "source_type": "User override",
        "confidence": "Medium confidence",
    },
    "annual_fall_risk": {
        "label": "Annual fall risk",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated annual probability of a fall before any targeting uplift is applied.",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
    },
    "admission_rate_after_fall": {
        "label": "Falls leading to admission",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated share of falls that result in hospital admission.",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
    },
    "average_length_of_stay": {
        "label": "Average length of stay",
        "unit": "days",
        "formatter": lambda x: f"{x:,.1f}",
        "description": "Average inpatient length of stay for admissions linked to falls.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "intervention_cost_per_person": {
        "label": "Cost per participant",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Estimated delivery cost per person receiving the intervention.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "relative_risk_reduction": {
        "label": "Reduction in falls",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated relative reduction in falls among participants in year 1.",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
    },
    "effect_decay_rate": {
        "label": "Annual effect decay",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated year-on-year reduction in intervention effect after the first year.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "costing_method": {
        "label": "Costing method",
        "unit": "",
        "formatter": lambda x: x,
        "description": "Method used to value the impact of avoided admissions and bed days.",
        "source_type": "User override",
        "confidence": "Medium confidence",
    },
    "cost_per_admission": {
        "label": "Cost per admission",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Average hospital cost associated with a fall-related admission.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "cost_per_bed_day": {
        "label": "Cost per bed day",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Illustrative cost value for an inpatient bed day.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "qaly_loss_per_serious_fall": {
        "label": "QALY loss per serious fall",
        "unit": "QALYs",
        "formatter": lambda x: f"{x:.2f}",
        "description": "Simple quality-of-life loss proxy applied to avoided serious falls.",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
    },
    "cost_effectiveness_threshold": {
        "label": "Cost-effectiveness threshold",
        "unit": "GBP per QALY",
        "formatter": format_currency,
        "description": "Illustrative threshold used to interpret discounted cost per QALY.",
        "source_type": "Illustrative default",
        "confidence": "High confidence",
    },
    "time_horizon_years": {
        "label": "Time horizon",
        "unit": "years",
        "formatter": lambda x: f"{int(x)}",
        "description": "Number of years over which costs and benefits are modelled.",
        "source_type": "User override",
        "confidence": "High confidence",
    },
    "discount_rate": {
        "label": "Discount rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Annual rate used to discount future costs and QALYs.",
        "source_type": "Evidence-informed proxy",
        "confidence": "High confidence",
    },
}


ASSUMPTION_ORDER = [
    "eligible_population",
    "uptake_rate",
    "adherence_rate",
    "participation_dropoff_rate",
    "targeting_mode",
    "annual_fall_risk",
    "admission_rate_after_fall",
    "average_length_of_stay",
    "intervention_cost_per_person",
    "relative_risk_reduction",
    "effect_decay_rate",
    "costing_method",
    "cost_per_admission",
    "cost_per_bed_day",
    "qaly_loss_per_serious_fall",
    "cost_effectiveness_threshold",
    "time_horizon_years",
    "discount_rate",
]


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