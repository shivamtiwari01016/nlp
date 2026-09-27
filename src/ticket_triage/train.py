"""Train, evaluate, and serialize the ticket category classifier."""

import argparse
import json
from pathlib import Path

import joblib
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split

from ticket_triage.data import CATEGORIES, load_ticket_data
from ticket_triage.model import build_classifier

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def train_and_evaluate(
    data_path: str | Path,
    model_path: str | Path,
    test_size: float = 0.2,
    random_state: int = 42,
) -> dict:
    """Fit on a stratified holdout split and save model plus evaluation metrics."""
    tickets = load_ticket_data(data_path)
    if tickets["category"].value_counts().min() < 2:
        raise ValueError("Each category needs at least two rows for a stratified split.")

    train_text, test_text, train_labels, test_labels = train_test_split(
        tickets["text"],
        tickets["category"],
        test_size=test_size,
        random_state=random_state,
        stratify=tickets["category"],
    )

    classifier = build_classifier()
    classifier.fit(train_text, train_labels)
    predictions = classifier.predict(test_text)
    weighted_precision, weighted_recall, weighted_f1, _ = (
        precision_recall_fscore_support(
            test_labels, predictions, average="weighted", zero_division=0
        )
    )
    macro_precision, macro_recall, macro_f1, _ = precision_recall_fscore_support(
        test_labels, predictions, average="macro", zero_division=0
    )
    majority_baseline_accuracy = float(test_labels.value_counts(normalize=True).max())

    metrics = {
        "dataset_rows": int(len(tickets)),
        "train_rows": int(len(train_text)),
        "test_rows": int(len(test_text)),
        "random_state": random_state,
        "test_size": test_size,
        "category_counts": {
            str(label): int(count)
            for label, count in tickets["category"].value_counts().items()
        },
        "accuracy": float(accuracy_score(test_labels, predictions)),
        "weighted_precision": float(weighted_precision),
        "weighted_recall": float(weighted_recall),
        "weighted_f1": float(weighted_f1),
        "majority_baseline_accuracy": majority_baseline_accuracy,
        "macro_precision": float(macro_precision),
        "macro_recall": float(macro_recall),
        "macro_f1": float(macro_f1),
        "classification_report": classification_report(
            test_labels,
            predictions,
            labels=list(CATEGORIES),
            output_dict=True,
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(
            test_labels, predictions, labels=list(CATEGORIES)
        ).tolist(),
        "confusion_matrix_labels": list(CATEGORIES),
    }

    destination = Path(model_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(classifier, destination)
    metrics_path = destination.with_name("evaluation.json")
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data",
        type=Path,
        default=PROJECT_ROOT / "data/raw/customer_support_tickets.csv",
        help="Path to the Kaggle CSV",
    )
    parser.add_argument(
        "--model-out",
        type=Path,
        default=PROJECT_ROOT / "models/ticket_triage.joblib",
        help="Where to save the trained model",
    )
    args = parser.parse_args()

    metrics = train_and_evaluate(args.data, args.model_out)
    print(f"Saved model: {args.model_out}")
    print(f"Saved metrics: {args.model_out.with_name('evaluation.json')}")
    for metric in (
        "accuracy",
        "weighted_precision",
        "weighted_recall",
        "weighted_f1",
        "macro_f1",
        "majority_baseline_accuracy",
    ):
        print(f"{metric}: {metrics[metric]:.4f}")
    print(json.dumps(metrics["classification_report"], indent=2))


if __name__ == "__main__":
    main()
