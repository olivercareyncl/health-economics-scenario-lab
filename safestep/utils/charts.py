import plotly.graph_objects as go


def make_waterfall_chart(results: dict):
    fig = go.Figure(
        go.Waterfall(
            name="Financial impact",
            orientation="v",
            measure=["absolute", "relative", "total"],
            x=["Discounted programme cost", "Discounted gross savings", "Discounted net impact"],
            y=[
                results["discounted_programme_cost_total"],
                -results["discounted_gross_savings_total"],
                0,
            ],
            text=[
                f"£{results['discounted_programme_cost_total']:,.0f}",
                f"£{results['discounted_gross_savings_total']:,.0f}",
                f"£{results['discounted_net_cost_total']:,.0f}",
            ],
            textposition="outside",
        )
    )
    fig.update_layout(
        title="Discounted programme cost and savings",
        xaxis_title="",
        yaxis_title="£",
        showlegend=False,
        height=430,
        margin=dict(l=20, r=20, t=80, b=20),
    )
    return fig


def make_impact_bar_chart(results: dict):
    categories = ["Falls avoided", "Admissions avoided", "Bed days avoided"]
    values = [
        results["falls_avoided_total"],
        results["admissions_avoided_total"],
        results["bed_days_avoided_total"],
    ]

    fig = go.Figure(
        data=[
            go.Bar(
                x=categories,
                y=values,
                text=[f"{v:,.0f}" for v in values],
                textposition="outside",
                showlegend=False,
            )
        ]
    )
    fig.update_layout(
        title="Total activity impact over selected horizon",
        xaxis_title="",
        yaxis_title="Estimated volume",
        showlegend=False,
        height=430,
        margin=dict(l=20, r=20, t=80, b=20),
    )
    return fig


def make_tornado_chart(sensitivity_df):
    sorted_df = sensitivity_df.sort_values("swing", ascending=True)

    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            y=sorted_df["label"],
            x=sorted_df["low_delta"],
            name="Low case",
            orientation="h",
            text=[f"£{abs(v):,.0f}" for v in sorted_df["low_delta"]],
            textposition="outside",
        )
    )

    fig.add_trace(
        go.Bar(
            y=sorted_df["label"],
            x=sorted_df["high_delta"],
            name="High case",
            orientation="h",
            text=[f"£{abs(v):,.0f}" for v in sorted_df["high_delta"]],
            textposition="outside",
        )
    )

    fig.update_layout(
        title="One-way sensitivity analysis on discounted cost per QALY",
        barmode="relative",
        xaxis_title="Change from base case (£)",
        yaxis_title="",
        height=560,
        legend=dict(
            orientation="h",
            yanchor="top",
            y=1.02,
            xanchor="left",
            x=0.0,
        ),
        margin=dict(l=20, r=20, t=140, b=20),
    )
    return fig


def make_scenario_comparison_chart(scenario_df):
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=scenario_df["Scenario"],
            y=scenario_df["Discounted net cost"],
            text=[f"£{v:,.0f}" for v in scenario_df["Discounted net cost"]],
            textposition="outside",
            name="Discounted net cost",
            showlegend=False,
        )
    )
    fig.update_layout(
        title="Discounted net cost across scenarios",
        xaxis_title="",
        yaxis_title="£",
        showlegend=False,
        height=430,
        margin=dict(l=20, r=20, t=80, b=20),
    )
    return fig


def make_scenario_outcome_chart(scenario_df):
    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            x=scenario_df["Scenario"],
            y=scenario_df["Falls avoided"],
            name="Falls avoided",
            text=[f"{v:,.0f}" for v in scenario_df["Falls avoided"]],
            textposition="outside",
        )
    )

    fig.add_trace(
        go.Bar(
            x=scenario_df["Scenario"],
            y=scenario_df["Admissions avoided"],
            name="Admissions avoided",
            text=[f"{v:,.0f}" for v in scenario_df["Admissions avoided"]],
            textposition="outside",
        )
    )

    fig.update_layout(
        title="Headline health impact across scenarios",
        barmode="group",
        xaxis_title="",
        yaxis_title="Estimated volume",
        height=450,
        margin=dict(l=20, r=20, t=100, b=20),
        legend=dict(
            orientation="h",
            yanchor="top",
            y=1.0,
            xanchor="left",
            x=0.0,
        ),
    )
    return fig


def make_cumulative_costs_chart(yearly_df):
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=yearly_df["year"],
            y=yearly_df["cumulative_programme_cost"],
            mode="lines+markers",
            name="Cumulative programme cost",
        )
    )

    fig.add_trace(
        go.Scatter(
            x=yearly_df["year"],
            y=yearly_df["cumulative_gross_savings"],
            mode="lines+markers",
            name="Cumulative gross savings",
        )
    )

    fig.update_layout(
        title="Cumulative programme cost vs cumulative savings",
        xaxis_title="Year",
        yaxis_title="£",
        height=450,
        margin=dict(l=20, r=20, t=100, b=20),
        legend=dict(
            orientation="h",
            yanchor="top",
            y=1.0,
            xanchor="left",
            x=0.0,
        ),
    )
    return fig


def make_cumulative_net_cost_chart(yearly_df):
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=yearly_df["year"],
            y=yearly_df["cumulative_net_cost"],
            mode="lines+markers",
            name="Cumulative net cost",
            showlegend=False,
        )
    )

    fig.update_layout(
        title="Cumulative net cost over time",
        xaxis_title="Year",
        yaxis_title="£",
        height=430,
        margin=dict(l=20, r=20, t=80, b=20),
        showlegend=False,
    )
    return fig


def make_falls_avoided_chart(yearly_df):
    fig = go.Figure(
        data=[
            go.Bar(
                x=yearly_df["year"],
                y=yearly_df["falls_avoided"],
                text=[f"{v:,.0f}" for v in yearly_df["falls_avoided"]],
                textposition="outside",
                showlegend=False,
            )
        ]
    )

    fig.update_layout(
        title="Falls avoided by year",
        xaxis_title="Year",
        yaxis_title="Falls avoided",
        height=430,
        margin=dict(l=20, r=20, t=80, b=20),
        showlegend=False,
    )
    return fig
