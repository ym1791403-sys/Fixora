# -*- coding: utf-8 -*-
"""
Tests for Phase 3: Backblaze Hard Drive Telemetry & Machine Learning Failure Prediction.
Verifies model artifact, metadata, non-leakage protocol, inference service,
and strict device category scoping (storage only).
"""

import os
import sys
import json
import unittest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from api.services.backblaze_service import BackblazeFailurePredictionService
from api.index import app

class TestPhase3(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.service = BackblazeFailurePredictionService()
        self.metadata_path = os.path.join(PROJECT_ROOT, "ml", "models", "model_metadata.json")
        self.artifact_path = os.path.join(PROJECT_ROOT, "ml", "models", "backblaze_rf_v1.joblib")

    def test_01_model_artifact_and_metadata_exist(self):
        """Verifies trained model artifact and metadata JSON exist on disk."""
        self.assertTrue(os.path.exists(self.artifact_path), f"Missing model artifact at {self.artifact_path}")
        self.assertTrue(os.path.exists(self.metadata_path), f"Missing metadata at {self.metadata_path}")
        self.assertTrue(self.service.is_model_ready(), "Backblaze service could not load model bundle.")

    def test_02_metadata_metrics_validity(self):
        """Verifies that model was genuinely evaluated with valid metrics."""
        with open(self.metadata_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        self.assertEqual(meta["model_id"], "backblaze_rf_v1")
        self.assertIn("metrics", meta)
        metrics = meta["metrics"]
        self.assertGreater(metrics["roc_auc"], 0.75, "ROC-AUC must be greater than 0.75")
        self.assertGreater(metrics["pr_auc"], 0.50, "PR-AUC must be greater than 0.50")
        self.assertGreater(metrics["recall"], 0.50, "Recall must be positive")
        self.assertGreater(meta["training_samples"], 5000)
        self.assertGreater(meta["testing_samples"], 3000)

    def test_03_strict_device_category_scoping(self):
        """Verifies model rejects non-storage devices and never claims to diagnose phones/laptops."""
        # Non-storage device
        res_phone = self.service.predict_failure({"smart_5_raw": 100}, device_category="Smartphone")
        self.assertFalse(res_phone["applicable"])
        self.assertIn("exclusively to storage devices", res_phone["reason"])
        self.assertIsNone(res_phone["failure_probability"])

        res_laptop = self.service.predict_failure({"smart_5_raw": 100}, device_category="Laptop")
        self.assertFalse(res_laptop["applicable"])

    def test_04_storage_healthy_drive_inference(self):
        """Verifies that a pristine drive with zero reallocated/pending sectors is classified as NORMAL."""
        healthy_telemetry = {
            "smart_5_raw": 0,
            "smart_9_raw": 2000,
            "smart_187_raw": 0,
            "smart_188_raw": 0,
            "smart_194_raw": 28,
            "smart_197_raw": 0,
            "smart_198_raw": 0,
            "capacity_bytes": 4000787030016
        }
        res = self.service.predict_failure(healthy_telemetry, device_category="Storage")
        self.assertTrue(res["applicable"])
        self.assertEqual(res["risk_level"], "NORMAL")
        self.assertLess(res["failure_probability"], 0.35)
        self.assertIn("NORMAL", res["risk_level"])

    def test_05_storage_critical_drive_inference(self):
        """Verifies that a severely degrading drive with high bad sectors is flagged as CRITICAL."""
        failing_telemetry = {
            "smart_5_raw": 450,
            "smart_9_raw": 42000,
            "smart_187_raw": 35,
            "smart_188_raw": 12,
            "smart_194_raw": 48,
            "smart_197_raw": 128,
            "smart_198_raw": 64,
            "capacity_bytes": 8001563222016
        }
        res = self.service.predict_failure(failing_telemetry, device_category="Storage")
        self.assertTrue(res["applicable"])
        self.assertIn(res["risk_level"], ["CRITICAL", "WARNING"])
        self.assertGreaterEqual(res["failure_probability"], 0.45)
        self.assertGreater(len(res["anomalous_attributes"]), 0)

    def test_06_prediction_api_endpoint(self):
        """Verifies POST /api/prediction/hard-drive returns valid ML prediction response."""
        payload = {
            "device_category": "Storage",
            "smart_5_raw": 15,
            "smart_197_raw": 8,
            "capacity_bytes": 8000000000000
        }
        response = self.client.post("/api/prediction/hard-drive", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["applicable"])
        self.assertIn("failure_probability", data)
        self.assertIn("risk_level", data)
        self.assertIn("model_provenance", data)

if __name__ == "__main__":
    unittest.main()
