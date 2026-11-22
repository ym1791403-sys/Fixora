# -*- coding: utf-8 -*-
"""
Backblaze Hard Drive Failure Prediction: Training Pipeline
Features:
- SMART 5 (Reallocated Sectors)
- SMART 9 (Power-On Hours)
- SMART 187 (Reported Uncorrectable)
- SMART 188 (Command Timeout)
- SMART 194 (Temperature Celsius)
- SMART 197 (Current Pending Sectors)
- SMART 198 (Offline Uncorrectable Sectors)
- Capacity (TB)

Validation & Anti-Leakage Protocol:
1. Chronological Split: Train on April 1 - May 20, 2026; Test on May 21 - June 30, 2026.
2. Serial-Number Aware: Drives present in the training set are strictly removed from the test set.
3. Imputation: Fitted solely on training split to prevent statistical leakage.
4. Class Imbalance: Handled via class_weight='balanced'.
5. Evaluation: Precision, Recall, F1-Score, ROC-AUC, PR-AUC (Average Precision).
6. Artifacts: Saves joblib model pipeline and JSON metadata with full provenance.
"""

import os
import sys
import json
import sqlite3
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score,
    confusion_matrix, classification_report
)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from api.services.db import get_connection

DATA_CSV = os.path.join(PROJECT_ROOT, "data", "processed", "backblaze_telemetry.csv")
MODEL_DIR = os.path.join(PROJECT_ROOT, "ml", "models")
MODEL_ARTIFACT = os.path.join(MODEL_DIR, "backblaze_rf_v1.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

FEATURE_COLS = [
    "smart_5_raw",
    "smart_9_raw",
    "smart_187_raw",
    "smart_188_raw",
    "smart_194_raw",
    "smart_197_raw",
    "smart_198_raw",
    "capacity_tb"
]

def load_and_preprocess(csv_path: str):
    print(f"Loading telemetry dataset from: {csv_path}")
    df = pd.read_csv(csv_path)
    
    # Feature engineering
    df["capacity_tb"] = df["capacity_bytes"] / (1024.0 ** 4)
    df["date"] = pd.to_datetime(df["date"])

    # Chronological Split Boundary: May 20, 2026
    cutoff_date = pd.to_datetime("2026-05-20")
    train_mask = df["date"] <= cutoff_date
    test_mask = df["date"] > cutoff_date

    train_df = df[train_mask].copy()
    test_df = df[test_mask].copy()

    # Serial-number-aware anti-leakage:
    # Remove any drives in test set whose serial numbers appeared in the training set
    train_serials = set(train_df["serial_number"].unique())
    test_df = test_df[~test_df["serial_number"].isin(train_serials)].copy()

    print(f"Training split: {len(train_df)} rows ({train_df['failure'].sum()} failures, {len(train_df) - train_df['failure'].sum()} healthy)")
    print(f"Testing split:  {len(test_df)} rows ({test_df['failure'].sum()} failures, {len(test_df) - test_df['failure'].sum()} healthy)")
    print(f"Unique serial numbers - Train: {train_df['serial_number'].nunique()}, Test: {test_df['serial_number'].nunique()}")
    print(f"Overlapping serial numbers: {len(set(train_df['serial_number']).intersection(set(test_df['serial_number'])))} (Strictly Zero)")

    # Median imputation fitted strictly on train split
    medians = {}
    for col in FEATURE_COLS:
        med = train_df[col].median()
        medians[col] = 0.0 if pd.isna(med) else float(med)
        train_df[col] = train_df[col].fillna(medians[col])
        test_df[col] = test_df[col].fillna(medians[col])

    X_train = train_df[FEATURE_COLS].values
    y_train = train_df["failure"].values.astype(int)

    X_test = test_df[FEATURE_COLS].values
    y_test = test_df["failure"].values.astype(int)

    return X_train, y_train, X_test, y_test, medians, len(train_df), len(test_df)

def train_and_evaluate():
    os.makedirs(MODEL_DIR, exist_ok=True)
    X_train, y_train, X_test, y_test, medians, n_train, n_test = load_and_preprocess(DATA_CSV)

    print("\n--- Training Random Forest Failure Classifier ---")
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    # Predictions & Probabilities
    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    pr_auc = float(average_precision_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n=== Model Evaluation (Chronological & Serial Isolated) ===")
    print(f"Precision:         {prec:.4f}")
    print(f"Recall:            {rec:.4f}")
    print(f"F1-Score:          {f1:.4f}")
    print(f"ROC-AUC:           {roc_auc:.4f}")
    print(f"PR-AUC (Avg Prec): {pr_auc:.4f}")
    print(f"Confusion Matrix:  TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

    feature_importances = {
        col: round(float(imp), 4)
        for col, imp in zip(FEATURE_COLS, rf.feature_importances_)
    }
    print("\nFeature Importances:")
    for col, imp in sorted(feature_importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  {col}: {imp}")

    # Save model pipeline bundle
    pipeline_bundle = {
        "model": rf,
        "feature_cols": FEATURE_COLS,
        "medians": medians,
        "algorithm": "RandomForestClassifier(balanced)",
        "version": "1.0.0"
    }
    joblib.dump(pipeline_bundle, MODEL_ARTIFACT)
    print(f"\nModel artifact saved to: {MODEL_ARTIFACT}")

    # Save metadata JSON
    metadata = {
        "model_id": "backblaze_rf_v1",
        "task": "Hard Drive Failure Prediction (Binary Classification)",
        "dataset": "Backblaze Q2 2026 Telemetry (data_Q2_2026.zip)",
        "validation_strategy": "Chronological (April 1 - May 20 vs May 21 - June 30) with Serial Number Isolation",
        "leakage_prevention": "Strict serial-number isolation between train/test; imputation medians derived solely from train split.",
        "training_samples": n_train,
        "testing_samples": n_test,
        "metrics": {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "confusion_matrix": cm
        },
        "feature_importances": feature_importances,
        "feature_columns": FEATURE_COLS,
        "trained_at": datetime.now().isoformat() + "Z",
        "device_scope": "Storage Devices (HDD/SSD) ONLY. Not applicable to non-storage categories."
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to: {METADATA_PATH}")

    # Register in SQLite model_versions table
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO model_versions (
        model_id, task_name, algorithm, training_samples, metrics_json, artifact_path, created_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        "backblaze_rf_v1",
        "hard_drive_failure_prediction",
        "RandomForestClassifier(n_estimators=100, balanced)",
        n_train,
        json.dumps(metadata["metrics"]),
        MODEL_ARTIFACT,
        datetime.now().isoformat() + "Z"
    ))
    conn.commit()
    conn.close()
    print("Registered model version in SQLite database.")
    return metadata

if __name__ == "__main__":
    train_and_evaluate()
