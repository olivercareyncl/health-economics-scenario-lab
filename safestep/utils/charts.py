import pandas as pd
import plotly.graph_objects as go


def make_waterfall_chart(results: dict):
    fig = go.Figure(
        go.Waterfall(
            name="Financial impact",
            orientation="v",
            measure=["absolute", "relative", "total"],
            x=["Programme cost", "Gross savings", "Net impact"],
            y=[
                results["programme_cost"],
                -results["gross_savings"],
                0
            ],
            text=[
                f"£{results['programme_cost']:,.0f}",
                f"£{results['gross_savings']:,.0f}",
                f"£{results['net_cost']:,.0f}"
            ],
            textposition="outside",
        )
    )
    fig.update_layout(
        title="Programme cost and savings",
        showlegend=False,
        height=450
    )
    return fig


def make_impact_bar_chart(results: dict):
    categories = ["Falls avoided", "Admissions avoided", "Bed days avoided"]
    values = [
        results["falls_avoided"],
        results["admissions_avoided"],
        results["bed_days_avoided"]
    ]

    fig = go.Figure(
        data=[go.Bar(x=categories, y=values, text=[f"{v:,.0f}" for v in values], textposition="outside")]
    )
    fig.update_layout(
        title="Activity impact",
        height=450
    )
    return fig


def make_scenario_comparison_chart(scenario_df: pd.DataFrame):
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=scenario_df["scenario"],
            y=scenario_df["net_cost"],
            text=[f"£{v:,.0f}" for v in scenario_df["net_cost"]],
            textposition="outside",
            name="Net cost"
        )
    )
    fig.update_layout(
        title="Net cost across scenarios",
        height=450
    )
    return fig
