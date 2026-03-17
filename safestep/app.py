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
    make_cumulative_costs_chart,
    make_cumulative_net_cost_chart,
    make_falls_avoided_chart,
    make_impact_bar_chart,
    make_scenario_comparison_chart,
    make_scenario_outcome_chart,
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
    get_assumption_confidence_summary,
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
    summarise_scenario_strengths,
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
        value = inputs[key]
        meta = ASSUMPTION_META[key]
        rows.append(
            {
                "Assumption": meta["label"],
                "Value": meta["formatter"](value),
                "Unit": meta["unit"],
                "Source type": meta["source_type"],
                "Confidence": meta["confidence"],
                "Notes": meta["description"],
            }
        )
    return pd.DataFrame(rows)


def build_yearly_results_table(yearly_df: pd.DataFrame) -> pd.DataFrame:
    display_df = yearly_df.copy()
    display_df = display_df.rename(
        columns={
            "year": "Year",
            "treated_population": "People treated",
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
        "People treated",
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


def build_uncertainty_table(uncertainty_df: pd.DataFrame) -> pd.DataFrame:
    display_df = uncertainty_df.copy()
    display_df = display_df.rename(
        columns={
            "case": "Case",
            "falls_avoided_total": "Falls avoided",
            "discounted_net_cost_total": "Discounted net cost",
            "discounted_cost_per_qaly": "Discounted cost per QALY",
            "decision_status": "Decision status",
            "dominant_domain": "Main uncertainty domain",
        }
    )

    display_df["Falls avoided"] = display_df["Falls avoided"].apply(format_number)
    display_df["Discounted net cost"] = display_df["Discounted net cost"].apply(format_currency)
    display_df["Discounted cost per QALY"] = display_df["Discounted cost per QALY"].apply(format_currency)
    return display_df


def build_scenario_comparison(defaults: dict, base_inputs: dict) -> pd.DataFrame:
    rows = []
    for scenario_name, scenario_func in SCENARIO_MAP.items():
        scenario_inputs = defaults.copy()
        scenario_inputs.update(scenario_func(defaults))

        scenario_inputs["time_horizon_years"] = base_inputs["time_horizon_years"]
        scenario_inputs["discount_rate"] = base_inputs["discount_rate"]
        scenario_inputs["effect_decay_rate"] = base_inputs["effect_decay_rate"]
        scenario_inputs["participation_dropoff_rate"] = base_inputs["participation_dropoff_rate"]
        scenario_inputs["costing_method"] = base_inputs["costing_method"]

        scenario_results = run_model(scenario_inputs)

        rows.append(
            {
                "Scenario": scenario_name,
                "Targeting": scenario_inputs["targeting_mode"],
                "Falls avoided": scenario_results["falls_avoided_total"],
                "Admissions avoided": scenario_results["admissions_avoided_total"],
                "Programme cost": scenario_results["programme_cost_total"],
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

    for col in ["Falls avoided", "Admissions avoided"]:
        if col in formatted.columns:
            formatted[col] = formatted[col].apply(format_number)

    for col in ["Programme cost", "Discounted net cost", "Discounted cost per QALY"]:
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


def build_comparator_table(base_results: dict, comparator_results: dict) -> pd.DataFrame:
    rows = [
        {
            "Metric": "Falls avoided",
            "Current selection": format_number(base_results["falls_avoided_total"]),
            "Comparator": format_number(comparator_results["falls_avoided_total"]),
            "Delta": format_number(comparator_results["falls_avoided_total"] - base_results["falls_avoided_total"]),
        },
        {
            "Metric": "Discounted net cost",
            "Current selection": format_currency(base_results["discounted_net_cost_total"]),
            "Comparator": format_currency(comparator_results["discounted_net_cost_total"]),
            "Delta": format_currency(comparator_results["discounted_net_cost_total"] - base_results["discounted_net_cost_total"]),
        },
        {
            "Metric": "Discounted cost per QALY",
            "Current selection": format_currency(base_results["discounted_cost_per_qaly"]),
            "Comparator": format_currency(comparator_results["discounted_cost_per_qaly"]),
            "Delta": format_currency(comparator_results["discounted_cost_per_qaly"] - base_results["discounted_cost_per_qaly"]),
        },
    ]
    return pd.DataFrame(rows)


defaults = load_defaults()

st.caption("Health Economics Scenario Lab - Author: Oliver Carey")
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
    participation_dropoff_rate = st.slider(
        "Annual participation drop-off",
        min_value=0.0,
        max_value=0.5,
        value=float(scenario_inputs.get("participation_dropoff_rate", defaults["participation_dropoff_rate"])),
        step=0.01,
    )

    st.header("Targeting and risk")
    targeting_mode = st.selectbox(
        "Targeting mode",
        TARGETING_MODE_OPTIONS,
        index=TARGETING_MODE_OPTIONS.index(
            scenario_inputs.get("targeting_mode", defaults["targeting_mode"])
        ),
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
        value=float(scenario_inputs.get("effect_decay_rate", defaults["effect_decay_rate"])),
        step=0.01,
    )

    st.header("Economic assumptions")
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

    st.header("Comparator")
    comparator_mode = st.selectbox(
        "Compare current selection with",
        [
            "Higher-risk targeting",
            "Tighter high-risk targeting",
            "Lower-cost delivery",
            "Stronger effect",
            "Targeted and stronger effect",
        ],
        index=0,
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
uncertainty_robustness = assess_uncertainty_robustness(
    uncertainty_df,
    inputs["cost_effectiveness_threshold"],
)

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
confidence_summary = get_assumption_confidence_summary()

comparator_inputs = build_comparator_case(defaults, inputs, comparator_mode)
comparator_results = run_model(comparator_inputs)
comparator_table = build_comparator_table(results, comparator_results)

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["Overview", "Assumptions", "Sensitivity", "Scenarios", "Interpretation"]
)

with tab1:
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("People treated", format_number(results["treated_population_year_1"]))
    col2.metric("Falls avoided", format_number(results["falls_avoided_total"]))
    col3.metric("Admissions avoided", format_number(results["admissions_avoided_total"]))
    col4.metric("Bed days avoided", format_number(results["bed_days_avoided_total"]))

    col5, col6, col7, col8 = st.columns(4)
    col5.metric("Programme cost", format_currency(results["programme_cost_total"]))
    col6.metric("Gross savings", format_currency(results["gross_savings_total"]))
    col7.metric(net_cost_label, format_currency(abs(results["discounted_net_cost_total"])))
    col8.metric("Discounted cost per QALY", format_currency(results["discounted_cost_per_qaly"]))

    col9, col10, col11 = st.columns(3)
    col9.metric("Return on spend", format_ratio(results["roi"]))
    col10.metric("Max cost per participant", format_currency(results["break_even_cost_per_participant"]))
    col11.metric("Required fall reduction", format_percent(results["break_even_effectiveness"]))

    st.markdown("### Decision status")
    if decision_status == "Appears cost-saving":
        st.success("Appears cost-saving")
        st.caption(
            "The model suggests the programme generates net savings under the current assumptions and selected horizon."
        )
    elif decision_status == "Appears cost-effective":
        st.info("Appears cost-effective")
        st.caption(
            "The model suggests the programme is below the current cost-effectiveness threshold, but not cost-saving."
        )
    else:
        st.warning("Above threshold")
        st.caption(
            "The model suggests the programme delivers benefit, but remains above the current threshold under the selected assumptions."
        )

    st.markdown("### Structured recommendation")
    rec1, rec2 = st.columns(2)
    with rec1:
        st.markdown(f"**Overall signal**  \n{overall_signal}")
        st.markdown(f"**Main dependency**  \n{structured_recommendation['main_dependency']}")
    with rec2:
        st.markdown(f"**Main fragility**  \n{structured_recommendation['main_fragility']}")
        st.markdown(f"**Best next analytical step**  \n{structured_recommendation['best_next_step']}")

    st.markdown("### What this scenario suggests")
    st.write(overview_summary)

    info_col1, info_col2 = st.columns(2)
    with info_col1:
        st.info(f"Primary economic driver: {main_driver_text}")
    with info_col2:
        st.info(f"Uncertainty readout: {uncertainty_robustness}")

    if inputs["costing_method"] == "Combined illustrative view":
        st.caption(
            "Combined illustrative view adds admission cost savings and bed-day value together. This is useful for exploration, but may overstate value if local costing assumptions already overlap."
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

    st.markdown("### Comparator view")
    st.write(
        f"Current selection versus **{comparator_mode}** using the same time horizon, costing method, and uncertainty framing."
    )
    comp_col1, comp_col2, comp_col3 = st.columns(3)
    comp_col1.metric(
        "Falls avoided delta",
        format_number(comparator_results["falls_avoided_total"] - results["falls_avoided_total"]),
    )
    comp_col2.metric(
        "Discounted net cost delta",
        format_currency(comparator_results["discounted_net_cost_total"] - results["discounted_net_cost_total"]),
    )
    comp_col3.metric(
        "Discounted cost per QALY delta",
        format_currency(comparator_results["discounted_cost_per_qaly"] - results["discounted_cost_per_qaly"]),
    )
    st.plotly_chart(
        make_comparator_delta_chart(results, comparator_results, comparator_mode),
        use_container_width=True,
    )
    st.dataframe(comparator_table, use_container_width=True, hide_index=True)

    st.markdown("### Threshold analysis")
    threshold_col1, threshold_col2, threshold_col3 = st.columns(3)
    threshold_col1.metric(
        "Max cost per participant",
        format_currency(results["break_even_cost_per_participant"]),
    )
    threshold_col2.metric(
        "Minimum horizon to threshold",
        results["break_even_horizon"],
    )
    threshold_col3.metric(
        "Required fall reduction",
        format_percent(results["break_even_effectiveness"]),
    )

    st.markdown("### Bounded uncertainty")
    st.write(
        "These low, base, and high cases give a simple deterministic view of how fragile or robust the result looks under a bounded change in key assumptions."
    )
    st.plotly_chart(make_uncertainty_chart(uncertainty_df), use_container_width=True)
    st.dataframe(uncertainty_display_df, use_container_width=True, hide_index=True)

    st.markdown("### Decision readiness")
    for item in decision_readiness["validate_next"]:
        st.write(f"- {item}")
    st.caption(decision_readiness["readiness_note"])

    st.markdown("### Year-by-year results")
    st.dataframe(yearly_results_table, use_container_width=True, hide_index=True)

with tab2:
    st.markdown("### Current assumptions")
    st.write(
        "This sandbox is driven by editable synthetic assumptions. Review the current values below before interpreting results."
    )
    st.dataframe(assumptions_df, use_container_width=True, hide_index=True)

    st.markdown("### Assumption confidence summary")
    conf1, conf2, conf3 = st.columns(3)
    conf1.metric("High confidence", str(confidence_summary["High confidence"]))
    conf2.metric("Medium confidence", str(confidence_summary["Medium confidence"]))
    conf3.metric("Low confidence", str(confidence_summary["Low confidence"]))
    st.caption(
        "Confidence and source tags are simple metadata cues to improve transparency. They are not a formal evidence appraisal."
    )

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
        "These preset scenarios illustrate how different targeting and delivery choices change the case for falls prevention over the selected horizon."
    )

    scenario_df = build_scenario_comparison(defaults, inputs)
    formatted_scenario_df = format_scenario_dataframe(scenario_df)
    best_scenarios = get_best_scenario_text(scenario_df)
    scenario_strengths = summarise_scenario_strengths(scenario_df)

    summary_col1, summary_col2, summary_col3 = st.columns(3)
    with summary_col1:
        if best_scenarios["best_cost_effective"] is not None:
            st.metric(
                "Best for value",
                best_scenarios["best_cost_effective"]["Scenario"],
                format_currency(best_scenarios["best_cost_effective"]["Discounted cost per QALY"]),
            )
        else:
            st.metric("Best for value", "Not available", "No positive QALY result")

    with summary_col2:
        st.metric(
            "Best for efficiency",
            best_scenarios["best_net_cost"]["Scenario"],
            format_currency(best_scenarios["best_net_cost"]["Discounted net cost"]),
        )

    with summary_col3:
        st.metric(
            "Best for impact",
            best_scenarios["best_health_gain"]["Scenario"],
            format_number(best_scenarios["best_health_gain"]["Falls avoided"]) + " falls avoided",
        )

    st.dataframe(formatted_scenario_df, use_container_width=True, hide_index=True)

    chart_col1, chart_col2 = st.columns(2)
    with chart_col1:
        st.plotly_chart(make_scenario_comparison_chart(scenario_df), use_container_width=True)
    with chart_col2:
        st.plotly_chart(make_scenario_outcome_chart(scenario_df), use_container_width=True)

    st.markdown("#### Scenario interpretation")
    st.write(scenario_strengths)

with tab5:
    st.markdown("### What the model suggests")
    st.write(interpretation["what_model_suggests"])

    st.markdown("### What the result depends on")
    st.write(interpretation["what_drives_result"])

    st.markdown("### What looks fragile")
    st.write(interpretation["what_looks_fragile"])

    st.markdown("### What to validate next")
    st.write(interpretation["what_to_validate_next"])

    st.markdown("### What this sandbox does not capture")
    st.write(interpretation["limitations"])

st.markdown("---")
st.caption(
    "SafeStep is part of the Health Economics Scenario Lab — a series of interactive decision sandboxes for exploring value under uncertainty."
)
