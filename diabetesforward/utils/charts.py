import pandas as pd
import plotly.express as px
import plotly.graph_objects as go


def _standard_layout(fig: go.Figure, title: str = "", yaxis_title: str = "") -> go.Figure:
    fig.update_layout(
        title=title,
        template="plotly_white",
        margin=dict(l=20, r=20, t=60, b=20),
        height=420,
        legend_title_text="",
        xaxis_title="",
        yaxis_title=yaxis_title,
    )
    return fig


def make_waterfall_chart(results: dict) -> go.Figure:
    net_value = results["gross_savings_total"] - results["programme_cost_total"]

    fig = go.Figure(
        go.Waterfall(
            name="Value bridge",
            orientation="v",
            measure=["relative", "relative", "total"],
            x=["Programme cost", "Gross savings", "Net value"],
            y=[
                -results["programme_cost_total"],
                results["gross_savings_total"],
                net_value,
            ],
            connector={"line": {"width": 1}},
        )
    )

    fig.update_traces(textposition="outside")
    fig.update_yaxes(tickprefix="£")
    return _standard_layout(fig, "How value is generated", "£")


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
                results["complications_avoided_total"],
                results["admissions_avoided_total"],
                results["bed_days_avoided_total"],
                results["patients_reached_total"],
            ],
        }
    )

    fig = px.bar(
        df,
        x="Metric",
        y="Value",
        text="Value",
    )
    fig.update_traces(texttemplate="%{text:,.0f}", textposition="outside")
    return _standard_layout(fig, "Clinical impact summary", "")


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
            name="Cumulative programme cost",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=df["year"],
            y=df["cumulative_gross_savings"],
            mode="lines+markers",
            name="Cumulative gross savings",
        )
    )

    fig.update_xaxes(dtick=1)
    fig.update_yaxes(tickprefix="£")
    return _standard_layout(fig, "Cumulative costs and savings", "£")


def make_cumulative_net_cost_chart(yearly_results: pd.DataFrame) -> go.Figure:
    df = yearly_results.copy()

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=df["year"],
            y=df["cumulative_net_cost"],
            mode="lines+markers",
            name="Cumulative discounted net cost",
        )
    )

    fig.add_hline(y=0, line_width=1, line_dash="dash")
    fig.update_xaxes(dtick=1)
    fig.update_yaxes(tickprefix="£")
    return _standard_layout(fig, "Cumulative discounted net cost", "£")


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

    fig.update_xaxes(dtick=1)
    return _standard_layout(fig, "Complications avoided over time", "")


def make_uncertainty_chart(uncertainty_df: pd.DataFrame) -> go.Figure:
    df = uncertainty_df.copy()

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=df["case"],
            y=df["discounted_cost_per_qaly"],
            text=df["discounted_cost_per_qaly"].map(lambda x: f"£{x:,.0f}"),
            textposition="outside",
            name="Discounted cost per QALY",
        )
    )

    fig.update_yaxes(tickprefix="£")
    return _standard_layout(fig, "Bounded uncertainty", "£ per QALY")


def make_tornado_chart(sensitivity_df: pd.DataFrame) -> go.Figure:
    df = sensitivity_df.copy()

    if "impact_range" not in df.columns:
        df["impact_range"] = (df["high_value"] - df["low_value"]).abs()

    df = df.sort_values("impact_range", ascending=True)

    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            y=df["label"],
            x=df["low_value"] - df["base_value"],
            name="Low case",
            orientation="h",
        )
    )
    fig.add_trace(
        go.Bar(
            y=df["label"],
            x=df["high_value"] - df["base_value"],
            name="High case",
            orientation="h",
        )
    )

    fig.update_layout(barmode="relative")
    fig.update_xaxes(tickprefix="£")
    return _standard_layout(fig, "One-way sensitivity analysis", "Change vs base (£ per QALY)")


def make_scenario_comparison_chart(scenario_df: pd.DataFrame) -> go.Figure:
    df = scenario_df.copy()

    fig = px.bar(
        df,
        x="Scenario",
        y="Discounted net cost",
        text="Discounted net cost",
    )
    fig.update_traces(texttemplate="£%{text:,.0f}", textposition="outside")
    fig.update_yaxes(tickprefix="£")
    return _standard_layout(fig, "Scenario comparison: discounted net cost", "£")


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
        go.Scatter(
            x=df["Scenario"],
            y=df["Discounted cost per QALY"],
            mode="lines+markers",
            name="Discounted cost per QALY",
            yaxis="y2",
        )
    )

    fig.update_layout(
        template="plotly_white",
        margin=dict(l=20, r=20, t=60, b=20),
        height=420,
        xaxis_title="",
        yaxis=dict(title="Complications avoided"),
        yaxis2=dict(
            title="£ per QALY",
            overlaying="y",
            side="right",
            tickprefix="£",
        ),
        legend_title_text="",
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
                comparator_results["complications_avoided_total"] - base_results["complications_avoided_total"],
                comparator_results["admissions_avoided_total"] - base_results["admissions_avoided_total"],
                comparator_results["discounted_net_cost_total"] - base_results["discounted_net_cost_total"],
                comparator_results["discounted_cost_per_qaly"] - base_results["discounted_cost_per_qaly"],
            ],
        }
    )

    fig = px.bar(
        df,
        x="Metric",
        y="Delta",
        text="Delta",
    )

    text_values = []
    for metric, value in zip(df["Metric"], df["Delta"]):
        if "cost" in metric.lower():
            text_values.append(f"£{value:,.0f}")
        else:
            text_values.append(f"{value:,.0f}")

    fig.update_traces(text=text_values, textposition="outside")
    return _standard_layout(fig, f"Comparator impact: {comparator_mode}", "")