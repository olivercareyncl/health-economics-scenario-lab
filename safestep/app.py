import json
from pathlib import Path

import pandas as pd
import streamlit as st

from utils.calculations import run_model
from utils.charts import (
    make_cumulative_costs_chart,
    make_cumulative_net_cost_chart,
    make_falls_avoided_chart,
    make_impact_bar_chart,
    make_scenario_comparison_chart,
    make_scenario_outcome_chart,
    make_tornado_chart,
    make_waterfall_chart,
)
from utils.formatters import (
    format_currency,
    format_number,
    format_percent,
    format_ratio,
)
from utils.metadata import ASSUMPTION_META, ASSUMPTION_ORDER
from utils.scenarios import SCENARIO_MAP
from utils.sensitivity import (
    SENSITIVITY_VARIABLES,
    build_sensitivity_takeaways,
    run_one_way_sensitivity,
)
from utils.summaries import (
    generate_interpretation,
    generate_overview_summary,
    get_decision_status,
    get_main_driver_text,
    get_net_cost_label,
)

st.set_page_config(
    page_title="SafeStep",
    page_icon="🩺",
    layout="wide",
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
        "cost_per_admission": 3500,
        "cost_per_bed_day": 400,
        "qaly_loss_per_serious_fall": 0.05,
        "cost_effectiveness_threshold": 20000,
        "time_horizon_years": 3,
        "discount_rate": 0.035,
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
        value = inputs[key]
        meta = ASSUMPTION_META[key]
        rows.append(
            {
                "Assumption": meta["label"],
                "Value": meta["formatter"](value),
                "Unit": meta["unit"],
                "Notes": meta["description"],
            }
        )
    return pd.DataFrame(rows)


def build_yearly_results_table(yearly_df: pd.DataFrame) -> pd.DataFrame:
    display_df = yearly_df.copy()
    display_df = display_df.rename(
        columns={
            "year": "Year",
            "programme_cost": "Programme cost",
            "gross_savings": "Gross savings",
            "net_cost": "Net cost",
            "falls_avoided": "Falls avoided",
            "admissions_avoided": "Admissions avoided",
            "bed_days_avoided": "Bed days avoided",
            "qalys_gained": "QALYs gained",
            "discounted_net_cost": "Discounted net cost",
            "cumulative_net_cost": "Cumulative net cost",
        }
    )

    currency_cols = [
        "Programme cost",
        "Gross savings",
        "Net cost",
        "Discounted net cost",
        "Cumulative net cost",
    ]
    number_cols = [
        "Falls avoided",
        "Admissions avoided",
        "Bed days avoided",
    ]

    for col in currency_cols:
        if col in display_df.columns:
            display_df[col] = display_df[col].apply(format_currency)

    for col in number_cols:
        if col in display_df.columns:
            display_df[col] = display_df[col].apply(format_number)

    if "QALYs gained" in display_df.columns:
        display_df["QALYs gained"] = display_df["QALYs gained"].apply(lambda x: f"{x:,.2f}")

    return display_df


def build_scenario_comparison(defaults: dict, base_inputs: dict) -> pd.DataFrame:
    rows = []
    for scenario_name, scenario_func in SCENARIO_MAP.items():
        scenario_inputs = defaults.copy()
        scenario_inputs.update(scenario_func(defaults))

        scenario_inputs["time_horizon_years"] = base_inputs["time_horizon_years"]
        scenario_inputs["discount_rate"] = base_inputs["discount_rate"]
        scenario_inputs["effect_decay_rate"] = base_inputs["effect_decay_rate"]

        scenario_results = run_model(scenario_inputs)

        rows.append(
            {
                "Scenario": scenario_name,
                "People treated": scenario_results["treated_population"],
                "Falls avoided": scenario_results["falls_avoided_total"],
                "Admissions avoided": scenario_results["admissions_avoided_total"],
                "Bed days avoided": scenario_results["bed_days_avoided_total"],
                "Programme cost": scenario_results["programme_cost_total"],
                "Gross savings": scenario_results["gross_savings_total"],
                "Discounted net cost": scenario_results["discounted_net_cost_total"],
                "Discounted cost per QALY": scenario_results["discounted_cost_per_qaly"],
                "Decision status": get_decision_status(
                    scenario_results,
                    scenario_inputs["cost_effectiveness_threshold"],
                ),
            }
        )

    return pd.DataFrame(rows)


def format_scenario_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    formatted = df.copy()

    for col in ["People treated", "Falls avoided", "Admissions avoided", "Bed days avoided"]:
        if col in formatted.columns:
            formatted[col] = formatted[col].apply(format_number)

    for col in ["Programme cost", "Gross savings", "Discounted net cost", "Discounted cost per QALY"]:
        if col in formatted.columns:
            formatted[col] = formatted[col].apply(format_currency)

    return formatted


def get_best_scenario_text(df: pd.DataFrame) -> dict:
    valid_qaly_df = df[df["Discounted cost per QALY"] > 0].copy()

    if valid_qaly_df.empty:
        best_cost_effective = None
    else:
        best_cost_effective = valid_qaly_df.loc[valid_qaly_df["Discounted cost per QALY"].idxmin()]

    best_net_cost = df.loc[df["Discounted net cost"].idxmin()]
    best_health_gain = df.loc[df["Falls avoided"].idxmax()]

    return {
        "best_cost_effective": best_cost_effective,
        "best_net_cost": best_net_cost,
        "best_health_gain": best_health_gain,
    }


defaults = load_defaults()

st.caption("Health Economics Scenario Lab")
st.title("SafeStep")
st.subheader("Falls Prevention ROI Sandbox")
st.write(
    "An interactive sandbox for testing the economic case for falls prevention under different assumptions."
)

st.warning(
    "Demo only. This sandbox uses synthetic assumptions for illustrative decision support and is not a formal economic evaluation."
)

with st.sidebar:
    st.header("Scenario")
    selected_scenario = st.selectbox(
        "Scenario preset",
        list(SCENARIO_MAP.keys()),
        index=0,
    )

    scenario_inputs = defaults.copy()
    scenario_inputs.update(SCENARIO_MAP[selected_scenario](defaults))

    st.header("Population and delivery")
    eligible_population = st.number_input(
        "Eligible population",
        min_value=0,
        value=int(scenario_inputs.get("eligible_population", defaults["eligible_population"])),
        step=100,
    )
    uptake_rate = st.slider(
        "Programme uptake",
        min_value=0.0,
        max_value=1.0,
        value=float(scenario_inputs.get("uptake_rate", defaults["uptake_rate"])),
        step=0.01,
    )
    adherence_rate = st.slider(
        "Programme completion",
        min_value=0.0,
        max_value=1.0,
        value=float(scenario_inputs.get("adherence_rate", defaults["adherence_rate"])),
        step=0.01,
    )

    st.header("Risk and activity")
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
        "Average length of stay (days)",
        min_value=0.0,
        value=float(scenario_inputs.get("average_length_of_stay", defaults["average_length_of_stay"])),
        step=0.5,
    )

    st.header("Intervention")
    intervention_cost_per_person = st.number_input(
        "Cost per participant",
        min_value=0.0,
        value=float(scenario_inputs.get("intervention_cost_per_person", defaults["intervention_cost_per_person"])),
        step=10.0,
    )
    relative_risk_reduction = st.slider(
        "Reduction in falls",
        min_value=0.0,
        max_value=1.0,
        value=float(scenario_inputs.get("relative_risk_reduction", defaults["relative_risk_reduction"])),
        step=0.01,
    )
    effect_decay_rate = st.slider(
        "Annual effect decay",
        min_value=0.0,
        max_value=0.5,
        value=float(scenario_inputs.get("effect_decay_rate", defaults.get("effect_decay_rate", 0.1))),
        step=0.01,
    )

    st.header("Economic assumptions")
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
        "QALY loss per serious fall",
        min_value=0.0,
        value=float(scenario_inputs.get("qaly_loss_per_serious_fall", defaults["qaly_loss_per_serious_fall"])),
        step=0.01,
    )
    cost_effectiveness_threshold = st.number_input(
        "Cost-effectiveness threshold",
        min_value=0.0,
        value=float(scenario_inputs.get("cost_effectiveness_threshold", defaults["cost_effectiveness_threshold"])),
        step=1000.0,
    )

    st.header("Time horizon")
    time_horizon_value = int(scenario_inputs.get("time_horizon_years", defaults.get("time_horizon_years", 3)))
    if time_horizon_value not in [1, 3, 5]:
        time_horizon_value = 3

    time_horizon_years = st.selectbox(
        "Time horizon",
        options=[1, 3, 5],
        index=[1, 3, 5].index(time_horizon_value),
    )
    discount_rate = st.number_input(
        "Discount rate",
        min_value=0.0,
        value=float(scenario_inputs.get("discount_rate", defaults.get("discount_rate", 0.035))),
        step=0.005,
        format="%.3f",
    )

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
    "cost_per_admission": cost_per_admission,
    "cost_per_bed_day": cost_per_bed_day,
    "qaly_loss_per_serious_fall": qaly_loss_per_serious_fall,
    "cost_effectiveness_threshold": cost_effectiveness_threshold,
    "time_horizon_years": time_horizon_years,
    "discount_rate": discount_rate,
}

results = run_model(inputs)
decision_status = get_decision_status(results, cost_effectiveness_threshold)
overview_summary = generate_overview_summary(results, inputs)
interpretation = generate_interpretation(results, inputs)
net_cost_label = get_net_cost_label(results)
main_driver_text = get_main_driver_text(inputs)
yearly_results_table = build_yearly_results_table(results["yearly_results"])

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["Overview", "Assumptions", "Sensitivity", "Scenarios", "Interpretation"]
)

with tab1:
    col1, col2, col3 = st.columns(3)
    col1.metric("People treated", format_number(results["treated_population"]))
    col2.metric("Falls avoided", format_number(results["falls_avoided_total"]))
    col3.metric("Admissions avoided", format_number(results["admissions_avoided_total"]))
    col4.metric("Bed days avoided", format_number(results["bed_days_avoided_total"]))

    col4, col5, col6 = st.columns(3)
    col4.metric("Bed days avoided", format_number(results["bed_days_avoided_total"]))
    col5.metric("Programme cost", format_currency(results["programme_cost_total"]))
    col6.metric("Gross savings", format_currency(results["gross_savings_total"]))
    
    col7, col8, col9 = st.columns(3)
    col7.metric(net_cost_label, format_currency(abs(results["discounted_net_cost_total"])))
    col8.metric("Discounted cost per QALY", format_currency(results["discounted_cost_per_qaly"]))
    col9.metric("Return on spend", format_ratio(results["roi"]))

    col10, col11, col12 = st.columns(3)
    col10.metric("Break-even cost per participant", format_currency(results["break_even_cost_per_participant"]))
    col11.metric("Required fall reduction", format_percent(results["break_even_effectiveness"]))
    col12.metric("Decision status", decision_status)
    
    st.markdown("### What this scenario suggests")
    st.write(overview_summary)

    info_col1, info_col2 = st.columns(2)
    with info_col1:
        st.info(f"Primary economic driver: {main_driver_text}")
    with info_col2:
        if results["discounted_net_cost_total"] < 0:
            st.success("Across the selected horizon, the programme appears cost-saving.")
        elif 0 < results["discounted_cost_per_qaly"] <= inputs["cost_effectiveness_threshold"]:
            st.success(
                "Across the selected horizon, the programme appears cost-effective, but not cost-saving."
            )
        else:
            st.info(
                "Across the selected horizon, the programme delivers benefit but remains above the current threshold."
            )

    chart_col1, chart_col2 = st.columns(2)
    with chart_col1:
        st.plotly_chart(make_waterfall_chart(results), use_container_width=True)
    with chart_col2:
        st.plotly_chart(make_impact_bar_chart(results), use_container_width=True)

    time_col1, time_col2 = st.columns(2)
    with time_col1:
        st.plotly_chart(make_cumulative_costs_chart(results["yearly_results"]), use_container_width=True)
    with time_col2:
        st.plotly_chart(make_cumulative_net_cost_chart(results["yearly_results"]), use_container_width=True)

    st.plotly_chart(make_falls_avoided_chart(results["yearly_results"]), use_container_width=True)

    st.markdown("### Year-by-year results")
    st.dataframe(yearly_results_table, use_container_width=True, hide_index=True)

with tab2:
    st.markdown("### Current assumptions")
    st.write(
        "This sandbox is driven by editable synthetic assumptions. Review the current values below before interpreting results."
    )
    assumptions_df = build_assumptions_table(inputs)
    st.dataframe(assumptions_df, use_container_width=True, hide_index=True)

with tab3:
    st.markdown("### What matters most")
    st.write(
        "This view varies one assumption at a time while holding the others constant. It shows which inputs have the biggest effect on discounted cost per QALY across the selected horizon."
    )

    sensitivity_df = run_one_way_sensitivity(
        base_inputs=inputs,
        variables=SENSITIVITY_VARIABLES,
        variation=0.20,
        outcome_key="discounted_cost_per_qaly",
    )

    st.plotly_chart(make_tornado_chart(sensitivity_df), use_container_width=True)

    st.markdown("#### What the sensitivity analysis suggests")
    for takeaway in build_sensitivity_takeaways(sensitivity_df):
        st.write(f"- {takeaway}")

    st.caption(
        "Low and high values are set at ±20% around the current base case, with values constrained to sensible ranges for rate-based assumptions."
    )

with tab4:
    st.markdown("### Compare scenarios")
    st.write(
        "These preset scenarios illustrate how different delivery choices and risk profiles change the case for falls prevention over the selected horizon."
    )

    scenario_df = build_scenario_comparison(defaults, inputs)
    formatted_scenario_df = format_scenario_dataframe(scenario_df)
    best_scenarios = get_best_scenario_text(scenario_df)

    summary_col1, summary_col2, summary_col3 = st.columns(3)
    with summary_col1:
        if best_scenarios["best_cost_effective"] is not None:
            st.metric(
                "Lowest discounted cost per QALY",
                best_scenarios["best_cost_effective"]["Scenario"],
                format_currency(best_scenarios["best_cost_effective"]["Discounted cost per QALY"]),
            )
        else:
            st.metric("Lowest discounted cost per QALY", "Not available", "No positive QALY result")

    with summary_col2:
        st.metric(
            "Lowest discounted net cost",
            best_scenarios["best_net_cost"]["Scenario"],
            format_currency(best_scenarios["best_net_cost"]["Discounted net cost"]),
        )

    with summary_col3:
        st.metric(
            "Largest health gain",
            best_scenarios["best_health_gain"]["Scenario"],
            format_number(best_scenarios["best_health_gain"]["Falls avoided"]) + " falls avoided",
        )

    st.dataframe(formatted_scenario_df, use_container_width=True, hide_index=True)

    chart_col1, chart_col2 = st.columns(2)
    with chart_col1:
        st.plotly_chart(make_scenario_comparison_chart(scenario_df), use_container_width=True)
    with chart_col2:
        st.plotly_chart(make_scenario_outcome_chart(scenario_df), use_container_width=True)

    best_cost_effective = best_scenarios["best_cost_effective"]
    best_net_cost = best_scenarios["best_net_cost"]
    best_health_gain = best_scenarios["best_health_gain"]

    st.markdown("#### What the scenario comparison suggests")
    if best_cost_effective is not None:
        st.write(
            f"The strongest preset on discounted cost per QALY is **{best_cost_effective['Scenario']}**, while **{best_net_cost['Scenario']}** has the lowest discounted net cost and **{best_health_gain['Scenario']}** delivers the largest reduction in falls."
        )
    else:
        st.write(
            f"Across the current presets, **{best_net_cost['Scenario']}** has the lowest discounted net cost and **{best_health_gain['Scenario']}** delivers the largest reduction in falls."
        )

    st.write(
        "In practice, this means the most economically attractive scenario is not always the one with the largest headline impact. Time horizon, effect persistence, and targeting all shape the result."
    )

with tab5:
    st.markdown("### What the model suggests")
    st.write(interpretation["what_model_suggests"])

    st.markdown("### What is driving the result")
    st.write(interpretation["what_drives_result"])

    st.markdown("### What would improve the case")
    st.write(interpretation["what_improves_case"])

    st.markdown("### What this sandbox does not capture")
    st.write(interpretation["limitations"])

st.markdown("---")
st.caption(
    "SafeStep is part of the Health Economics Scenario Lab — a series of interactive decision sandboxes for exploring value under uncertainty."
)
