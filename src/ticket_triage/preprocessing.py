"""Explainable text cleaning and linguistic feature extraction."""

from functools import lru_cache
import re

import spacy

from ticket_triage.config import SPACY_MODEL

URL_PATTERN = re.compile(r"\b(?:https?://|www\.)\S+", re.IGNORECASE)
EMAIL_PATTERN = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
NON_ASCII_TOKEN_PATTERN = re.compile(r"\S*[^\x00-\x7F]\S*")
NON_WORD_PATTERN = re.compile(r"[^A-Za-z0-9\s]")
NUMBER_PATTERN = re.compile(r"\b\d+\b")
WHITESPACE_PATTERN = re.compile(r"\s+")
LATIN_TOKEN_PATTERN = re.compile(r"[A-Za-z]+\Z")


def clean_text(text: str) -> str:
    """Strip URLs, emails, non-ASCII artifacts, punctuation, and standalone numbers."""
    cleaned = URL_PATTERN.sub(" ", str(text))
    cleaned = EMAIL_PATTERN.sub(" ", cleaned)
    cleaned = NON_ASCII_TOKEN_PATTERN.sub(" ", cleaned)
    cleaned = cleaned.replace("?", " ").replace("=", " ")
    cleaned = NON_WORD_PATTERN.sub(" ", cleaned)
    cleaned = NUMBER_PATTERN.sub(" ", cleaned)
    return WHITESPACE_PATTERN.sub(" ", cleaned).strip()


def script_valid_tokens(tokens: list[str]) -> list[str]:
    """Keep alphabetic ASCII (Latin-script) tokens only."""
    return [
        token
        for token in tokens
        if token.isascii() and LATIN_TOKEN_PATTERN.fullmatch(token) is not None
    ]


def _get_nlp():
    return None


def ensure_nlp_ready() -> None:
    """Mock spaCy loading."""
    pass


def extract_entities(text: str) -> list[dict[str, str]]:
    """Mock NER."""
    return []


def extract_features(text: str) -> list[str]:
    """Mock features (simple tokenization)."""
    original_text = str(text)
    cleaned = clean_text(original_text).lower()
    tokens = cleaned.split()
    return script_valid_tokens(tokens)
