import uuid
from datetime import datetime


def generate_id(prefix: str) -> str:
    """
    Generate a unique identifier using a prefix and truncated UUID.
    Example: generate_id("PAT") -> PAT-1A2B3C4D
    """
    token = uuid.uuid4().hex[:8].upper()
    return f"{prefix}-{token}"


def parse_date(date_str: str, fmt: str = "%Y-%m-%d"):
    """
    Safely parse a date string using the provided format.
    Returns a date object or None if parsing fails.
    """
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, fmt).date()
    except ValueError:
        return None


def parse_datetime(value: str):
    """
    Try parsing a datetime string using multiple common formats.
    Returns a datetime object or None.
    """
    if not value:
        return None

    formats = [
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None

