# -*- coding: utf-8 -*-
"""
Tests for Phase 2: MyFixit Guide Retrieval Service and API Endpoints.
Verifies search, category filtering, full-text ranking, and detail retrieval
against the authentic 18,995 indexed guides.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from api.services.myfixit_service import MyFixitGuideRetrievalService
from api.index import app

class TestPhase2(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.guide_service = MyFixitGuideRetrievalService()

    def test_01_myfixit_total_records_indexed(self):
        """Verify all 18,995 verified guides are indexed and accessible."""
        res = self.guide_service.search_guides(limit=1)
        self.assertEqual(res["total_matching"], 18995, f"Expected 18,995 indexed guides, got {res['total_matching']}")

    def test_02_myfixit_categories_summary(self):
        """Verify distinct categories exist with positive guide counts."""
        categories = self.guide_service.get_categories_summary()
        self.assertGreater(len(categories), 0)
        total_guides = sum(c["guide_count"] for c in categories)
        self.assertEqual(total_guides, 18995)
        category_names = [c["category"] for c in categories]
        self.assertTrue(any(c in category_names for c in ["Smartphones", "Laptops", "Audio", "Tablets", "Consoles"]))

    def test_03_myfixit_full_text_search(self):
        """Verify SQLite FTS5 search finds relevant repair guides."""
        res = self.guide_service.search_guides(query="battery replacement", limit=5)
        self.assertGreater(res["total_matching"], 0)
        self.assertGreater(len(res["guides"]), 0)
        first = res["guides"][0]
        self.assertIn("guide_id", first)
        self.assertIn("title", first)
        self.assertTrue("battery" in first["title"].lower() or "battery" in (first["summary"] or "").lower())

    def test_04_myfixit_guide_detail_retrieval(self):
        """Verify retrieving a single guide returns authentic steps, tools, and URL."""
        res = self.guide_service.search_guides(limit=1)
        guide_id = res["guides"][0]["guide_id"]
        guide = self.guide_service.get_guide_by_id(guide_id)
        self.assertIsNotNone(guide)
        self.assertEqual(guide["guide_id"], guide_id)
        self.assertIn("steps", guide)
        self.assertIsInstance(guide["steps"], list)
        self.assertIn("toolbox", guide)
        self.assertIsInstance(guide["toolbox"], list)
        self.assertIn("url", guide)
        self.assertTrue(guide["url"].startswith("http"))

    def test_05_guides_api_list_endpoint(self):
        """Verify GET /api/guides returns results from real dataset."""
        response = self.client.get("/api/guides?limit=10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_matching", data)
        self.assertEqual(data["total_matching"], 18995)
        self.assertEqual(len(data["guides"]), 10)

    def test_06_guides_api_search_endpoint(self):
        """Verify GET /api/guides?q=screen returns matching guides."""
        response = self.client.get("/api/guides?q=screen&limit=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["total_matching"], 0)
        self.assertLessEqual(len(data["guides"]), 5)

    def test_07_guides_api_single_guide_endpoint(self):
        """Verify GET /api/guides/{id} returns guide details or 404."""
        list_res = self.client.get("/api/guides?limit=1")
        guide_id = list_res.json()["guides"][0]["guide_id"]

        response = self.client.get(f"/api/guides/{guide_id}")
        self.assertEqual(response.status_code, 200)
        guide = response.json()
        self.assertEqual(guide["guide_id"], guide_id)
        self.assertIn("steps", guide)

        # Non-existent ID returns 404
        bad_res = self.client.get("/api/guides/99999999")
        self.assertEqual(bad_res.status_code, 404)

if __name__ == "__main__":
    unittest.main()
