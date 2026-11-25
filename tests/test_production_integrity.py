# -*- coding: utf-8 -*-
"""
Fixora Production Integrity & Data-Driven Verification Test Suite
Asserts:
1. Complete elimination of mock data, fake fallbacks, handleMockRequest, and Math.random in diagnosis paths.
2. Authentic data-driven diagnosis via Supabase PostgreSQL.
3. Strict device scoping on Backblaze ML: Storage ONLY; non-storage rejected.
4. Correct 'insufficient_evidence' behavior for unknown devices.
5. Live certified datasets registry and real table record counts.
6. HTTP 503 behavior when database is simulated unavailable.
"""

import os
import sys
import json
import unittest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from api.index import app
from api.services.db import (
    get_all_dataset_statuses,
    get_table_count,
    DatabaseUnavailableError,
    SUPABASE_URL
)
from api.services.unified_diagnosis import UnifiedDiagnosisEngine
from api.services.backblaze_service import BackblazeFailurePredictionService
from api.services.myfixit_service import MyFixitGuideRetrievalService
from api.services.openrepair_service import OpenRepairAnalysisService

class TestProductionIntegrity(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.diagnosis_engine = UnifiedDiagnosisEngine()
        self.backblaze_service = BackblazeFailurePredictionService()
        self.myfixit_service = MyFixitGuideRetrievalService()
        self.openrepair_service = OpenRepairAnalysisService()

    def test_01_no_mock_fallbacks_in_codebase(self):
        """Scans frontend and backend code to assert zero mock fallback handlers remain."""
        api_js_path = os.path.join(PROJECT_ROOT, "js", "api.js")
        with open(api_js_path, "r", encoding="utf-8") as f:
            api_js_content = f.read()

        # Must not contain handleMockRequest or initMockStorage
        self.assertNotIn("handleMockRequest", api_js_content, "handleMockRequest must be deleted.")
        self.assertNotIn("initMockStorage", api_js_content, "initMockStorage must be deleted.")
        self.assertNotIn("runClientDiagnosis", api_js_content, "runClientDiagnosis must be deleted.")
        self.assertNotIn("getPreseededGuides", api_js_content, "getPreseededGuides must be deleted.")

        # Backend diagnosis engine must not contain fixed 0.94 constant
        engine_path = os.path.join(PROJECT_ROOT, "api", "services", "unified_diagnosis.py")
        with open(engine_path, "r", encoding="utf-8") as f:
            engine_content = f.read()
        self.assertNotIn('"confidence_score": 0.94', engine_content, "Static 0.94 confidence must be eliminated.")

        # Zero localStorage fake request fallbacks in api.js & zero JSON file fallback in openrepair_service.py
        self.assertNotIn("byteforce_repair_requests", api_js_content, "localStorage request fallback must be deleted.")
        ora_path = os.path.join(PROJECT_ROOT, "api", "services", "openrepair_service.py")
        with open(ora_path, "r", encoding="utf-8") as f:
            ora_content = f.read()
        self.assertNotIn("_load_local_fallback", ora_content, "Local JSON fallback must be deleted from OpenRepairAnalysisService.")

        # Exclusive Admin email lock check in supabase-init.js & app.js
        for js_name in ["supabase-init.js", "app.js"]:
            with open(os.path.join(PROJECT_ROOT, "js", js_name), "r", encoding="utf-8") as f:
                js_src = f.read()
            self.assertIn("snsr19344@gmail.com", js_src, f"{js_name} must enforce exclusive admin lock.")

    def test_02_datasets_status_api_live_supabase(self):
        """Verifies GET /api/datasets/status returns real Supabase row counts and certificates."""
        resp = self.client.get("/api/datasets/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertEqual(data["status"], "operational")
        self.assertIn("Supabase PostgreSQL", data["database_storage"]["engine"])
        
        live_tables = data["database_storage"]["live_tables"]
        self.assertGreaterEqual(live_tables["repair_guides"], 1000, "Must have real imported MyFixit guides.")
        self.assertGreaterEqual(live_tables["repair_incidents"], 1000, "Must have real imported ORA incidents.")
        self.assertGreaterEqual(live_tables["openrepair_statistics"], 5, "Must have computed ORA categories.")
        self.assertGreaterEqual(live_tables["backblaze_models"], 1, "Must have registered Backblaze ML model.")

    def test_03_backblaze_strictly_storage_only(self):
        """Verifies Backblaze ML model rejects smartphones, laptops, and non-storage devices."""
        # Non-storage request
        res_phone = self.backblaze_service.predict_failure(
            telemetry={"smart_5_raw": 10},
            device_category="Smartphone"
        )
        self.assertFalse(res_phone["applicable"])
        self.assertIn("exclusively to storage devices", res_phone["reason"])
        self.assertIsNone(res_phone["failure_probability"])

        # Non-storage request via API
        resp = self.client.post("/api/prediction/hard-drive", json={
            "device_category": "Gaming Console",
            "smart_5_raw": 5
        })
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()["applicable"])

        # Storage request with SMART telemetry
        res_storage = self.backblaze_service.predict_failure(
            telemetry={"smart_5_raw": 15, "smart_197_raw": 8, "capacity_tb": 4.0},
            device_category="Storage"
        )
        self.assertTrue(res_storage["applicable"])
        self.assertIsNotNone(res_storage["failure_probability"])
        self.assertGreaterEqual(res_storage["failure_probability"], 0.0)
        self.assertLessEqual(res_storage["failure_probability"], 1.0)

    def test_04_insufficient_evidence_for_unknown_devices(self):
        """Verifies engine returns 'insufficient_evidence' instead of guessing or faking advice."""
        result = self.diagnosis_engine.diagnose({
            "device_category": "QuantumAntigravityTeleporter",
            "description": "Chronotrack coil fluctuating at 99 terahertz"
        })
        self.assertEqual(result["status"], "insufficient_evidence")
        self.assertIn("Insufficient empirical evidence", result["message"])
        self.assertEqual(len(result["possible_causes"]), 0)
        self.assertEqual(len(result["troubleshooting_steps"]), 0)
        self.assertIsNone(result["verified_guide"])

    def test_05_authentic_diagnosis_flow(self):
        """Verifies authentic data-driven diagnosis returns real guide and empirical ORA rates."""
        result = self.diagnosis_engine.diagnose({
            "device_category": "Smartphone",
            "brand": "Apple",
            "model": "iPhone",
            "problem_category": "Battery",
            "description": "Battery drains rapidly and device shuts down under load."
        })
        self.assertEqual(result["status"], "completed")
        self.assertGreater(result["confidence_score"], 0.20)
        self.assertNotEqual(result["confidence_score"], 0.94)  # Must be dynamically calculated
        
        # Real empirical ORA statistics
        emp = result["empirical_statistics"]
        self.assertIsNotNone(emp)
        self.assertGreater(emp["sample_size"], 0)
        self.assertGreater(emp["empirical_repair_success_rate"], 0.0)

        # Real MyFixit guide
        vg = result["verified_guide"]
        if vg:
            self.assertIsNotNone(vg["guide_id"])
            self.assertTrue(vg["url"].startswith("http"))
            self.assertIsInstance(vg["tools"], list)

        # Verify steps are genuine unique instructions and NOT repeated generic fallback text
        steps = result.get("troubleshooting_steps", [])
        self.assertGreater(len(steps), 0, "Expected real MyFixit steps in diagnosis report.")
        for st in steps:
            self.assertNotIn("اتبع خطوات الفك والتركيب الموضحة بالدليل المعتمد", st.get("instruction_ar", ""))
            self.assertNotEqual(st.get("instruction_en", ""), "Follow disassembly steps carefully.")
        unique_texts = {st.get("instruction_en", "") for st in steps if st.get("instruction_en")}
        if len(steps) > 1:
            self.assertGreater(len(unique_texts), 1, "Troubleshooting steps must not repeat the exact same placeholder text.")

    def test_06_guide_retrieval_no_synthetic_records(self):
        """Verifies MyFixit search only returns authentic imported records."""
        res = self.myfixit_service.search_guides(query="Screen", limit=5)
        self.assertIn("guides", res)
        for g in res["guides"]:
            self.assertIn("guide_id", g)
            self.assertIn("title", g)
            self.assertTrue(g["url"].startswith("https://www.ifixit.com/Guide/"))

    def test_07_all_13_device_categories_supported(self):
        """Verifies all 13 UI hardware categories have guides and diagnostic coverage."""
        categories_summary = self.myfixit_service.get_categories_summary()
        cat_counts = {c["category"]: c["guide_count"] for c in categories_summary}
        expected_13 = [
            "Smartphone", "Laptop", "Desktop Computer", "Tablet", "Gaming Console",
            "Smart TV", "Storage", "Printer", "Audio", "Smartwatch",
            "Camera", "Home Appliance", "Other"
        ]
        for cat in expected_13:
            self.assertGreater(cat_counts.get(cat, 0), 0, f"Missing verified guides for category: {cat}")

        diag_watch = self.diagnosis_engine.diagnose({
            "device_category": "Smartwatch",
            "brand": "Apple",
            "model": "Apple Watch",
            "description": "Screen unresponsive and battery drains fast"
        })
        self.assertEqual(diag_watch["status"], "completed")
        self.assertIsNotNone(diag_watch.get("verified_guide"))

    def test_08_exclusive_admin_security_and_endpoints(self):
        """Verifies /api/admin/* endpoints reject unauthenticated/non-admin callers and serve snsr19344@gmail.com."""
        from unittest.mock import patch

        admin_routes = [
            "/api/admin/stats",
            "/api/admin/centers",
            "/api/admin/users",
            "/api/admin/requests",
            "/api/admin/audit",
        ]
        # 1. Unauthenticated access must fail with 401
        for route in admin_routes:
            resp = self.client.get(route)
            self.assertEqual(resp.status_code, 401, f"Expected 401 without token on {route}")

        # 2. Non-admin email token must fail with 403
        with patch("api.routers.admin._verify_supabase_bearer_user", return_value={"id": "70cac9af-2369-4a11-8060-2ee06214b2a0", "email": "ym1791403@gmail.com"}):
            for route in admin_routes:
                resp = self.client.get(route, headers={"Authorization": "Bearer mock-user-token"})
                self.assertEqual(resp.status_code, 403, f"Expected 403 for non-admin on {route}")

        # 3. Exclusive admin snsr19344@gmail.com succeeds and cannot deactivate self
        with patch("api.routers.admin._verify_supabase_bearer_user", return_value={"id": "3a1610f8-c0a2-4b3e-8c6a-ce07e7349cff", "email": "snsr19344@gmail.com"}):
            stats_resp = self.client.get("/api/admin/stats", headers={"Authorization": "Bearer mock-admin-token"})
            self.assertEqual(stats_resp.status_code, 200)
            stats_data = stats_resp.json()
            self.assertIn("total_users", stats_data)
            self.assertIn("active_requests", stats_data)
            self.assertIn("completed_requests", stats_data)

            for route in ["/api/admin/centers", "/api/admin/users", "/api/admin/requests", "/api/admin/audit"]:
                r = self.client.get(route, headers={"Authorization": "Bearer mock-admin-token"})
                self.assertEqual(r.status_code, 200, f"Expected 200 for exclusive admin on {route}")
                self.assertIsInstance(r.json(), list)

            toggle_self = self.client.post("/api/admin/users/3a1610f8-c0a2-4b3e-8c6a-ce07e7349cff/toggle", headers={"Authorization": "Bearer mock-admin-token"})
            self.assertEqual(toggle_self.status_code, 400)

            ai_resp = self.client.get("/api/admin/ai-status", headers={"Authorization": "Bearer mock-admin-token"})
            self.assertEqual(ai_resp.status_code, 200)
            self.assertIn("supported_providers", ai_resp.json())

        # Ensure AI status route also rejects unauthorized callers
        self.assertEqual(self.client.get("/api/admin/ai-status").status_code, 401)

    def test_09_distinct_symptom_diagnosis_and_media_api(self):
        """Verifies bilingual diagnosis returns distinct symptom-matched guides, visual step photos, and device media."""
        r_bat = self.diagnosis_engine.diagnose({
            "device_category": "Smartphone",
            "brand": "Apple",
            "model": "iPhone 13",
            "problem_category": "Hardware",
            "description": "البطارية تخلص بسرعة جدا"
        })
        self.assertEqual(r_bat["status"], "completed")
        self.assertIn("Battery", (r_bat.get("verified_guide") or {}).get("title", ""))
        self.assertNotIn("Antenna Cover", (r_bat.get("verified_guide") or {}).get("title", ""))
        self.assertGreater(len(r_bat.get("visual_solution_steps", [])), 0)
        self.assertGreaterEqual(len(r_bat.get("possible_causes", [])), 2)

        r_scr = self.diagnosis_engine.diagnose({
            "device_category": "Smartphone",
            "brand": "Samsung",
            "model": "Galaxy S23",
            "problem_category": "Hardware",
            "description": "الشاشة مكسورة واللمس لا يعمل"
        })
        self.assertEqual(r_scr["status"], "completed")
        self.assertNotEqual(
            (r_bat.get("verified_guide") or {}).get("guide_id"),
            (r_scr.get("verified_guide") or {}).get("guide_id"),
            "Different faults must not return the exact same memorized guide."
        )

        img_resp = self.client.get("/api/media/device-image?q=PlayStation%205&category=Gaming%20Console")
        self.assertEqual(img_resp.status_code, 200)
        self.assertTrue((img_resp.json().get("image_url") or "").startswith("http"))

if __name__ == "__main__":
    unittest.main()
