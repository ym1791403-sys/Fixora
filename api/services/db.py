# -*- coding: utf-8 -*-
"""
Fixora Database Layer
SQLite connection manager and schema initialization.
Stores:
- repair_incidents (Open Repair Alliance 416K records)
- repair_guides (MyFixit 18K records)
- drive_telemetry (Backblaze telemetry & predictions)
- dataset_imports (Live dataset status tracking)
- model_versions (Trained ML models & evaluation metrics)
"""

import os
import sqlite3
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "processed", "fixora.db")

def get_db_path() -> str:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    return DB_PATH

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_db():
    """Initializes all database tables with proper indexing."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    -- 1. Open Repair Alliance Incidents
    CREATE TABLE IF NOT EXISTS repair_incidents (
        id TEXT PRIMARY KEY,
        data_provider TEXT,
        country TEXT,
        partner_category TEXT,
        normalized_category TEXT NOT NULL,
        brand TEXT,
        product_age REAL,
        repair_status TEXT NOT NULL,
        repair_barrier TEXT,
        problem_raw TEXT,
        problem_cluster TEXT,
        event_date TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_incidents_category ON repair_incidents(normalized_category);
    CREATE INDEX IF NOT EXISTS idx_incidents_brand ON repair_incidents(brand);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON repair_incidents(repair_status);
    CREATE INDEX IF NOT EXISTS idx_incidents_cluster ON repair_incidents(problem_cluster);

    -- 2. MyFixit Repair Guides
    CREATE TABLE IF NOT EXISTS repair_guides (
        guide_id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        file_source TEXT,
        device_category TEXT NOT NULL,
        device_model TEXT,
        component TEXT,
        repair_type TEXT,
        category TEXT NOT NULL,
        subject TEXT,
        url TEXT,
        difficulty TEXT,
        time_required TEXT,
        summary TEXT,
        tools_json TEXT,
        steps_json TEXT,
        ancestors_json TEXT,
        step_count INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_guides_devcat ON repair_guides(device_category);
    CREATE INDEX IF NOT EXISTS idx_guides_model ON repair_guides(device_model);
    CREATE INDEX IF NOT EXISTS idx_guides_component ON repair_guides(component);
    CREATE INDEX IF NOT EXISTS idx_guides_category ON repair_guides(category);
    CREATE INDEX IF NOT EXISTS idx_guides_subject ON repair_guides(subject);

    -- Full-Text Search (FTS5) for fast natural-language guide retrieval
    CREATE VIRTUAL TABLE IF NOT EXISTS repair_guides_fts USING fts5(
        guide_id UNINDEXED,
        title,
        device_category,
        device_model,
        component,
        repair_type,
        instructions_text
    );

    -- 3. Backblaze Telemetry & Failure Predictions
    CREATE TABLE IF NOT EXISTS drive_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        serial_number TEXT NOT NULL,
        model TEXT NOT NULL,
        capacity_bytes INTEGER,
        failure INTEGER NOT NULL,
        smart_metrics_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_telemetry_serial ON drive_telemetry(serial_number);
    CREATE INDEX IF NOT EXISTS idx_telemetry_model ON drive_telemetry(model);

    -- 4. User Diagnostic Reports
    CREATE TABLE IF NOT EXISTS diagnosis_reports (
        report_id TEXT PRIMARY KEY,
        device_category TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        problem_category TEXT,
        description TEXT,
        evidence_json TEXT,
        created_at TEXT NOT NULL
    );

    -- 5. Dataset Import Metadata & Verification Tracking
    CREATE TABLE IF NOT EXISTS dataset_imports (
        dataset_key TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        source_url TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size_bytes INTEGER DEFAULT 0,
        total_raw_records INTEGER DEFAULT 0,
        total_indexed_records INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        last_imported_at TEXT,
        validation_notes TEXT
    );

    -- 6. Machine Learning Model Registry
    CREATE TABLE IF NOT EXISTS model_versions (
        model_id TEXT PRIMARY KEY,
        task_name TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        training_samples INTEGER,
        metrics_json TEXT NOT NULL,
        artifact_path TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_active INTEGER DEFAULT 0
    );
    """)

    conn.commit()
    conn.close()

def record_dataset_import(
    dataset_key: str,
    name: str,
    source_url: str,
    file_path: str,
    file_size_bytes: int,
    total_raw_records: int,
    total_indexed_records: int,
    status: str,
    validation_notes: str
):
    """Upserts the live status and validation details of an external dataset."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO dataset_imports (
        dataset_key, name, source_url, file_path, file_size_bytes,
        total_raw_records, total_indexed_records, status, last_imported_at, validation_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(dataset_key) DO UPDATE SET
        file_size_bytes = excluded.file_size_bytes,
        total_raw_records = excluded.total_raw_records,
        total_indexed_records = excluded.total_indexed_records,
        status = excluded.status,
        last_imported_at = excluded.last_imported_at,
        validation_notes = excluded.validation_notes;
    """, (
        dataset_key, name, source_url, file_path, file_size_bytes,
        total_raw_records, total_indexed_records, status, datetime.now().isoformat() + "Z", validation_notes
    ))
    conn.commit()
    conn.close()

def get_all_dataset_statuses() -> Dict[str, Any]:
    """Retrieves verified database and file integrity status for all datasets."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dataset_imports")
    rows = cursor.fetchall()
    conn.close()

    result = {}
    for r in rows:
        result[r["dataset_key"]] = {
            "name": r["name"],
            "source_url": r["source_url"],
            "file_path": r["file_path"],
            "file_size_bytes": r["file_size_bytes"],
            "file_size_mb": round(r["file_size_bytes"] / (1024 * 1024), 2) if r["file_size_bytes"] else 0,
            "total_raw_records": r["total_raw_records"],
            "total_indexed_records": r["total_indexed_records"],
            "status": r["status"],
            "last_imported_at": r["last_imported_at"],
            "validation_notes": r["validation_notes"]
        }
    return result

if __name__ == "__main__":
    init_db()
    print("Fixora SQLite database initialized successfully at:", get_db_path())
