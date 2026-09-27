import pytest

from ticket_triage.services.routing_service import assign_team


@pytest.mark.parametrize(
    ("category", "team"),
    [
        ("Billing", "Billing Team"),
        ("Technical Support", "Technical Support"),
        ("Account", "Account Support"),
        ("General", "Customer Support"),
    ],
)
def test_category_routes_to_deterministic_team(category, team):
    assert assign_team(category) == team


def test_unknown_category_has_no_fallback_route():
    with pytest.raises(ValueError, match="unsupported category"):
        assign_team("Unmapped Queue")
