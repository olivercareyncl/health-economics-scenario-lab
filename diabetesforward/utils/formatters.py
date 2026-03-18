def format_currency(value: float) -> str:
    if value is None:
        return "£0"
    return f"£{value:,.0f}"


def format_number(value: float) -> str:
    if value is None:
        return "0"
    return f"{value:,.0f}"


def format_percent(value: float) -> str:
    if value is None:
        return "0%"
    return f"{value:.1%}"


def format_ratio(value: float) -> str:
    if value is None:
        return "0.00x"
    return f"{value:,.2f}x"