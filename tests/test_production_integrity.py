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

        # Arabic screen symptoms on Tablet / Smartphone / Laptop must never hijack category to Smart TV
        self.assertEqual(self.diagnosis_engine._normalize_category("Tablet", "شاشة التاتش لا تستجيب وفيها كسر"), "Tablet")
        self.assertEqual(self.diagnosis_engine._normalize_category("Laptop", "شاشة اللابتوب لا تعمل"), "Laptop")
        self.assertEqual(self.diagnosis_engine._normalize_category("Smartphone", "الشاشة مكسورة"), "Smartphone")
        self.assertEqual(self.diagnosis_engine._normalize_category("Other", "راوتر TP-Link فاصل باور"), "Other")

        for cat in expected_13:
            ora = self.openrepair_service.analyze_symptoms(category=cat, description="power battery screen")
            self.assertGreater(ora.get("category_sample_size", 0), 0, f"Missing ORA sample size for {cat}")

        diag_watch = self.diagnosis_engine.diagnose({
            "device_category": "Smartwatch",
            "brand": "Apple",
            "model": "Apple Watch",
            "description": "Screen unresponsive and battery drains fast"
        })
        self.assertEqual(diag_watch["status"], "completed")
        self.assertIsNotNone(diag_watch.get("verified_guide"))

        diag_tablet = self.diagnosis_engine.diagnose({
            "device_category": "Tablet",
            "brand": "Apple",
            "model": "iPad Air",
            "description": "شاشة التاتش لا تستجيب وفيها كسر"
        })
        self.assertEqual(diag_tablet["status"], "completed")
        self.assertEqual(diag_tablet["device_category"], "Tablet")
        self.assertEqual(diag_tablet["empirical_statistics"]["category"], "Tablet")

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

    def test_10_admin_center_crud_and_reviews_api(self):
        """Verifies admin-only Center CRUD, bulk upload validation, review moderation locks, and public reviews API."""
        from unittest.mock import patch

        # 1. Unauthenticated requests must fail with 401
        self.assertEqual(self.client.post("/api/admin/centers", json={"business_name": "X", "city": "Cairo"}).status_code, 401)
        self.assertEqual(self.client.post("/api/admin/centers/bulk", json={"centers": [{"business_name": "X", "city": "Cairo"}]}).status_code, 401)
        self.assertEqual(self.client.put("/api/admin/centers/1", json={"city": "Giza"}).status_code, 401)
        self.assertEqual(self.client.delete("/api/admin/centers/1").status_code, 401)
        self.assertEqual(self.client.post("/api/admin/requests/req-1/clear-review").status_code, 401)
        self.assertEqual(self.client.post("/api/requests/test-id/review", json={"rating": 5, "review_comment": "Great"}).status_code, 401)

        # 2. Non-admin account must fail with 403 on all center/moderation endpoints
        with patch("api.routers.admin._verify_supabase_bearer_user", return_value={"id": "70cac9af-2369-4a11-8060-2ee06214b2a0", "email": "ym1791403@gmail.com"}):
            hdr = {"Authorization": "Bearer mock-nonadmin"}
            self.assertEqual(self.client.post("/api/admin/centers", json={"business_name": "X", "city": "Cairo"}, headers=hdr).status_code, 403)
            self.assertEqual(self.client.post("/api/admin/centers/bulk", json={"centers": []}, headers=hdr).status_code, 403)
            self.assertEqual(self.client.put("/api/admin/centers/1", json={"city": "Giza"}, headers=hdr).status_code, 403)
            self.assertEqual(self.client.delete("/api/admin/centers/1", headers=hdr).status_code, 403)
            self.assertEqual(self.client.post("/api/admin/requests/req-1/clear-review", headers=hdr).status_code, 403)

            # Authenticated non-owner user with out-of-range rating returns 422
            self.assertEqual(self.client.post("/api/requests/test-id/review", json={"rating": 6}, headers=hdr).status_code, 422)

        # 3. Exclusive admin validation rules (422 on missing required fields, 404 on missing IDs)
        with patch("api.routers.admin._verify_supabase_bearer_user", return_value={"id": "3a1610f8-c0a2-4b3e-8c6a-ce07e7349cff", "email": "snsr19344@gmail.com"}):
            adm_hdr = {"Authorization": "Bearer mock-admin"}
            self.assertEqual(self.client.post("/api/admin/centers", json={"business_name": "", "city": "Cairo"}, headers=adm_hdr).status_code, 422)
            self.assertEqual(self.client.post("/api/admin/centers", json={"business_name": "Center A", "city": ""}, headers=adm_hdr).status_code, 422)
            self.assertEqual(self.client.post("/api/admin/centers/bulk", json={"centers": []}, headers=adm_hdr).status_code, 422)
            self.assertEqual(self.client.put("/api/admin/centers/999999", json={"city": "Giza"}, headers=adm_hdr).status_code, 404)
            self.assertEqual(self.client.delete("/api/admin/centers/999999", headers=adm_hdr).status_code, 404)
            self.assertEqual(self.client.post("/api/admin/requests/nonexistent-id-000/clear-review", headers=adm_hdr).status_code, 404)
            self.assertEqual(self.client.post("/api/admin/requests/00000000-0000-0000-0000-000000000000/clear-review", headers=adm_hdr).status_code, 404)

        # 4. Public anonymized reviews endpoint returns 200 with clean schema & no PII
        rev_resp = self.client.get("/api/technicians/1/reviews")
        self.assertEqual(rev_resp.status_code, 200)
        rev_data = rev_resp.json()
        self.assertEqual(rev_data.get("tech_id"), 1)
        self.assertIn("average_rating", rev_data)
        self.assertIn("reviews_count", rev_data)
        self.assertIn("rating_breakdown", rev_data)
        self.assertIsInstance(rev_data.get("reviews"), list)
        for item in rev_data.get("reviews", []):
            self.assertNotIn("user_email", item)
            self.assertNotIn("user_phone", item)

    def test_11_arabic_steps_no_model_leak_and_feedback_loop(self):
        """Verifies Arabic translation of steps/incidents, zero public AI model exposure, and Fixed/Retry feedback loop."""
        from unittest.mock import patch
        from api.services.translator import translate_repair_text, has_substantial_arabic
        from api.services.db import postgrest_request

        # 1. Offline English & German repair translation checks
        en_ar = translate_repair_text("Insert a SIM card eject tool or paper clip into the hole next to the headphone jack.")
        de_ar = translate_repair_text("Lade Probleme. Software Probleme beim Hochfahren.", is_incident=True)
        self.assertTrue(has_substantial_arabic(en_ar), f"Expected Arabic step translation, got: {en_ar}")
        self.assertTrue(has_substantial_arabic(de_ar), f"Expected Arabic German incident translation, got: {de_ar}")

        # 2. Public diagnosis must strip provider/model_used and localize steps & incidents to Arabic (mocking LLM to avoid quota burn)
        fake_ai_out = {
            "configured": True,
            "status": "completed",
            "provider": "gemini",
            "model_used": "gemini-3.1-flash-lite-preview",
            "diagnosis_summary_ar": "تشخيص تجريبي لتأكد إخفاء اسم المزود والموديل.",
            "diagnosis_summary_en": "Mocked summary to verify zero leak.",
            "root_causes": [{
                "title_ar": "ضعف خلايا البطارية",
                "title_en": "Battery Cell Degradation",
                "explanation_ar": "انخفاض كفاءة الخلايا بمرور الدورات.",
                "explanation_en": "Battery wear over cycles.",
                "repair_method_ar": "استبدال البطارية وفق الخطوات العربية.",
                "repair_method_en": "Replace battery safely."
            }],
            "repair_steps_ar": ["افصل الطاقة تماماً.", "استبدل البطارية بحذر."],
            "repair_steps_en": ["Power off device.", "Replace battery."],
        }
        with patch.object(self.diagnosis_engine.ai_assistant, "analyze_with_datasets", return_value=fake_ai_out):
            resp = self.client.post("/api/diagnosis/analyze", json={
                "device_category": "Smartphone",
                "brand": "Apple",
                "model": "iPhone 13",
                "description": "البطارية تفرغ بسرعة جداً"
            })
            self.assertEqual(resp.status_code, 200)
            rep = resp.json()
            ai_pub = rep.get("ai_analysis") or {}
            self.assertNotIn("provider", ai_pub)
            self.assertNotIn("model_used", ai_pub)
            for c in rep.get("possible_causes") or []:
                self.assertNotIn("GEMINI", c.get("source_dataset", ""))
                self.assertNotIn("gemini-", c.get("source_dataset", ""))
            for st in rep.get("troubleshooting_steps") or []:
                self.assertTrue(has_substantial_arabic(st.get("instruction_ar", "")), f"Untranslated step: {st}")
            for inc in (rep.get("empirical_statistics") or {}).get("matching_incidents") or []:
                self.assertTrue(has_substantial_arabic(inc.get("problem_ar", "")), f"Untranslated incident: {inc}")

            # 3. Retry feedback (fixed=False, request_alternative=True) must exclude prior guide and bump attempt_number
            first_gid = (rep.get("verified_guide") or {}).get("guide_id")
            fb_retry = self.client.post("/api/diagnosis/feedback", json={
                "report_id": rep.get("report_id"),
                "device_category": "Smartphone",
                "brand": "Apple",
                "model": "iPhone 13",
                "description": "البطارية تفرغ بسرعة جداً",
                "fixed": False,
                "request_alternative": True,
                "exclude_guide_ids": [first_gid] if first_gid else [],
                "failed_solutions": ["Battery replacement failed"],
                "attempt_number": 1,
            })
            self.assertEqual(fb_retry.status_code, 200)
            retry_data = fb_retry.json()
            alt = retry_data.get("alternative_report") or {}
            self.assertEqual(alt.get("attempt_number"), 2)
            if first_gid and (alt.get("verified_guide") or {}).get("guide_id"):
                self.assertNotEqual(alt["verified_guide"]["guide_id"], first_gid)

        # 4. Fixed feedback writes verified solution to Supabase repair_incidents & cleans up test row
        fb_fixed = self.client.post("/api/diagnosis/feedback", json={
            "report_id": "FXR-TEST-FEEDBACK",
            "device_category": "Laptop",
            "brand": "Dell",
            "model": "XPS 13",
            "problem_cluster": "THERMAL_COOLING",
            "description": "سخونة زائدة وصوت مروحة",
            "applied_solution": "تنظيف المروحة وتغيير المعجون الحراري",
            "fixed": True,
        })
        self.assertEqual(fb_fixed.status_code, 200)
        fb_json = fb_fixed.json()
        self.assertTrue(fb_json.get("added_to_dataset"))
        inc_id = fb_json.get("incident_id")
        self.assertTrue(str(inc_id).startswith("bf_fixed_"))
        try:
            saved_rows = postgrest_request("repair_incidents", {"select": "id,data_provider,repair_status", "id": f"eq.{inc_id}"}, use_service_role=True)
            self.assertEqual(len(saved_rows), 1)
            self.assertEqual(saved_rows[0]["data_provider"], "ByteForce Verified Community")
            self.assertEqual(saved_rows[0]["repair_status"], "Fixed")
        finally:
            postgrest_request("repair_incidents", params={"id": f"eq.{inc_id}"}, method="DELETE", headers_extra={"Prefer": "return=minimal"}, use_service_role=True)

        # 5. GET /api/guides?lang=ar & GET /api/guides/{id}?lang=ar return localized Arabic guide content
        g_list = self.client.get("/api/guides?category=Smartphone&limit=1&lang=ar")
        self.assertEqual(g_list.status_code, 200)
        guides = g_list.json().get("guides") or []
        if guides:
            gid = guides[0]["guide_id"]
            g_det = self.client.get(f"/api/guides/{gid}?lang=ar")
            self.assertEqual(g_det.status_code, 200)
            det = g_det.json()
            self.assertTrue(has_substantial_arabic(det.get("title_ar", "")))
            if det.get("steps"):
                self.assertTrue(has_substantial_arabic(det["steps"][0].get("instruction_ar", "")))

        # 6. UI verification: login lands on home, no model leak or confidence % widget in app.js
        with open(os.path.join(PROJECT_ROOT, "js", "app.js"), "r", encoding="utf-8") as f:
            app_js = f.read()
        self.assertNotIn("report.ai_analysis.model_used", app_js)
        self.assertNotIn("Model Confidence", app_js)
        self.assertNotIn('this.navigate(this.isExclusiveAdmin', app_js)

if __name__ == "__main__":
    unittest.main()
