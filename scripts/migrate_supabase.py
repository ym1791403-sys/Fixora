# -*- coding: utf-8 -*-
"""
Fixora Supabase Database Migration
Applies production DDL, indexes, and tables for real datasets.
"""

import os
import json
import urllib.request

SUPABASE_MGMT_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "")
PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "czwndaulnxvmncbtzsao")

DDL_STATEMENTS = """
-- 1. Certified Datasets Metadata Enhancement
ALTER TABLE IF EXISTS public.certified_datasets 
  ADD COLUMN IF NOT EXISTS file_hash text,
  ADD COLUMN IF NOT EXISTS version text,
  ADD COLUMN IF NOT EXISTS schema_version text;

-- 2. Open Repair Incidents Table (Real Open Repair Alliance raw records)
CREATE TABLE IF NOT EXISTS public.repair_incidents (
  id text PRIMARY KEY,
  data_provider text,
  country text,
  partner_category text,
  normalized_category text NOT NULL,
  brand text,
  product_age numeric(5,1),
  repair_status text NOT NULL,
  repair_barrier text,
  problem text,
  problem_cluster text,
  event_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_repair_incidents_cat ON public.repair_incidents(normalized_category);
CREATE INDEX IF NOT EXISTS idx_repair_incidents_brand ON public.repair_incidents(brand);
CREATE INDEX IF NOT EXISTS idx_repair_incidents_status ON public.repair_incidents(repair_status);
CREATE INDEX IF NOT EXISTS idx_repair_incidents_cluster ON public.repair_incidents(problem_cluster);

ALTER TABLE public.repair_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read repair_incidents" ON public.repair_incidents;
CREATE POLICY "Allow public read repair_incidents" ON public.repair_incidents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service write repair_incidents" ON public.repair_incidents;
CREATE POLICY "Allow service write repair_incidents" ON public.repair_incidents FOR ALL USING (true);

-- 3. Enhance Repair Guides Table & Indexes
ALTER TABLE IF EXISTS public.repair_guides
  ADD COLUMN IF NOT EXISTS file_source text;

CREATE INDEX IF NOT EXISTS idx_repair_guides_cat ON public.repair_guides(device_category);
CREATE INDEX IF NOT EXISTS idx_repair_guides_diff ON public.repair_guides(difficulty);
CREATE INDEX IF NOT EXISTS idx_repair_guides_comp ON public.repair_guides(component);

-- 4. OpenRepair Statistics Columns
ALTER TABLE IF EXISTS public.openrepair_statistics
  ADD COLUMN IF NOT EXISTS repairable_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS end_of_life_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS average_age_years numeric(4,1),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now());

-- 5. Backblaze Models Table
CREATE TABLE IF NOT EXISTS public.backblaze_models (
  model_id text PRIMARY KEY,
  algorithm text NOT NULL,
  task text NOT NULL,
  evaluation_metrics jsonb NOT NULL,
  feature_importances jsonb NOT NULL,
  feature_columns jsonb NOT NULL,
  training_samples integer,
  testing_samples integer,
  device_scope text,
  trained_at text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.backblaze_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read backblaze_models" ON public.backblaze_models;
CREATE POLICY "Allow public read backblaze_models" ON public.backblaze_models FOR SELECT USING (true);

-- 6. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
"""

def run_migration():
    print(f"Connecting to Supabase Management API for project '{PROJECT_REF}'...")
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    headers = {
        "Authorization": f"Bearer {SUPABASE_MGMT_TOKEN}",
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, headers=headers, data=json.dumps({"query": DDL_STATEMENTS}).encode("utf-8"))
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            print("Migration applied successfully! Response:", data)
    except Exception as e:
        print("Migration error:", e)
        raise

if __name__ == "__main__":
    run_migration()
