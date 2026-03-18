import plotly.express as px
import plotly.graph_objects as go
import pandas as pd


def _base_layout(title: str, yaxis_title: str = "") -> dict:
    return {
        "title": title,
        "template": "plotly_white",
        "height": 420,
        "margin": dict(l=20, r=20, t=60, b=20),
        "xaxis_title": "",
        "yaxis_title": yaxis_title,
        "showlegend": False,
    }


def make_impact_bar_chart(results: dict) -> go.Figure:
    df = pd.DataFrame(
        {
            "Metric": [
                "Complications avoided",
                "Admissions avoided",
                "Bed days avoided",
                "Patients reached",
            ],
            "Value": [
                results.get("complications_avoided_total", 0.0),
                results.get("admissions_avoided_total", 0.0),
                results.get("bed_days_avoided_total", 0.0),
                results.get("patients_reached_total", 0.0),
            ],
        }
    )

    fig = px.bar(df, x="Metric", y="Value", text="Value")
    fig.update_traces(texttemplate="%{text:,.0f}", textposition="outside")
    fig.update_layout(**_base_layout("Clinical impact profile", "Volume"))
    return fig


def make_waterfall_chart(results: dict) -> go.Figure:
    programme_cost = results.get("programme_cost_total", 0.0)
    gross_savings = results.get("gross_savings_total", 0.0)
    net_cost = results.get("discounted_net_cost_total", 0.0)

    fig = go.Figure(
        go.Waterfall(
            orientation="v",
            measure=["relative", "relative", "total"],
            x=["Programme cost", "Gross savings", "Discounted net cost"],
            y=[programme_cost, -gross_savings, net_cost],
            text=[
                f"£{programme_cost:,.0f}",
                f"£{gross_savings:,.0f}",
                f"£{net_cost:,.0f}",
            ],
            textposition="outside",
        )
    )
    fig.update_layout(**_base_layout("Economic waterfall", "£"))
    return fig


def make_cumulative_costs_chart(yearly_results: pd.DataFrame) -> go.Figure:
    df = yearly_results.copy()
    df["cumulative_programme_cost"] = df["programme_cost"].cumsum()
    df["cumulative_gross_savings"] = df["gross_savings"].cumsum()

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=df["year"],
            y=df["cumulative_programme_cost"],
            mode="lines+markers",
            name="Programme cost",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=df["year"],
            y=df["cumulative_gross_savings"],
            mode="lines+markers",
            name="Gross savings",
        )
    )
    fig.update_layout(
        title="Cumulative costs and savings",
        template="plotly_white",
        height=420,
        margin=dict(l=20, r=20, t=60, b=20),
        xaxis_title="Year",
        yaxis_title="£",
        showlegend=True,
    )
    return fig


def make_cumulative_net_cost_chart(yearly_results: pd.DataFrame) -> go.Figure:
    df = yearly_results.copy()

    fig = go.Figure(
        go.Scatter(
            x=df["year"],
            y=df["cumulative_net_cost"],
            mode="lines+markers",
            fill="tozeroy",
            name="Cumulative net cost",
        )
    )
    fig.update_layout(
        title="Cumulative discounted net cost",
        template="plotly_white",
        height=420,
        margin=dict(l=20, r=20, t=60, b=20),
        xaxis_title="Year",
        yaxis_title="£",
        showlegend=False,
    )
    return fig


def make_complications_avoided_chart(yearly_results: pd.DataFrame) -> go.Figure:
    df = yearly_results.copy()

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=df["year"],
            y=df["complications_avoided"],
            name="Complications avoided",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=df["year"],
            y=df["patients_reached"],
            mode="lines+markers",
            name="Patients reached",
            yaxis="y2",
        )
    )

    fig.update_layout(
        title="Complications avoided over time",
        template="plotly_white",
        height=420,
        margin=dict(l=20, r=20, t=60, b=20),
        xaxis_title="Year",
        yaxis=dict(title="Complications avoided"),
        yaxis2=dict(
            title="Patients reached",
            overlaying="y",
            side="right",
        ),
        showlegend=True,
    )
    return fig


def make_uncertainty_chart(uncertainty_df: pd.DataFrame) -> go.Figure:
    df = uncertainty_df.copy()

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=df["case"],
            y=df["discounted_net_cost_total"],
            name="Discounted net cost",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=df["case"],
            y=df["discounted_cost_per_qaly"],
            mode="lines+markers",
            name="Discounted cost per QALY",
            yaxis="y2",
        )
    )

    fig.update_layout(
        title="Bounded uncertainty view",
        template="plotly_white",
        height=420,
        margin=dict(l=20, r=20, t=60, b=20),
        xaxis_title="Case",
        yaxis=dict(title="Discounted net cost (£)"),
        yaxis2=dict(
            title="Discounted cost per QALY (£)",
            overlaying="y",
            side="right",
        ),
        showlegend=True,
    )
    return fig


def make_tornado_chart(sensitivity_df: pd.DataFrame) -> go.Figure:
    df = sensitivity_df.copy()
    if "range" not in df.columns:
        df["range"] = (df["high_outcome"] - df["low_outcome"]).abs()

    df = df.sort_values("range", ascending=True)

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            y=df["label"],
            x=df["high_outcome"] - df["base_outcome"],
            orientation="h",
            name="High",
        )
    )
    fig.add_trace(
        go.Bar(
            y=df["label"],
            x=df["low_outcome"] - df["base_outcome"],
            orientation="h",
            name="Low",
        )
    )

    fig.update_layout(
        title="One-way sensitivity analysis",
        template="plotly_white",
        height=max(420, 42 * len(df) + 120),
        margin=dict(l=20, r=20, t=60, b=20),
        xaxis_title="Change in discounted cost per QALY",
        yaxis_title="",
        barmode="overlay",
        showlegend=True,
    )
    return fig


def make_scenario_comparison_chart(scenario_df: pd.DataFrame) -> go.Figure:
    df = scenario_df.copy()

    fig = px.bar(
        df,
        x="Scenario",
        y="Discounted net cost",
        color="Decision status",
        barmode="group",
    )
    fig.update_layout(**_base_layout("Scenario comparison: discounted net cost", "£"))
    fig.update_layout(showlegend=True)
    return fig


def make_scenario_outcome_chart(scenario_df: pd.DataFrame) -> go.Figure:
    df = scenario_df.copy()

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=df["Scenario"],
            y=df["Complications avoided"],
            name="Complications avoided",
        )
    )
    fig.add_trace(
        go.Bar(
            x=df["Scenario"],
            y=df["Admissions avoided"],
            name="Admissions avoided",
        )
    )

    fig.update_layout(
        title="Scenario comparison: health impact",
        template="plotly_white",
        height=420,
        margin=dict(l=20, r=20, t=60, b=20),
        xaxis_title="Scenario",
        yaxis_title="Volume",
        barmode="group",
        showlegend=True,
    )
    return fig


def make_comparator_delta_chart(
    base_results: dict,
    comparator_results: dict,
    comparator_mode: str,
) -> go.Figure:
    df = pd.DataFrame(
        {
            "Metric": [
                "Complications avoided",
                "Admissions avoided",
                "Discounted net cost",
                "Discounted cost per QALY",
            ],
            "Delta": [
                comparator_results.get("complications_avoided_total", 0.0)
                - base_results.get("complications_avoided_total", 0.0),
                comparator_results.get("admissions_avoided_total", 0.0)
                - base_results.get("admissions_avoided_total", 0.0),
                comparator_results.get("discounted_net_cost_total", 0.0)
                - base_results.get("discounted_net_cost_total", 0.0),
                comparator_results.get("discounted_cost_per_qaly", 0.0)
                - base_results.get("discounted_cost_per_qaly", 0.0),
            ],
        }
    )

    fig = px.bar(df, x="Metric", y="Delta", text="Delta")
    fig.update_traces(texttemplate="%{text:,.0f}", textposition="outside")
    fig.update_layout(**_base_layout(f"Comparator deltas vs {comparator_mode}", "Delta"))
    return fig