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
    },
    "uptake_rate": {
        "label": "Programme uptake",
        "unit": "%",
        "formatter": format_percent,
        "description": "Share of the eligible population that starts the intervention.",
    },
    "adherence_rate": {
        "label": "Programme completion",
        "unit": "%",
        "formatter": format_percent,
        "description": "Share of those taking up the intervention who complete it.",
    },
    "annual_fall_risk": {
        "label": "Annual fall risk",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated annual probability of a fall in the target population.",
    },
    "admission_rate_after_fall": {
        "label": "Falls leading to admission",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated share of falls that result in hospital admission.",
    },
    "average_length_of_stay": {
        "label": "Average length of stay",
        "unit": "days",
        "formatter": lambda x: f"{x:,.1f}",
        "description": "Average inpatient length of stay for admissions linked to falls.",
    },
    "intervention_cost_per_person": {
        "label": "Cost per participant",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Estimated delivery cost per person receiving the intervention.",
    },
    "relative_risk_reduction": {
        "label": "Reduction in falls",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated relative reduction in falls among participants in year 1.",
    },
    "effect_decay_rate": {
        "label": "Annual effect decay",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated year-on-year reduction in intervention effect after the first year.",
    },
    "cost_per_admission": {
        "label": "Cost per admission",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Average hospital cost associated with a fall-related admission.",
    },
    "cost_per_bed_day": {
        "label": "Cost per bed day",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Illustrative cost value for an inpatient bed day.",
    },
    "qaly_loss_per_serious_fall": {
        "label": "QALY loss per serious fall",
        "unit": "QALYs",
        "formatter": lambda x: f"{x:.2f}",
        "description": "Simple quality-of-life loss proxy applied to avoided serious falls.",
    },
    "cost_effectiveness_threshold": {
        "label": "Cost-effectiveness threshold",
        "unit": "GBP per QALY",
        "formatter": format_currency,
        "description": "Illustrative threshold used to interpret discounted cost per QALY.",
    },
    "time_horizon_years": {
        "label": "Time horizon",
        "unit": "years",
        "formatter": lambda x: f"{int(x)}",
        "description": "Number of years over which costs and benefits are modelled.",
    },
    "discount_rate": {
        "label": "Discount rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Annual rate used to discount future costs and QALYs.",
    },
}

ASSUMPTION_ORDER = [
    "eligible_population",
    "uptake_rate",
    "adherence_rate",
    "annual_fall_risk",
    "admission_rate_after_fall",
    "average_length_of_stay",
    "intervention_cost_per_person",
    "relative_risk_reduction",
    "effect_decay_rate",
    "cost_per_admission",
    "cost_per_bed_day",
    "qaly_loss_per_serious_fall",
    "cost_effectiveness_threshold",
    "time_horizon_years",
    "discount_rate",
]
