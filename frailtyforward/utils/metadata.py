from utils.formatters import (
    format_currency,
    format_number,
    format_percent,
)


ASSUMPTION_META = {
    "annual_frailty_cohort_size": {
        "label": "Annual frailty cohort size",
        "unit": "patients",
        "formatter": format_number,
        "description": "Estimated annual number of frail or high-risk patients in scope for the support model.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "baseline_crisis_event_rate": {
        "label": "Baseline crisis event rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated baseline rate of crisis or deterioration events in the cohort.",
        "source_type": "Evidence-informed proxy",
        "confidence": "Medium confidence",
    },
    "baseline_non_elective_admission_rate": {
        "label": "Baseline non-elective admission rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated baseline rate of non-elective admissions in the frailty cohort.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "current_average_length_of_stay": {
        "label": "Current average length of stay",
        "unit": "days",
        "formatter": lambda x: f"{x:,.1f}",
        "description": "Average inpatient length of stay for admitted patients in the baseline model.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "implementation_reach_rate": {
        "label": "Implementation reach rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated share of the cohort effectively reached by the community support model.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "reduction_in_crisis_event_rate": {
        "label": "Reduction in crisis event rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated reduction in crisis or deterioration events under the support model.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "reduction_in_admission_rate": {
        "label": "Reduction in admission rate",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated reduction in non-elective admissions under the support model.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "reduction_in_length_of_stay": {
        "label": "Reduction in length of stay",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated reduction in average length of stay under the support model.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "support_cost_per_patient": {
        "label": "Support cost per patient",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Estimated programme cost per patient reached by the community support model.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "effect_decay_rate": {
        "label": "Annual effect decay",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated annual reduction in support effect over time.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "participation_dropoff_rate": {
        "label": "Annual participation / persistence drop-off",
        "unit": "%",
        "formatter": format_percent,
        "description": "Estimated annual reduction in effective support reach over time.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "cost_per_crisis_event": {
        "label": "Cost per crisis event",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Estimated cost associated with a crisis or deterioration event.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "cost_per_admission": {
        "label": "Cost per admission",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Estimated cost per non-elective admission.",
        "source_type": "Operational estimate",
        "confidence": "Medium confidence",
    },
    "cost_per_bed_day": {
        "label": "Cost per bed day",
        "unit": "GBP",
        "formatter": format_currency,
        "description": "Illustrative bed-day value for exploratory costing.",
        "source_type": "Illustrative default",
        "confidence": "Low confidence",
    },
    "costing_method": {
        "label": "Costing method",
        "unit": "",
        "formatter": lambda x: x,
        "description": "Method used to value the economic effect of earlier frailty support.",
        "source_type": "User override",
        "confidence": "Medium confidence",
    },
    "qaly_gain_per_patient_stabilised": {
        "label": "QALY gain per patient meaningfully stabilised",
        "unit": "QALYs",
        "formatter": lambda x: f"{x:.2f}",
        "description": "Estimated QALY gain for each patient meaningfully stabilised by the support model.",
        "source_type": "Evidence-informed proxy",
        "confidence": "Low confidence",
    },
    "targeting_mode": {
        "label": "Targeting mode",
        "unit": "",
        "formatter": lambda x: x,
        "description": "How broadly or narrowly the support model is focused across the frailty cohort.",
        "source_type": "User override",
        "confidence": "Medium confidence",
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
    "cost_effectiveness_threshold": {
        "label": "Cost-effectiveness threshold",
        "unit": "GBP per QALY",
        "formatter": format_currency,
        "description": "Illustrative threshold used to interpret discounted cost per QALY.",
        "source_type": "Illustrative default",
        "confidence": "High confidence",
    },
}


ASSUMPTION_ORDER = [
    "annual_frailty_cohort_size",
    "baseline_crisis_event_rate",
    "baseline_non_elective_admission_rate",
    "current_average_length_of_stay",
    "implementation_reach_rate",
    "reduction_in_crisis_event_rate",
    "reduction_in_admission_rate",
    "reduction_in_length_of_stay",
    "support_cost_per_patient",
    "effect_decay_rate",
    "participation_dropoff_rate",
    "cost_per_crisis_event",
    "cost_per_admission",
    "cost_per_bed_day",
    "costing_method",
    "qaly_gain_per_patient_stabilised",
    "targeting_mode",
    "time_horizon_years",
    "discount_rate",
    "cost_effectiveness_threshold",
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

    summary["summary_text"] = (
        f"{summary['High confidence']} high-confidence, "
        f"{summary['Medium confidence']} medium-confidence, and "
        f"{summary['Low confidence']} low-confidence assumptions are currently in play."
    )
    return summary
