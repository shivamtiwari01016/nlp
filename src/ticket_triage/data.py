"""Dataset loading and transparent mapping to the four requested queues."""

from pathlib import Path
import re

import pandas as pd

CATEGORIES = ("Billing", "Technical Support", "Account", "General")

CATEGORY_ALIASES = {
    "billing": "Billing",
    "billing inquiry": "Billing",
    "refund": "Billing",
    "refund request": "Billing",
    "technical": "Technical Support",
    "technical issue": "Technical Support",
    "technical support": "Technical Support",
    "account": "Account",
    "account access": "Account",
    "cancellation": "Account",
    "cancellation request": "Account",
    "general": "General",
    "general inquiry": "General",
    "other": "General",
    "product inquiry": "General",
}


def _normalise_name(value: object) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", str(value).lower())).strip()


def category_from_label(value: object) -> str:
    """Map a native queue or a documented Kaggle Ticket Type to a queue."""
    normalised = _normalise_name(value)
    for category in CATEGORIES:
        if normalised == _normalise_name(category):
            return category
    try:
        return CATEGORY_ALIASES[normalised]
    except KeyError as error:
        raise ValueError(f"Unsupported ticket category/Type value: {value!r}") from error


def _find_column(columns: list[str], candidates: tuple[str, ...]) -> str | None:
    normalised = {_normalise_name(column): column for column in columns}
    for candidate in candidates:
        if _normalise_name(candidate) in normalised:
            return normalised[_normalise_name(candidate)]
    return None


def load_ticket_data(csv_path: str | Path) -> pd.DataFrame:
    """Return a frame with combined ``text`` and normalized ``category`` columns."""
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Ticket CSV not found: {path}")

    frame = pd.read_csv(path)
    label_column = _find_column(
        list(frame.columns),
        ("category", "queue", "ticket category", "Ticket Type", "type"),
    )
    if label_column is None:
        raise ValueError(
            "Could not find a category/queue label column (expected category, "
            "queue, or Ticket Type)."
        )

    subject_column = _find_column(
        list(frame.columns), ("subject", "ticket subject", "title")
    )
    description_column = _find_column(
        list(frame.columns),
        ("text", "ticket description", "description", "message", "body"),
    )
    if subject_column is None and description_column is None:
        raise ValueError("Could not find a subject or ticket-text column.")

    text = pd.Series("", index=frame.index, dtype="string")
    for column in (subject_column, description_column):
        if column is not None:
            text = text.str.cat(frame[column].fillna("").astype(str), sep=" ")

    result = pd.DataFrame({"text": text.str.strip(), "label": frame[label_column]})
    result = result.dropna(subset=["label"])
    result = result[result["text"].str.len() > 0].copy()
    result["category"] = result["label"].map(category_from_label)
    return result[["text", "category"]].reset_index(drop=True)
