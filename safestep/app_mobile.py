import json
from pathlib import Path

import pandas as pd
import streamlit as st

from utils.calculations import (
    build_comparator_case,
    run_bounded_uncertainty,
    run_model,
)
from utils.charts import (
    make_comparator_delta_chart,
    make_cumulative_net_cost_chart,
    make_falls_avoided_chart,
    make_impact_bar_chart,
    make_tornado_chart,
    make_uncertainty_chart,
    make_waterfall_chart,
)
from utils.formatters import (
    format_currency,
    format_number,
    format_percent,
    format_ratio,
)
from utils.metadata import (
    ASSUMPTION_META,
    ASSUMPTION_ORDER,
)
from utils.scenarios import (
    COSTING_METHOD_OPTIONS,
    SCENARIO_MAP,
    TARGETING_MODE_OPTIONS,
)
from utils.sensitivity import (
    SENSITIVITY_VARIABLES,
    build_sensitivity_takeaways,
    run_one_way_sensitivity,
)
from utils.summaries import (
    assess_uncertainty_robustness,
    generate_decision_readiness,
    generate_interpretation,
    generate_overall_signal,
    generate_overview_summary,
    generate_structured_recommendation,
    get_decision_status,
    get_main_driver_text,
    get_net_cost_label,
)

st.set_page_config(
    page_title="SafeStep Mobile",
    page_icon="🩺",
    layout="centered",
)


@st.cache_data
def load_defaults() -> dict:
    base_dir = Path(__file__).resolve().parent
    data_path = base_dir / "data" / "default_assumptions.json"

    fallback_defaults = {
        "eligible_population": 5000,
        "uptake_rate": 0.5,
        "adherence_rate": 0.8,
        "annual_fall_risk": 0.3,
        "admission_rate_after_fall": 0.2,
        "average_length_of_stay": 7,
        "intervention_cost_per_person": 250,
        "relative_risk_reduction": 0.2,
        "effect_decay_rate": 0.1,
        "participation_dropoff_rate": 0.05,
        "cost_per_admission": 3500,
        "cost_per_bed_day": 400,
        "qaly_loss_per_serious_fall": 0.05,
        "cost_effectiveness_threshold": 20000,
        "time_horizon_years": 3,
        "discount_rate": 0.035,
        "costing_method": "Admission cost only",
        "targeting_mode": "Broad population",
    }

    with open(data_path, "r", encoding="utf-8") as f:
        loaded = json.load(f)

    fallback_defaults.update(loaded)
    return fallback_defaults


def build_assumptions_table(inputs: dict) -> pd.DataFrame:
    rows = []
    for key in ASSUMPTION_ORDER:
        if key not in inputs:
            continue
        meta = ASSUMPTION_META[key]
        rows.append(
            {
                "Assumption": meta["label"],
                "Value": meta["formatter"](inputs[key]),
                "Confidence": meta["confidence"],
            }
        )
    return pd.DataFrame(rows)


def build_yearly_results_table(yearly_df: pd.DataFrame) -> pd.DataFrame:
    display_df = yearly_df.copy()
    display_df = display_df.rename(
        columns={
            "year": "Year",
            "treated_population": "Treated",
            "falls_avoided": "Falls avoided",
            "admissions_avoided": "Admissions avoided",
            "bed_days_avoided": "Bed days avoided",
            "programme_cost": "Programme cost",
            "gross_savings": "Gross savings",
            "discounted_net_cost": "Discounted net cost",
        }
    )

    for col in ["Treated", "Falls avoided", "Admissions avoided", "Bed days avoided"]:
        if col in display_df.columns:
            display_df[col] = display_df[col].apply(format_number)

    for col in ["Programme cost", "Gross savings", "Discounted net cost"]:
        if col in display_df.columns:
            display_df[col] = display_df[col].apply(format_currency)

    return display_df[
        [
            "Year",
            "Treated",
            "Falls avoided",
            "Admissions avoided",
            "Bed days avoided",
            "Programme cost",
            "Gross savings",
            "Discounted net cost",
        ]
    ]


def build_uncertainty_table(uncertainty_df: pd.DataFrame) -> pd.DataFrame:
    display_df = uncertainty_df.copy()
    display_df = display_df.rename(
        columns={
            "case": "Case",
            "falls_avoided_total": "Falls avoided",
            "discounted_net_cost_total": "Discounted net cost",
            "discounted_cost_per_qaly": "Cost per QALY",
        }
    )
    display_df["Falls avoided"] = display_df["Falls avoided"].apply(format_number)
    display_df["Discounted net cost"] = display_df["Discounted net cost"].apply(format_currency)
    display_df["Cost per QALY"] = display_df["Cost per QALY"].apply(format_currency)
    return display_df[["Case", "Falls avoided", "Discounted net cost", "Cost per QALY"]]


def build_comparator_table(base_results: dict, comparator_results: dict) -> pd.DataFrame:
    rows = [
        {
            "Metric": "Falls avoided",
            "Current": format_number(base_results["falls_avoided_total"]),
            "Comparator": format_number(comparator_results["falls_avoided_total"]),
        },
        {
            "Metric": "Discounted net cost",
            "Current": format_currency(base_results["discounted_net_cost_total"]),
            "Comparator": format_currency(comparator_results["discounted_net_cost_total"]),
        },
        {
            "Metric": "Cost per QALY",
            "Current": format_currency(base_results["discounted_cost_per_qaly"]),
            "Comparator": format_currency(comparator_results["discounted_cost_per_qaly"]),
        },
    ]
    return pd.DataFrame(rows)


defaults = load_defaults()

st.caption("SafeStep · Mobile")
st.title("SafeStep")
st.subheader("Falls Prevention ROI Sandbox")
st.write("A lighter mobile version of the falls prevention sandbox.")

st.warning(
    "Demo only. Uses synthetic assumptions for illustrative decision support. Not a formal economic evaluation."
)

with st.sidebar:
    st.header("Setup")

    selected_scenario = st.selectbox(
        "Preset",
        list(SCENARIO_MAP.keys()),
        index=0,
    )

    scenario_inputs = defaults.copy()
    scenario_inputs.update(SCENARIO_MAP[selected_scenario](defaults))

    eligible_population = st.number_input(
        "Eligible population",
        min_value=0,
        value=int(scenario_inputs.get("eligible_population", defaults["eligible_population"])),
        step=100,
    )

    targeting_mode = st.selectbox(
        "Targeting",
        TARGETING_MODE_OPTIONS,
        index=TARGETING_MODE_OPTIONS.index(
            scenario_inputs.get("targeting_mode", defaults["targeting_mode"])
        ),
    )

    uptake_rate = st.slider(
        "Uptake",
        min_value=0.0,
        max_value=1.0,
        value=float(scenario_inputs.get("uptake_rate", defaults["uptake_rate"])),
        step=0.01,
    )

    relative_risk_reduction = st.slider(
        "Reduction in falls",
        min_value=0.0,
        max_value=1.0,
        value=float(scenario_inputs.get("relative_risk_reduction", defaults["relative_risk_reduction"])),
        step=0.01,
    )

    intervention_cost_per_person = st.number_input(
        "Cost per participant",
        min_value=0.0,
        value=float(scenario_inputs.get("intervention_cost_per_person", defaults["intervention_cost_per_person"])),
        step=10.0,
    )

    time_horizon_value = int(scenario_inputs.get("time_horizon_years", defaults.get("time_horizon_years", 3)))
    if time_horizon_value not in [1, 3, 5]:
        time_horizon_value = 3

    time_horizon_years = st.selectbox(
        "Time horizon",
        options=[1, 3, 5],
        index=[1, 3, 5].index(time_horizon_value),
    )

    with st.expander("More settings"):
        adherence_rate = st.slider(
            "Completion",
            min_value=0.0,
            max_value=1.0,
            value=float(scenario_inputs.get("adherence_rate", defaults["adherence_rate"])),
            step=0.01,
        )
        annual_fall_risk = st.slider(
            "Annual fall risk",
            min_value=0.0,
            max_value=1.0,
            value=float(scenario_inputs.get("annual_fall_risk", defaults["annual_fall_risk"])),
            step=0.01,
        )
        admission_rate_after_fall = st.slider(
            "Falls leading to admission",
            min_value=0.0,
            max_value=1.0,
            value=float(scenario_inputs.get("admission_rate_after_fall", defaults["admission_rate_after_fall"])),
            step=0.01,
        )
        average_length_of_stay = st.number_input(
            "Length of stay (days)",
            min_value=0.0,
            value=float(scenario_inputs.get("average_length_of_stay", defaults["average_length_of_stay"])),
            step=0.5,
        )
        participation_dropoff_rate = st.slider(
            "Annual drop-off",
            min_value=0.0,
            max_value=0.5,
            value=float(scenario_inputs.get("participation_dropoff_rate", defaults["participation_dropoff_rate"])),
            step=0.01,
        )
        effect_decay_rate = st.slider(
            "Annual effect decay",
            min_value=0.0,
            max_value=0.5,
            value=float(scenario_inputs.get("effect_decay_rate", defaults["effect_decay_rate"])),
            step=0.01,
        )
        costing_method = st.selectbox(
            "Costing method",
            COSTING_METHOD_OPTIONS,
            index=COSTING_METHOD_OPTIONS.index(
                scenario_inputs.get("costing_method", defaults["costing_method"])
            ),
        )
        cost_per_admission = st.number_input(
            "Cost per admission",
            min_value=0.0,
            value=float(scenario_inputs.get("cost_per_admission", defaults["cost_per_admission"])),
            step=100.0,
        )
        cost_per_bed_day = st.number_input(
            "Cost per bed day",
            min_value=0.0,
            value=float(scenario_inputs.get("cost_per_bed_day", defaults["cost_per_bed_day"])),
            step=50.0,
        )
        qaly_loss_per_serious_fall = st.number_input(
            "QALY loss / serious fall",
            min_value=0.0,
            value=float(scenario_inputs.get("qaly_loss_per_serious_fall", defaults["qaly_loss_per_serious_fall"])),
            step=0.01,
        )
        discount_rate = st.number_input(
            "Discount rate",
            min_value=0.0,
            value=float(scenario_inputs.get("discount_rate", defaults.get("discount_rate", 0.035))),
            step=0.005,
            format="%.3f",
        )
        cost_effectiveness_threshold = st.number_input(
            "Threshold",
            min_value=0.0,
            value=float(scenario_inputs.get("cost_effectiveness_threshold", defaults["cost_effectiveness_threshold"])),
            step=1000.0,
        )

    comparator_mode = st.selectbox(
        "Comparator",
        [
            "Higher-risk targeting",
            "Tighter high-risk targeting",
            "Lower-cost delivery",
            "Stronger effect",
            "Targeted and stronger effect",
        ],
        index=0,
    )

# Defaults for fields that may only appear in expander section
adherence_rate = locals().get("adherence_rate", float(scenario_inputs.get("adherence_rate", defaults["adherence_rate"])))
annual_fall_risk = locals().get("annual_fall_risk", float(scenario_inputs.get("annual_fall_risk", defaults["annual_fall_risk"])))
admission_rate_after_fall = locals().get("admission_rate_after_fall", float(scenario_inputs.get("admission_rate_after_fall", defaults["admission_rate_after_fall"])))
average_length_of_stay = locals().get("average_length_of_stay", float(scenario_inputs.get("average_length_of_stay", defaults["average_length_of_stay"])))
participation_dropoff_rate = locals().get("participation_dropoff_rate", float(scenario_inputs.get("participation_dropoff_rate", defaults["participation_dropoff_rate"])))
effect_decay_rate = locals().get("effect_decay_rate", float(scenario_inputs.get("effect_decay_rate", defaults["effect_decay_rate"])))
costing_method = locals().get("costing_method", scenario_inputs.get("costing_method", defaults["costing_method"]))
cost_per_admission = locals().get("cost_per_admission", float(scenario_inputs.get("cost_per_admission", defaults["cost_per_admission"])))
cost_per_bed_day = locals().get("cost_per_bed_day", float(scenario_inputs.get("cost_per_bed_day", defaults["cost_per_bed_day"])))
qaly_loss_per_serious_fall = locals().get("qaly_loss_per_serious_fall", float(scenario_inputs.get("qaly_loss_per_serious_fall", defaults["qaly_loss_per_serious_fall"])))
discount_rate = locals().get("discount_rate", float(scenario_inputs.get("discount_rate", defaults.get("discount_rate", 0.035))))
cost_effectiveness_threshold = locals().get("cost_effectiveness_threshold", float(scenario_inputs.get("cost_effectiveness_threshold", defaults["cost_effectiveness_threshold"])))

inputs = {
    "eligible_population": eligible_population,
    "uptake_rate": uptake_rate,
    "adherence_rate": adherence_rate,
    "annual_fall_risk": annual_fall_risk,
    "admission_rate_after_fall": admission_rate_after_fall,
    "average_length_of_stay": average_length_of_stay,
    "intervention_cost_per_person": intervention_cost_per_person,
    "relative_risk_reduction": relative_risk_reduction,
    "effect_decay_rate": effect_decay_rate,
    "participation_dropoff_rate": participation_dropoff_rate,
    "cost_per_admission": cost_per_admission,
    "cost_per_bed_day": cost_per_bed_day,
    "qaly_loss_per_serious_fall": qaly_loss_per_serious_fall,
    "cost_effectiveness_threshold": cost_effectiveness_threshold,
    "time_horizon_years": time_horizon_years,
    "discount_rate": discount_rate,
    "costing_method": costing_method,
    "targeting_mode": targeting_mode,
}

results = run_model(inputs)
uncertainty_df = run_bounded_uncertainty(inputs)
uncertainty_display_df = build_uncertainty_table(uncertainty_df)

decision_status = get_decision_status(results, cost_effectiveness_threshold)
overview_summary = generate_overview_summary(results, inputs, uncertainty_df)
interpretation = generate_interpretation(results, inputs, uncertainty_df)
decision_readiness = generate_decision_readiness(inputs, results, uncertainty_df)
structured_recommendation = generate_structured_recommendation(inputs, results, uncertainty_df)
overall_signal = generate_overall_signal(results, inputs, uncertainty_df)
net_cost_label = get_net_cost_label(results)
main_driver_text = get_main_driver_text(inputs)
yearly_results_table = build_yearly_results_table(results["yearly_results"])
assumptions_df = build_assumptions_table(inputs)

comparator_inputs = build_comparator_case(defaults, inputs, comparator_mode)
comparator_results = run_model(comparator_inputs)
comparator_table = build_comparator_table(results, comparator_results)

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["Overview", "Assumptions", "Sensitivity", "Scenarios", "Interpretation"]
)

with tab1:
    st.markdown("### Headline")
    st.metric("Falls avoided", format_number(results["falls_avoided_total"]))
    st.metric(net_cost_label, format_currency(abs(results["discounted_net_cost_total"])))
    st.metric("Cost per QALY", format_currency(results["discounted_cost_per_qaly"]))
    st.metric("Return on spend", format_ratio(results["roi"]))

    mini1, mini2 = st.columns(2)
    mini1.metric("People treated", format_number(results["treated_population_year_1"]))
    mini2.metric("Admissions avoided", format_number(results["admissions_avoided_total"]))

    mini3, mini4 = st.columns(2)
    mini3.metric("Bed days avoided", format_number(results["bed_days_avoided_total"]))
    mini4.metric("Max cost / participant", format_currency(results["break_even_cost_per_participant"]))

    st.metric("Required fall reduction", format_percent(results["break_even_effectiveness"]))

    st.markdown("### Decision status")
    if decision_status == "Appears cost-saving":
        st.success("Appears cost-saving")
    elif decision_status == "Appears cost-effective":
        st.info("Appears cost-effective")
    else:
        st.warning("Above threshold")

    st.markdown("### Summary")
    st.write(overview_summary)
    st.caption(f"Primary driver: {main_driver_text}")
    st.caption(f"Uncertainty readout: {assess_uncertainty_robustness(uncertainty_df, inputs['cost_effectiveness_threshold'])}")

    st.markdown("### Recommendation")
    st.markdown(f"**Overall signal**  \n{overall_signal}")
    st.markdown(f"**Main dependency**  \n{structured_recommendation['main_dependency']}")
    st.markdown(f"**Main fragility**  \n{structured_recommendation['main_fragility']}")
    st.markdown(f"**Best next step**  \n{structured_recommendation['best_next_step']}")

    st.plotly_chart(make_waterfall_chart(results), use_container_width=True)
    st.plotly_chart(make_impact_bar_chart(results), use_container_width=True)
    st.plotly_chart(make_cumulative_net_cost_chart(results["yearly_results"]), use_container_width=True)
    st.plotly_chart(make_falls_avoided_chart(results["yearly_results"]), use_container_width=True)

    with st.expander("Comparator"):
        st.plotly_chart(
            make_comparator_delta_chart(results, comparator_results, comparator_mode),
            use_container_width=True,
        )
        st.dataframe(comparator_table, use_container_width=True, hide_index=True)

    with st.expander("Uncertainty"):
        st.plotly_chart(make_uncertainty_chart(uncertainty_df), use_container_width=True)
        st.dataframe(uncertainty_display_df, use_container_width=True, hide_index=True)

    with st.expander("Year-by-year results"):
        st.dataframe(yearly_results_table, use_container_width=True, hide_index=True)

with tab2:
    st.markdown("### Assumptions")
    st.dataframe(assumptions_df, use_container_width=True, hide_index=True)

with tab3:
    st.markdown("### Sensitivity")
    sensitivity_df = run_one_way_sensitivity(
        base_inputs=inputs,
        variables=SENSITIVITY_VARIABLES,
        variation=0.20,
        outcome_key="discounted_cost_per_qaly",
    )
    st.plotly_chart(make_tornado_chart(sensitivity_df), use_container_width=True)

    for takeaway in build_sensitivity_takeaways(sensitivity_df):
        st.write(f"- {takeaway}")

with tab4:
    st.markdown("### Scenarios")

    scenario_df = build_scenario_comparison(defaults, inputs)
    formatted_scenario_df = format_scenario_dataframe(scenario_df)

    st.dataframe(formatted_scenario_df, use_container_width=True, hide_index=True)

    with st.expander("Scenario charts"):
        st.plotly_chart(make_scenario_comparison_chart(scenario_df), use_container_width=True)
        st.plotly_chart(make_scenario_outcome_chart(scenario_df), use_container_width=True)

    st.write(summarise_scenario_strengths(scenario_df))

with tab5:
    st.markdown("### What the model suggests")
    st.write(interpretation["what_model_suggests"])

    st.markdown("### What it depends on")
    st.write(interpretation["what_drives_result"])

    st.markdown("### What looks fragile")
    st.write(interpretation["what_looks_fragile"])

    st.markdown("### What to validate next")
    st.write(interpretation["what_to_validate_next"])

    with st.expander("Decision readiness prompts"):
        for item in decision_readiness["validate_next"]:
            st.write(f"- {item}")

    st.markdown("### Limitations")
    st.write(interpretation["limitations"])

st.markdown("---")
st.caption("SafeStep mobile version — a stripped-down view for smaller screens.")