"""TF-IDF and Logistic Regression category model."""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from ticket_triage.preprocessing import extract_features


def identity(value: str) -> str:
    return value


def build_classifier() -> Pipeline:
    """Build a reproducible, class-balanced text classification pipeline."""
    return Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    preprocessor=identity,
                    tokenizer=extract_features,
                    token_pattern=None,
                    lowercase=False,
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.98,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    class_weight="balanced",
                    max_iter=1000,
                    random_state=42,
                ),
            ),
        ]
    )
