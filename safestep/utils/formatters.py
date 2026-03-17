def format_currency(value: float) -> str:
    return f"£{value:,.0f}"


def format_percent(value: float) -> str:
    return f"{value:.1%}"


def format_number(value: float) -> str:
    return f"{value:,.0f}"


def format_ratio(value: float) -> str:
    return f"{value:.2f}x"
    