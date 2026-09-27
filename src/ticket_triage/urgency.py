"""Sentiment-derived urgency heuristic; independent of the category classifier."""

from functools import lru_cache

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


@lru_cache(maxsize=1)
def _analyzer() -> SentimentIntensityAnalyzer:
    return SentimentIntensityAnalyzer()


def ensure_urgency_ready() -> None:
    """Load VADER resources during application startup."""
    _analyzer()


def score_urgency(text: str) -> dict[str, float | int | str]:
    """Map VADER compound polarity to a 0-100 urgency score and level.

    Neutral language scores 50. More negative sentiment raises the score; more
    positive sentiment lowers it. Thresholds are a transparent initial heuristic,
    not a learned prediction of the dataset's Ticket Priority field.
    """
    compound = _analyzer().polarity_scores(str(text))["compound"]
    score = round((1.0 - compound) * 50)
    level = "High" if score >= 70 else "Medium" if score >= 45 else "Low"
    return {
        "score": score,
        "level": level,
        "sentiment_compound": round(compound, 4),
    }
