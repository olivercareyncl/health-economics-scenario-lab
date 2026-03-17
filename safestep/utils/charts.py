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
