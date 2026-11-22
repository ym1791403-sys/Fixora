# -*- coding: utf-8 -*-
"""
Fixora Phase 1 Verification & Test Suite
Validates:
1. SQLite Database integrity & schema
2. Open Repair Alliance (416,282 records) ingestion & indexing
3. OpenRepairAnalysisService empirical calculations
4. FastAPI endpoints (/api/datasets/status, /api/analysis/openrepair)
"""

import os
import sys
import json
import sqlite3
import unittest

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from api.services.db import get_db_path, get_connection, get_all_dataset_statuses
from api.services.openrepair_service import OpenRepairAnalysisService
from fastapi.testclient import TestClient
from api.index import app

class TestPhase1(unittest.TestCase):

    def setUp(self):
        self.db_path = get_db_path()
        self.client = TestClient(app)
        self.service = OpenRepairAnalysisService()

    def test_01_database_exists_and_has_schema(self):
        """Verifies that the SQLite database exists and has all required entity tables."""
        self.assertTrue(os.path.exists(self.db_path), f"Database file missing at {self.db_path}")
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = {row[0] for row in cursor.fetchall()}
        conn.close()

        required_tables = {
            "repair_incidents",
            "repair_guides",
            "drive_telemetry",
            "diagnosis_reports",
            "dataset_imports",
            "model_versions"
        }
        for t in required_tables:
            self.assertIn(t, tables, f"Expected table '{t}' was not found in SQLite schema.")

    def test_02_openrepair_records_ingested(self):
        """Verifies that all 416,282 Open Repair Alliance records were ingested into SQLite."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM repair_incidents;")
        count = cursor.fetchone()[0]
        conn.close()

        self.assertEqual(count, 416282, f"Expected 416,282 records, found {count}")

    def test_03_dataset_import_metadata_verified(self):
        """Verifies that dataset_imports contains verified, non-fabricated metadata."""
        statuses = get_all_dataset_statuses()
        self.assertIn("open_repair_alliance", statuses, "Open Repair Alliance status missing.")

        ora = statuses["open_repair_alliance"]
        self.assertEqual(ora["status"], "operational")
        self.assertEqual(ora["total_raw_records"], 416282)
        self.assertEqual(ora["total_indexed_records"], 416282)
        self.assertGreater(ora["file_size_bytes"], 80000000)
        self.assertTrue(os.path.exists(ora["file_path"]), f"Source CSV not found at {ora['file_path']}")

    def test_04_openrepair_analysis_service_categories(self):
        """Verifies that category summaries reflect real counts and empirical fix rates."""
        categories = self.service.get_categories()
        self.assertGreaterEqual(len(categories), 8)

        cat_names = [c["category"] for c in categories]
        self.assertIn("Laptop", cat_names)
        self.assertIn("Smartphone", cat_names)
        self.assertIn("Audio", cat_names)

        laptop_cat = next(c for c in categories if c["category"] == "Laptop")
        self.assertEqual(laptop_cat["incident_count"], 16955)
        # Empirical fix rate for laptops should be between 50% and 60%
        self.assertGreater(laptop_cat["fix_rate"], 0.50)
        self.assertLess(laptop_cat["fix_rate"], 0.60)

    def test_05_openrepair_symptom_analysis(self):
        """Verifies symptom analysis against empirical failure distributions."""
        analysis = self.service.analyze_symptoms(
            category="Laptop",
            description="battery draining fast and overheating fan",
            brand="Lenovo",
            age=4.5
        )

        self.assertEqual(analysis["analyzed_category"], "Laptop")
        self.assertEqual(analysis["category_sample_size"], 16955)
        self.assertIn(analysis["matched_failure_cluster"], ["BATTERY_CHARGING", "THERMAL_OVERHEAT"])
        self.assertGreater(analysis["empirical_failure_frequency"], 0.0)
        self.assertGreater(analysis["incident_count_in_dataset"], 0)
        self.assertTrue(analysis["is_statistically_significant"])

        # Check empirical repair status
        status = analysis["empirical_repair_status"]
        self.assertGreater(status["fixed_rate"], 0.5)
        self.assertGreater(status["end_of_life_rate"], 0.1)

        # Check known barriers
        barriers = analysis["known_repair_barriers"]
        self.assertGreaterEqual(len(barriers), 1)
        self.assertTrue(any("Spare parts" in b["barrier"] or "Repair information" in b["barrier"] for b in barriers))

    def test_06_api_dataset_status_endpoint(self):
        """Verifies that GET /api/datasets/status returns genuine DB and file verification."""
        response = self.client.get("/api/datasets/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["status"], "operational")
        self.assertEqual(data["database_storage"]["engine"], "SQLite WAL Mode")
        self.assertGreaterEqual(data["database_storage"]["total_indexed_records"], 416282)

        ora = data["datasets"]["open_repair_alliance"]
        self.assertEqual(ora["total_indexed_records"], 416282)
        self.assertEqual(ora["status"], "operational")

    def test_07_api_analysis_openrepair_endpoints(self):
        """Verifies that GET /api/analysis/openrepair endpoints return genuine empirical data."""
        # 1. Metadata endpoint
        meta_res = self.client.get("/api/analysis/openrepair/metadata")
        self.assertEqual(meta_res.status_code, 200)
        meta = meta_res.json()
        self.assertEqual(meta["total_records_analyzed"], 416282)

        # 2. Categories endpoint
        cat_res = self.client.get("/api/analysis/openrepair/categories")
        self.assertEqual(cat_res.status_code, 200)
        cats = cat_res.json()
        self.assertGreaterEqual(len(cats), 8)

        # 3. Analyze query endpoint
        query_res = self.client.get("/api/analysis/openrepair?category=Laptop&description=screen+lines")
        self.assertEqual(query_res.status_code, 200)
        query_data = query_res.json()
        self.assertEqual(query_data["analyzed_category"], "Laptop")
        self.assertEqual(query_data["matched_failure_cluster"], "SCREEN_DISPLAY")
        self.assertEqual(query_data["category_sample_size"], 16955)

if __name__ == "__main__":
    unittest.main()
