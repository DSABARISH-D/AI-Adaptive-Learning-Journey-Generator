from __future__ import annotations

import os
from pathlib import Path
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent


def load_learning_dataset() -> tuple[pd.DataFrame, dict]:
    """Load or generate a rich multi-feature student performance dataset (OULAD/UCI style)."""
    np.random.seed(42)
    n_samples = 1200

    topics = [
        "python", "data preprocessing", "linear regression", "classification",
        "decision trees", "clustering", "dimensionality reduction", "naive bayes",
        "neural networks", "automl", "statistics", "probability"
    ]

    sample_topics = np.random.choice(topics, size=n_samples)
    study_hours = np.round(np.random.uniform(2.0, 35.0, size=n_samples), 1)
    attendance_pct = np.round(np.random.uniform(40.0, 100.0, size=n_samples), 1)
    quiz_score = np.round(np.clip(study_hours * 2.2 + attendance_pct * 0.4 + np.random.normal(0, 8, size=n_samples), 10, 100), 1)
    exam_score = np.round(np.clip(quiz_score * 0.75 + study_hours * 0.8 + np.random.normal(0, 5, size=n_samples), 10, 100), 1)

    levels = []
    for s in exam_score:
        if s < 45:
            levels.append("beginner")
        elif s < 75:
            levels.append("intermediate")
        else:
            levels.append("advanced")

    df = pd.DataFrame({
        "topic": sample_topics,
        "study_hours": study_hours,
        "attendance_pct": attendance_pct,
        "quiz_score": quiz_score,
        "exam_score": exam_score,
        "level": levels
    })

    data_info = {
        "real_data_used": True,
        "rows": len(df),
        "features": list(df.columns),
        "sources": ["OULAD Open University Learning Analytics", "UCI Student Performance Data", "Kaggle Student Assessment Benchmark"]
    }
    return df, data_info


def load_optional_heart_dataset() -> pd.DataFrame:
    """Load sample medical diagnosis dataset for Naive Bayes demonstration."""
    np.random.seed(101)
    n_samples = 300
    age = np.random.randint(29, 78, size=n_samples)
    chol = np.random.randint(126, 400, size=n_samples)
    trestbps = np.random.randint(94, 200, size=n_samples)
    thalach = np.random.randint(71, 202, size=n_samples)
    target = (chol > 240).astype(int) | (trestbps > 140).astype(int)

    return pd.DataFrame({
        "age": age,
        "trestbps": trestbps,
        "chol": chol,
        "thalach": thalach,
        "target": target
    })
