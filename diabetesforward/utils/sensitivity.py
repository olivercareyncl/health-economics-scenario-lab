from copy import deepcopy

import pandas as pd


SENSITIVITY_VARIABLES = [
    {
        "key": "baseline_complication_rate",
        "label": "Baseline complication rate",
        "min": 0.0,
        "max": 1.0,
    },
    {
        "key": "complication_risk_reduction",
        "label": "Complication risk reduction",
        "min": 0.0,
        "max": 0.95,
    },
    {
        "key": "intervention_cost_per_patient_reached",
        "label": "Intervention cost per patient",
        "min": 0.0,
        "max": None,
    },
    {
        "key": "intervention_reach_rate",
        "label": "Intervention reach",
        "min": 0.0,
        "max": 1.0,
    },
    {
        "key": "sustained_engagement_rate",
        "label": "Sustained engagement",
        "min": 0.0,
        "max": 1.0,
    },
    {
        "key": "cost_per_diabetes_complication",
        "label": "Cost per complication",
        "min": 0.0,
        "max": None,
    },
    {
        "key": "cost_per_admission",
        "label": "Cost per admission",
        "min": 0.0,
        "max": None,
    },
    {
        "key": "cost_per_bed_day",
        "label": "Cost per bed day",
        "min": 0.0,
        "max": None,
    },
    {
        "key": "qaly_gain_per_complication_avoided",
        "label": "QALY gain per complication avoided",
        "min": 0.0,
        "max": None,
    },
    {
        "key": "annual_effect_decay_rate",
        "label": "Annual effect decay",
        "min": 0.0,
        "max": 0.5,
    },
    {
        "key": "annual_participation_dropoff_rate",
        "label": "Annual participation drop-off",
        "min": 0.0,
        "max": 0.5,
    },
]


def _bounded_value(value: float, min_value: float | None, max_value: float | None) -> float:
    bounded = value
    if min_value is not None:
        bounded = max(min_value, bounded)
    if max_value is not None:
        bounded = min(max_value, bounded)
    return bounded


def run_one_way_sensitivity(
    base_inputs: dict,
    variables: list[dict],
    variation: float,
    outcome_key: str,
) -> pd.DataFrame:
    from utils.calculations import run_model

    base_results = run_model(base_inputs)
    base_value = float(base_results[outcome_key])

    rows = []

    for variable in variables:
        key = variable["key"]
        label = variable["label"]
        min_value = variable.get("min")
        max_value = variable.get("max")

        current_value = float(base_inputs[key])

        low_inputs = deepcopy(base_inputs)
        high_inputs = deepcopy(base_inputs)

        low_value = _bounded_value(current_value * (1 - variation), min_value, max_value)
        high_value = _bounded_value(current_value * (1 + variation), min_value, max_value)

        low_inputs[key] = low_value
        high_inputs[key] = high_value

        low_results = run_model(low_inputs)
        high_results = run_model(high_inputs)

        low_outcome = float(low_results[outcome_key])
        high_outcome = float(high_results[outcome_key])

        rows.append(
            {
                "key": key,
                "label": label,
                "base_input": current_value,
                "low_input": low_value,
                "high_input": high_value,
                "base_value": base_value,
                "low_value": low_outcome,
                "high_value": high_outcome,
                "impact_range": abs(high_outcome - low_outcome),
            }
        )

    return pd.DataFrame(rows).sort_values("impact_range", ascending=False)


def build_sensitivity_takeaways(sensitivity_df: pd.DataFrame) -> list[str]:
    if sensitivity_df.empty:
        return ["No sensitivity results available."]

    ordered = sensitivity_df.sort_values("impact_range", ascending=False).reset_index(drop=True)

    takeaways: list[str] = []

    top = ordered.iloc[0]
    takeaways.append(
        f"The strongest driver of discounted cost per QALY is {top['label'].lower()} under the current assumptions."
    )

    if len(ordered) > 1:
        second = ordered.iloc[1]
        takeaways.append(
            f"{second['label']} is also materially influential and should be checked carefully in any local adaptation."
        )

    cost_drivers = ordered[
        ordered["label"].str.contains("cost", case=False, na=False)
    ]
    if not cost_drivers.empty:
        takeaways.append(
            "Delivery and system cost assumptions remain important, so local costing choices can shift the apparent value case noticeably."
        )

    effect_drivers = ordered[
        ordered["label"].str.contains(
            "risk reduction|engagement|reach|decay|drop-off",
            case=False,
            na=False,
            regex=True,
        )
    ]
    if not effect_drivers.empty:
        takeaways.append(
            "The result is sensitive not just to programme cost, but to whether effect is achieved and sustained in practice."
        )

    return takeaways[:4]