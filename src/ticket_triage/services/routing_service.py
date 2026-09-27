"""Deterministic support-team mapping for predicted categories."""

from ticket_triage.data import CATEGORIES

TEAM_BY_CATEGORY = {
    "Billing": "Billing Team",
    "Technical Support": "Technical Support",
    "Account": "Account Support",
    "General": "Customer Support",
}


def assign_team(category: str) -> str:
    """Return the configured team for a known classifier category."""
    if category not in CATEGORIES:
        raise ValueError(f"Classifier returned an unsupported category: {category!r}")
    return TEAM_BY_CATEGORY[category]
