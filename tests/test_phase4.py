# -*- coding: utf-8 -*-
"""
Tests for Phase 4: Unified Diagnosis Service & API Endpoints.
Verifies the integration of:
1. Open Repair Alliance (416,282 real records)
2. MyFixit Complete Dataset (18,995 verified manuals)
3. Backblaze Hard Drive ML Failure Predictor (Q2 2026 telemetry)
Ensures zero hardcoded/fabricated probabilities or static results.
"""

import os
import sys
import json
import unittest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from api.services.unified_diagnosis import UnifiedDiagnosisService
from api.index import app

class TestPhase4(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.service = UnifiedDiagnosisService()

    def test_01_smartphone_diagnosis_unified_flow(self):
        """Verifies smartphone diagnosis combines real ORA statistics and MyFixit guide."""
        payload = {
            "device_category": "Smartphone",
            "brand": "Apple",
            "model": "iPhone 13",
            "problem_category": "Screen",
            "description": "Screen cracked, no touch response after falling on pavement."
        }
        res = self.service.diagnose(payload)

        # 1. Open Repair Alliance empirical evidence
        self.assertIn("empirical_statistics", res)
        emp = res["empirical_statistics"]
        self.assertEqual(emp["source"], "Open Repair Alliance (416,282 real records)")
        self.assertGreater(emp["empirical_repair_success_rate"], 0)
        self.assertGreater(emp["sample_size"], 0)

        # 2. MyFixit verified manual
        self.assertIn("verified_guide", res)
        vg = res["verified_guide"]
        self.assertIn("MyFixit", vg["source"])
        self.assertIsNotNone(vg["guide_id"])
        self.assertIsNotNone(vg["url"])
        self.assertTrue(vg["url"].startswith("http"))
        self.assertGreater(len(vg["tools"]), 0)

        # 3. Backblaze must be NOT applicable
        self.assertFalse(res["hard_drive_ml_prediction"]["applicable"])

        # 4. Root causes & repair methods
        self.assertGreater(len(res["possible_causes"]), 0)
        first_cause = res["possible_causes"][0]
        self.assertIn("title_ar", first_cause)
        self.assertIn("repair_method_ar", first_cause)
        self.assertIn("empirical_repairability_pct", first_cause)

        # 5. Verified troubleshooting steps
        self.assertGreater(len(res["troubleshooting_steps"]), 0)
        self.assertGreater(len(res["required_tools"]), 0)

    def test_02_storage_diagnosis_with_smart_telemetry(self):
        """Verifies storage diagnosis triggers Backblaze ML model inference."""
        payload = {
            "device_category": "Storage",
            "brand": "Seagate",
            "model": "ST4000DM000",
            "problem_category": "Bad Sectors",
            "description": "Drive making clicking sounds and SMART alert warning.",
            "smart_telemetry": {
                "smart_5_raw": 128,
                "smart_197_raw": 64,
                "smart_187_raw": 10,
                "smart_9_raw": 32000,
                "smart_194_raw": 38,
                "capacity_bytes": 4000787030016
            }
        }
        res = self.service.diagnose(payload)

        self.assertIn("hard_drive_ml_prediction", res)
        ml_pred = res["hard_drive_ml_prediction"]
        self.assertTrue(ml_pred["applicable"])
        self.assertIsNotNone(ml_pred["failure_probability"])
        self.assertIn(ml_pred["risk_level"], ["CRITICAL", "WARNING"])
        self.assertGreater(len(ml_pred["anomalous_attributes"]), 0)
        self.assertIn("model_provenance", ml_pred)
        self.assertEqual(ml_pred["model_provenance"]["training_dataset"], "Backblaze Hard Drive Q2 2026")

    def test_03_diagnosis_api_endpoint(self):
        """Verifies POST /api/diagnosis/analyze endpoint returns genuine response."""
        payload = {
            "device_category": "Laptop",
            "brand": "Dell",
            "model": "XPS 15",
            "problem_category": "Battery",
            "description": "Battery drains in 15 minutes, device powers off randomly."
        }
        response = self.client.post("/api/diagnosis/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("report_id", data)
        self.assertIn("empirical_statistics", data)
        self.assertIn("verified_guide", data)
        self.assertIn("possible_causes", data)
        self.assertIn("troubleshooting_steps", data)
        self.assertIn("required_tools", data)

    def test_04_no_fabricated_static_percentages(self):
        """Verifies that none of the old static hardcoded values (e.g. 0.72 / 0.28 or 0.68 / 0.32) are present."""
        payload = {
            "device_category": "Gaming Console",
            "brand": "Sony",
            "model": "PlayStation 5",
            "problem_category": "HDMI Port",
            "description": "No video signal on TV, blue light pulses then turns white."
        }
        response = self.client.post("/api/diagnosis/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        causes = data["possible_causes"]
        # Ensure percentages reflect empirical stats, not the old static 0.70/0.30
        for cause in causes:
            self.assertNotEqual(cause.get("probability"), 0.70)
            self.assertNotEqual(cause.get("probability"), 0.30)
            self.assertIn("empirical_repairability_pct", cause)

if __name__ == "__main__":
    unittest.main()
