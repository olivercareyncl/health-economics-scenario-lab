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
    categories = [
        "Waiting list reduction",
        "Escalations avoided",
        "Admissions avoided",
        "Bed days avoided",
    ]
    values = [
        results["waiting_list_reduction_total"],
        results["escalations_avoided_total"],
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
        title="Total pathway impact over selected horizon",
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
        margin=dict(l=20, r=20, t=130, b=20),
        legend=dict(
            orientation="h",
            yanchor="top",
            y=1.04,
            xanchor="left",
            x=0.0,
        ),
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
            y=scenario_df["Waiting list reduction"],
            name="Waiting list reduction",
            text=[f"{v:,.0f}" for v in scenario_df["Waiting list reduction"]],
            textposition="outside",
        )
    )

    fig.add_trace(
        go.Bar(
            x=scenario_df["Scenario"],
            y=scenario_df["Escalations avoided"],
            name="Escalations avoided",
            text=[f"{v:,.0f}" for v in scenario_df["Escalations avoided"]],
            textposition="outside",
        )
    )

    fig.update_layout(
        title="Headline operational impact across scenarios",
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


def make_backlog_reduction_chart(yearly_df):
    fig = go.Figure(
        data=[
            go.Bar(
                x=yearly_df["year"],
                y=yearly_df["waiting_list_reduction"],
                text=[f"{v:,.0f}" for v in yearly_df["waiting_list_reduction"]],
                textposition="outside",
                showlegend=False,
            )
        ]
    )

    fig.update_layout(
        title="Waiting list reduction by year",
        xaxis_title="Year",
        yaxis_title="Waiting list reduction",
        height=430,
        margin=dict(l=20, r=20, t=80, b=20),
        showlegend=False,
    )
    return fig


def make_uncertainty_chart(uncertainty_df):
    fig = go.Figure(
        data=[
            go.Bar(
                x=uncertainty_df["case"],
                y=uncertainty_df["discounted_cost_per_qaly"],
                text=[f"£{v:,.0f}" for v in uncertainty_df["discounted_cost_per_qaly"]],
                textposition="outside",
                showlegend=False,
            )
        ]
    )

    fig.update_layout(
        title="Bounded uncertainty on discounted cost per QALY",
        xaxis_title="Case",
        yaxis_title="£ per QALY",
        height=430,
        margin=dict(l=20, r=20, t=80, b=20),
        showlegend=False,
    )
    return fig


def make_comparator_delta_chart(base_results: dict, comparator_results: dict, comparator_label: str):
    categories = [
        "Waiting list reduction",
        "Escalations avoided",
        "Discounted net cost",
        "Discounted cost per QALY",
    ]
    values = [
        comparator_results["waiting_list_reduction_total"] - base_results["waiting_list_reduction_total"],
        comparator_results["escalations_avoided_total"] - base_results["escalations_avoided_total"],
        comparator_results["discounted_net_cost_total"] - base_results["discounted_net_cost_total"],
        comparator_results["discounted_cost_per_qaly"] - base_results["discounted_cost_per_qaly"],
    ]
    text = [
        f"{values[0]:,.0f}",
        f"{values[1]:,.0f}",
        f"£{values[2]:,.0f}",
        f"£{values[3]:,.0f}",
    ]

    fig = go.Figure(
        data=[
            go.Bar(
                x=categories,
                y=values,
                text=text,
                textposition="outside",
                showlegend=False,
            )
        ]
    )

    fig.update_layout(
        title=f"Comparator deltas versus current configuration ({comparator_label})",
        xaxis_title="",
        yaxis_title="Delta",
        height=430,
        margin=dict(l=20, r=20, t=80, b=20),
        showlegend=False,
    )
    return fig
