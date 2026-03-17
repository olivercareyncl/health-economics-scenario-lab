import pandas as pd

from utils.calculations import clamp_rate, run_model
from utils.metadata import ASSUMPTION_META


SENSITIVITY_VARIABLES = [
    "achievable_reduction_in_late_diagnosis",
    "intervention_cost_per_case_reached",
    "current_late_diagnosis_rate",
    "qaly_gain_per_case_shifted",
    "treatment_cost_late",
    "treatment_cost_early",
    "effect_decay_rate",
    "participation_dropoff_rate",
]


def _apply_variation(value: float, variation: float, is_rate: bool) -> tuple[float, float]:
    low = value * (1 - variation)
    high = value * (1 + variation)

    if is_rate:
        low = clamp_rate(low)
        high = clamp_rate(high)

    return low, high


def run_one_way_sensitivity(
    base_inputs: dict,
    variables: list[str],
    variation: float = 0.20,
    outcome_key: str = "discounted_cost_per_qaly",
) -> pd.DataFrame:
    base_results = run_model(base_inputs)
    base_value = base_results[outcome_key]

    rows = []

    for variable in variables:
        meta = ASSUMPTION_META[variable]
        base_input_value = base_inputs[variable]

        is_rate = variable in {
            "current_late_diagnosis_rate",
            "achievable_reduction_in_late_diagnosis",
            "late_emergency_presentation_rate",
            "early_emergency_presentation_rate",
            "effect_decay_rate",
            "participation_dropoff_rate",
            "discount_rate",
        }

        low_input, high_input = _apply_variation(base_input_value, variation, is_rate)

        low_case_inputs = base_inputs.copy()
        high_case_inputs = base_inputs.copy()

        low_case_inputs[variable] = low_input
        high_case_inputs[variable] = high_input

        low_case_results = run_model(low_case_inputs)
        high_case_results = run_model(high_case_inputs)

        low_outcome = low_case_results[outcome_key]
        high_outcome = high_case_results[outcome_key]

        low_delta = low_outcome - base_value
        high_delta = high_outcome - base_value
        swing = abs(high_outcome - low_outcome)

        rows.append(
            {
                "variable": variable,
                "label": meta["label"],
                "base_input": base_input_value,
                "low_input": low_input,
                "high_input": high_input,
                "base_outcome": base_value,
                "low_outcome": low_outcome,
                "high_outcome": high_outcome,
                "low_delta": low_delta,
                "high_delta": high_delta,
                "swing": swing,
            }
        )

    df = pd.DataFrame(rows)
    return df.sort_values("swing", ascending=False).reset_index(drop=True)


def build_sensitivity_takeaways(sensitivity_df: pd.DataFrame) -> list[str]:
    top = sensitivity_df.sort_values("swing", ascending=False).head(3)

    takeaways = []

    if len(top) >= 1:
        takeaways.append(
            f"The result is most sensitive to {top.iloc[0]['label'].lower()}."
        )
    if len(top) >= 2:
        takeaways.append(
            f"{top.iloc[1]['label']} is the next biggest driver of movement in discounted cost per QALY."
        )
    if len(top) >= 3:
        takeaways.append(
            f"Changes in {top.iloc[2]['label'].lower()} still matter, but less than the leading two drivers."
        )

    return takeaways