import json
from pathlib import Path

import pandas as pd
import streamlit as st

from utils.calculations import run_model
from utils.scenarios import SCENARIO_MAP
from utils.summaries import (
    generate_interpretation,
    generate_overview_summary,
    get_decision_status,
)
from utils.charts import (
    make_impact_bar_chart,
    make_scenario_comparison_chart,
    make_waterfall_chart,
)


st.set_page_config(
    page_title="SafeStep",
    page_icon="📉",
    layout="wide"
)


@st.cache_data
def load_defaults() -> dict:
    base_dir = Path(__file__).resolve().parent
    data_path = base_dir / "data" / "default_assumptions.json"
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


defaults = load_defaults()

st.caption("Health Economics Scenario Lab")
st.title("SafeStep")
st.subheader("Falls Prevention ROI Sandbox")
st.write(
    "A rapid decision sandbox for exploring the potential value of falls prevention. "
    "Change the assumptions, compare scenarios, and see what drives the result."
)

st.warning(
    "Demo only. This sandbox uses synthetic assumptions for illustrative decision support "
    "and is not a formal economic evaluation."
)

with st.sidebar:
    st.header("Scenario")
    selected_scenario = st.selectbox(
        "Scenario preset",
        list(SCENARIO_MAP.keys()),
        index=0
    )

    scenario_inputs = SCENARIO_MAP[selected_scenario](defaults)

    st.header("Population and delivery")
    eligible_population = st.number_input(
        "Eligible population", min_value=0, value=int(scenario_inputs["eligible_population"]), step=100
    )
    uptake_rate = st.slider(
        "Programme uptake", min_value=0.0, max_value=1.0, value=float(scenario_inputs["uptake_rate"]), step=0.01
    )
    adherence_rate = st.slider(
        "Programme completion", min_value=0.0, max_value=1.0, value=float(scenario_inputs["adherence_rate"]), step=0.01
    )
    time_horizon_years = st.number_input(
        "Time horizon (years)", min_value=1, value=int(scenario_inputs["time_horizon_years"]), step=1
    )

    st.header("Risk and activity")
    annual_fall_risk = st.slider(
        "Annual fall risk", min_value=0.0, max_value=1.0, value=float(scenario_inputs["annual_fall_risk"]), step=0.01
    )
    admission_rate_after_fall = st.slider(
        "Falls leading to admission", min_value=0.0, max_value=1.0,
        value=float(scenario_inputs["admission_rate_after_fall"]), step=0.01
    )
    average_length_of_stay = st.number_input(
        "Average length of stay", min_value=0.0, value=float(scenario_inputs["average_length_of_stay"]), step=0.5
    )

    st.header("Intervention")
    intervention_cost_per_person = st.number_input(
        "Cost per participant", min_value=0.0,
        value=float(scenario_inputs["intervention_cost_per_person"]), step=10.0
    )
    relative_risk_reduction = st.slider(
        "Reduction in falls", min_value=0.0, max_value=1.0,
        value=float(scenario_inputs["relative_risk_reduction"]), step=0.01
    )

    st.header("Economic assumptions")
    cost_per_admission = st.number_input(
        "Cost per admission", min_value=0.0, value=float(scenario_inputs["cost_per_admission"]), step=100.0
    )
    cost_per_bed_day = st.number_input(
        "Cost per bed day", min_value=0.0, value=float(scenario_inputs["cost_per_bed_day"]), step=50.0
    )
    qaly_loss_per_serious_fall = st.number_input(
        "QALY loss per serious fall", min_value=0.0,
        value=float(scenario_inputs["qaly_loss_per_serious_fall"]), step=0.01
    )
    cost_effectiveness_threshold = st.number_input(
        "Cost-effectiveness threshold", min_value=0.0,
        value=float(scenario_inputs["cost_effectiveness_threshold"]), step=1000.0
    )
    discount_rate = st.number_input(
        "Discount rate", min_value=0.0,
        value=float(scenario_inputs["discount_rate"]), step=0.005, format="%.3f"
    )

inputs = {
    "eligible_population": eligible_population,
    "uptake_rate": uptake_rate,
    "adherence_rate": adherence_rate,
    "time_horizon_years": time_horizon_years,
    "annual_fall_risk": annual_fall_risk,
    "admission_rate_after_fall": admission_rate_after_fall,
    "average_length_of_stay": average_length_of_stay,
    "intervention_cost_per_person": intervention_cost_per_person,
    "relative_risk_reduction": relative_risk_reduction,
    "cost_per_admission": cost_per_admission,
    "cost_per_bed_day": cost_per_bed_day,
    "qaly_loss_per_serious_fall": qaly_loss_per_serious_fall,
    "cost_effectiveness_threshold": cost_effectiveness_threshold,
    "discount_rate": discount_rate,
}

results = run_model(inputs)
decision_status = get_decision_status(results, cost_effectiveness_threshold)
overview_summary = generate_overview_summary(results)
interpretation = generate_interpretation(results, inputs, cost_effectiveness_threshold)

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["Overview", "Assumptions", "Sensitivity", "Scenarios", "Interpretation"]
)

with tab1:
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("People treated", f"{results['treated_population']:,.0f}")
    col2.metric("Falls avoided", f"{results['falls_avoided']:,.0f}")
    col3.metric("Admissions avoided", f"{results['admissions_avoided']:,.0f}")
    col4.metric("Bed days avoided", f"{results['bed_days_avoided']:,.0f}")

    col5, col6, col7, col8 = st.columns(4)
    col5.metric("Programme cost", f"£{results['programme_cost']:,.0f}")
    col6.metric("Gross savings", f"£{results['gross_savings']:,.0f}")
    col7.metric("Net cost / saving", f"£{results['net_cost']:,.0f}")
    col8.metric("Cost per QALY", f"£{results['cost_per_qaly']:,.0f}")

    col9, col10, col11, col12 = st.columns(4)
    col9.metric("ROI", f"{results['roi']:.2f}")
    col10.metric("Cost per fall avoided", f"£{results['cost_per_fall_avoided']:,.0f}")
    col11.metric("Break-even effectiveness", f"{results['break_even_effectiveness']:.1%}")
    col12.metric("Decision status", decision_status)

    st.markdown("### What this scenario suggests")
    st.write(overview_summary)

    chart_col1, chart_col2 = st.columns(2)
    with chart_col1:
        st.plotly_chart(make_waterfall_chart(results), use_container_width=True)
    with chart_col2:
        st.plotly_chart(make_impact_bar_chart(results), use_container_width=True)

with tab2:
    st.markdown("### Current assumptions")
    st.write(
        "This sandbox is driven by editable synthetic assumptions. "
        "Review the current values below before interpreting results."
    )
    assumptions_df = pd.DataFrame(
        {
            "Assumption": list(inputs.keys()),
            "Value": list(inputs.values())
        }
    )
    st.dataframe(assumptions_df, use_container_width=True)

with tab3:
    st.markdown("### What matters most")
    st.write("Sensitivity analysis placeholder for V1.")

with tab4:
    st.markdown("### Compare scenarios")
    scenario_rows = []
    for scenario_name, scenario_func in SCENARIO_MAP.items():
        scenario_inputs = scenario_func(defaults)
        scenario_results = run_model(scenario_inputs)
        scenario_rows.append(
            {
                "scenario": scenario_name,
                "falls_avoided": scenario_results["falls_avoided"],
                "admissions_avoided": scenario_results["admissions_avoided"],
                "net_cost": scenario_results["net_cost"],
                "cost_per_qaly": scenario_results["cost_per_qaly"],
            }
        )

    scenario_df = pd.DataFrame(scenario_rows)
    st.dataframe(scenario_df, use_container_width=True)
    st.plotly_chart(make_scenario_comparison_chart(scenario_df), use_container_width=True)

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
    "SafeStep is part of the Health Economics Scenario Lab — a series of interactive "
    "decision sandboxes for exploring value under uncertainty."
)
