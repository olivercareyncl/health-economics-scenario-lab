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
    make_impact_bar_chart,
    make_scenario_comparison_chart,
    make_scenario_outcome_chart,
    make_stabilised_patients_chart,
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
    COMPARATOR_OPTIONS,
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
    page_title="FrailtyForward",
    page_icon="🏡",
    layout="wide",
)


@st.cache_data
def load_defaults() -> dict:
    base_dir = Path(__file__).resolve().parent
    data_path = base_dir / "data" / "default_assumptions.json"

    fallback_defaults = {
        "annual_frailty_cohort_size": 1500,
        "baseline_crisis_event_rate": 0.35,
        "baseline_non_elective_admission_rate": 0.22,
        "current_average_length_of_stay": 6.0,
        "implementation_reach_rate": 0.60,
        "reduction_in_crisis_event_rate": 0.12,
        "reduction_in_admission_rate": 0.10,
        "reduction_in_length_of_stay": 0.08,
        "support_cost_per_patient": 350.0,
        "effect_decay_rate": 0.10,
        "participation_dropoff_rate": 0.05,
        "cost_per_crisis_event": 900.0,
        "cost_per_admission": 4200.0,
        "cost_per_bed_day": 400.0,
        "costing_method": "Admission and crisis savings only",
        "qaly_gain_per_patient_stabilised": 0.05,
        "targeting_mode": "Broad frailty cohort",
        "time_horizon_years": 3,
        "discount_rate": 0.035,
        "cost_effectiveness_threshold": 20000.0,
    }

    try:
        with open(data_path, "r", encoding="utf-8") as f:
            loaded = json.load(f)
        fallback_defaults.update(loaded)
    except FileNotFoundError:
        pass

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
            "patients_stabilised": "Patients stabilised",
            "crisis_events_avoided": "Crisis events avoided",
            "admissions_avoided": "Admissions avoided",
            "bed_days_avoided": "Bed days avoided",
            "programme_cost": "Programme cost",
            "gross_savings": "Gross savings",
            "net_cost": "Net cost",
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
        "Patients stabilised",
        "Crisis events avoided",
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
            "patients_stabilised_total": "Patients stabilised",
            "discounted_net_cost_total": "Discounted net cost",
            "discounted_cost_per_qaly": "Discounted cost per QALY",
            "decision_status": "Decision status",
            "dominant_domain": "Main uncertainty domain",
        }
    )
    display_df["Patients stabilised"] = display_df["Patients stabilised"].apply(format_number)
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
        scenario_inputs["cost_per_crisis_event"] = base_inputs["cost_per_crisis_event"]
        scenario_inputs["cost_per_admission"] = base_inputs["cost_per_admission"]
        scenario_inputs["cost_per_bed_day"] = base_inputs["cost_per_bed_day"]
        scenario_inputs["qaly_gain_per_patient_stabilised"] = base_inputs["qaly_gain_per_patient_stabilised"]
        scenario_inputs["cost_effectiveness_threshold"] = base_inputs["cost_effectiveness_threshold"]

        scenario_results = run_model(scenario_inputs)

        rows.append(
            {
                "Scenario": scenario_name,
                "Targeting": scenario_inputs["targeting_mode"],
                "Patients stabilised": scenario_results["patients_stabilised_total"],
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

    for col in ["Patients stabilised", "Admissions avoided"]:
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
    best_health_gain = df.loc[df["Patients stabilised"].idxmax()]

    return {
        "best_cost_effective": best_cost_effective,
        "best_net_cost": best_net_cost,
        "best_health_gain": best_health_gain,
    }


def build_comparator_table(base_results: dict, comparator_results: dict) -> pd.DataFrame:
    rows = [
        {
            "Metric": "Patients stabilised",
            "Current selection": format_number(base_results["patients_stabilised_total"]),
            "Comparator": format_number(comparator_results["patients_stabilised_total"]),
            "Delta": format_number(
                comparator_results["patients_stabilised_total"] - base_results["patients_stabilised_total"]
            ),
        },
        {
            "Metric": "Admissions avoided",
            "Current selection": format_number(base_results["admissions_avoided_total"]),
            "Comparator": format_number(comparator_results["admissions_avoided_total"]),
            "Delta": format_number(
                comparator_results["admissions_avoided_total"] - base_results["admissions_avoided_total"]
            ),
        },
        {
            "Metric": "Discounted net cost",
            "Current selection": format_currency(base_results["discounted_net_cost_total"]),
            "Comparator": format_currency(comparator_results["discounted_net_cost_total"]),
            "Delta": format_currency(
                comparator_results["discounted_net_cost_total"] - base_results["discounted_net_cost_total"]
            ),
        },
        {
            "Metric": "Discounted cost per QALY",
            "Current selection": format_currency(base_results["discounted_cost_per_qaly"]),
            "Comparator": format_currency(comparator_results["discounted_cost_per_qaly"]),
            "Delta": format_currency(
                comparator_results["discounted_cost_per_qaly"] - base_results["discounted_cost_per_qaly"]
            ),
        },
    ]
    return pd.DataFrame(rows)


defaults = load_defaults()

st.caption("Health Economics Scenario Lab - Author: Oliver Carey")
st.title("FrailtyForward")
st.subheader("Frailty and Community Support Value Sandbox")
st.write(
    "An interactive sandbox for testing how earlier frailty support changes crisis events, admissions, bed use, and value under different assumptions."
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

    st.header("Cohort and baseline risk")
    annual_frailty_cohort_size = st.number_input(
        "Annual frailty cohort size",
        min_value=0,
        value=int(scenario_inputs.get("annual_frailty_cohort_size", defaults["annual_frailty_cohort_size"])),
        step=50,
    )
    baseline_crisis_event_rate = st.slider(
        "Baseline crisis event rate",
        min_value=0.0,
        max_value=1.0,
        value=float(scenario_inputs.get("baseline_crisis_event_rate", defaults["baseline_crisis_event_rate"])),
        step=0.01,
    )
    baseline_non_elective_admission_rate = st.slider(
        "Baseline non-elective admission rate",
        min_value=0.0,
        max_value=1.0,
        value=float(
            scenario_inputs.get(
                "baseline_non_elective_admission_rate",
                defaults["baseline_non_elective_admission_rate"],
            )
        ),
        step=0.01,
    )
    current_average_length_of_stay = st.number_input(
        "Current average length of stay (days)",
        min_value=0.0,
        value=float(
            scenario_inputs.get("current_average_length_of_stay", defaults["current_average_length_of_stay"])
        ),
        step=0.5,
    )

    st.header("Community support assumptions")
    implementation_reach_rate = st.slider(
        "Implementation reach rate",
        min_value=0.0,
        max_value=1.0,
        value=float(
            scenario_inputs.get("implementation_reach_rate", defaults["implementation_reach_rate"])
        ),
        step=0.01,
    )
    reduction_in_crisis_event_rate = st.slider(
        "Reduction in crisis event rate",
        min_value=0.0,
        max_value=0.5,
        value=float(
            scenario_inputs.get("reduction_in_crisis_event_rate", defaults["reduction_in_crisis_event_rate"])
        ),
        step=0.01,
    )
    reduction_in_admission_rate = st.slider(
        "Reduction in admission rate",
        min_value=0.0,
        max_value=0.5,
        value=float(
            scenario_inputs.get("reduction_in_admission_rate", defaults["reduction_in_admission_rate"])
        ),
        step=0.01,
    )
    reduction_in_length_of_stay = st.slider(
        "Reduction in length of stay",
        min_value=0.0,
        max_value=0.5,
        value=float(
            scenario_inputs.get("reduction_in_length_of_stay", defaults["reduction_in_length_of_stay"])
        ),
        step=0.01,
    )
    support_cost_per_patient = st.number_input(
        "Support cost per patient",
        min_value=0.0,
        value=float(scenario_inputs.get("support_cost_per_patient", defaults["support_cost_per_patient"])),
        step=10.0,
    )
    effect_decay_rate = st.slider(
        "Annual effect decay",
        min_value=0.0,
        max_value=0.5,
        value=float(scenario_inputs.get("effect_decay_rate", defaults["effect_decay_rate"])),
        step=0.01,
    )
    participation_dropoff_rate = st.slider(
        "Annual participation / persistence drop-off",
        min_value=0.0,
        max_value=0.5,
        value=float(
            scenario_inputs.get("participation_dropoff_rate", defaults["participation_dropoff_rate"])
        ),
        step=0.01,
    )

    st.header("Cost assumptions")
    cost_per_crisis_event = st.number_input(
        "Cost per crisis event",
        min_value=0.0,
        value=float(scenario_inputs.get("cost_per_crisis_event", defaults["cost_per_crisis_event"])),
        step=50.0,
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
        step=25.0,
    )
    costing_method = st.selectbox(
        "Costing method",
        COSTING_METHOD_OPTIONS,
        index=COSTING_METHOD_OPTIONS.index(
            scenario_inputs.get("costing_method", defaults["costing_method"])
        ),
    )

    st.header("Outcome assumptions")
    qaly_gain_per_patient_stabilised = st.number_input(
        "QALY gain per patient meaningfully stabilised",
        min_value=0.0,
        value=float(
            scenario_inputs.get(
                "qaly_gain_per_patient_stabilised",
                defaults["qaly_gain_per_patient_stabilised"],
            )
        ),
        step=0.01,
    )

    st.header("Strategy assumptions")
    targeting_mode = st.selectbox(
        "Targeting mode",
        TARGETING_MODE_OPTIONS,
        index=TARGETING_MODE_OPTIONS.index(
            scenario_inputs.get("targeting_mode", defaults["targeting_mode"])
        ),
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
    cost_effectiveness_threshold = st.number_input(
        "Cost-effectiveness threshold",
        min_value=0.0,
        value=float(scenario_inputs.get("cost_effectiveness_threshold", 20000.0)),
        step=1000.0,
    )

    st.header("Comparator")
    comparator_mode = st.selectbox(
        "Compare current selection with",
        COMPARATOR_OPTIONS,
        index=0,
    )

inputs = {
    "annual_frailty_cohort_size": annual_frailty_cohort_size,
    "baseline_crisis_event_rate": baseline_crisis_event_rate,
    "baseline_non_elective_admission_rate": baseline_non_elective_admission_rate,
    "current_average_length_of_stay": current_average_length_of_stay,
    "implementation_reach_rate": implementation_reach_rate,
    "reduction_in_crisis_event_rate": reduction_in_crisis_event_rate,
    "reduction_in_admission_rate": reduction_in_admission_rate,
    "reduction_in_length_of_stay": reduction_in_length_of_stay,
    "support_cost_per_patient": support_cost_per_patient,
    "effect_decay_rate": effect_decay_rate,
    "participation_dropoff_rate": participation_dropoff_rate,
    "cost_per_crisis_event": cost_per_crisis_event,
    "cost_per_admission": cost_per_admission,
    "cost_per_bed_day": cost_per_bed_day,
    "costing_method": costing_method,
    "qaly_gain_per_patient_stabilised": qaly_gain_per_patient_stabilised,
    "targeting_mode": targeting_mode,
    "time_horizon_years": time_horizon_years,
    "discount_rate": discount_rate,
    "cost_effectiveness_threshold": cost_effectiveness_threshold,
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
    col1.metric("Patients stabilised", format_number(results["patients_stabilised_total"]))
    col2.metric("Crisis events avoided", format_number(results["crisis_events_avoided_total"]))
    col3.metric("Admissions avoided", format_number(results["admissions_avoided_total"]))
    col4.metric("Bed days avoided", format_number(results["bed_days_avoided_total"]))

    col5, col6, col7, col8 = st.columns(4)
    col5.metric("Programme cost", format_currency(results["programme_cost_total"]))
    col6.metric("Gross savings", format_currency(results["gross_savings_total"]))
    col7.metric(net_cost_label, format_currency(abs(results["discounted_net_cost_total"])))
    col8.metric("Discounted cost per QALY", format_currency(results["discounted_cost_per_qaly"]))

    col9, col10, col11 = st.columns(3)
    col9.metric("Return on spend", format_ratio(results["roi"]))
    col10.metric("Max support cost per patient", format_currency(results["break_even_cost_per_patient"]))
    col11.metric("Required support effect", format_percent(results["break_even_effect_required"]))

    st.markdown("### Decision status")
    if decision_status == "Appears cost-saving":
        st.success("Appears cost-saving")
        st.caption(
            "The model suggests the support model generates discounted net savings under the current assumptions and selected horizon."
        )
    elif decision_status == "Appears cost-effective":
        st.info("Appears cost-effective")
        st.caption(
            "The model suggests the support model is below the current cost-effectiveness threshold, but not cost-saving."
        )
    else:
        st.warning("Above current threshold")
        st.caption(
            "The model suggests the support model delivers benefit, but remains above the current threshold under the selected assumptions."
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
            "Combined illustrative view adds crisis, admission, and bed-day effects together. This is useful for exploration, but may overstate value if local costing assumptions overlap."
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

    st.plotly_chart(make_stabilised_patients_chart(results["yearly_results"]), use_container_width=True)

    st.markdown("### Comparator view")
    st.write(
        f"Current selection versus **{comparator_mode}** using the same time horizon, costing method, and uncertainty framing."
    )
    comp_col1, comp_col2, comp_col3 = st.columns(3)
    comp_col1.metric(
        "Patients stabilised delta",
        format_number(comparator_results["patients_stabilised_total"] - results["patients_stabilised_total"]),
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
        "Max support cost per patient",
        format_currency(results["break_even_cost_per_patient"]),
    )
    threshold_col2.metric(
        "Minimum horizon to threshold",
        results["break_even_horizon"],
    )
    threshold_col3.metric(
        "Required support effect",
        format_percent(results["break_even_effect_required"]),
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
        "These preset scenarios illustrate how different frailty support strategies change value over the selected horizon."
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
            format_number(best_scenarios["best_health_gain"]["Patients stabilised"]) + " stabilised",
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
    "FrailtyForward is part of the Health Economics Scenario Lab — a series of interactive decision sandboxes for exploring value under uncertainty."
)
