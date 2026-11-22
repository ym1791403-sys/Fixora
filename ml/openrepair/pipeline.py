# -*- coding: utf-8 -*-
"""
Open Repair Alliance Data Preprocessing & Statistical Aggregation Pipeline
Processes OpenRepairData_v0.3_aggregate_202607_eee.csv (416,282 real incidents).
Extracts:
- Category normalization
- Multilingual problem clustering (DE, EN, FR, NL)
- Empirical repair outcomes (Fixed, Repairable, End of life)
- Empirical barrier frequencies and age correlations
Populates SQLite `repair_incidents` table and produces `data/processed/openrepair_statistics.json`.
"""

import os
import sys
import re
import json
import sqlite3
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

RAW_CSV_PATH = os.path.join(PROJECT_ROOT, "datasets", "open_repair_alliance", "raw", "OpenRepairData_v0.3_aggregate_202607_eee.csv")
STATS_OUTPUT_PATH = os.path.join(PROJECT_ROOT, "data", "processed", "openrepair_statistics.json")
DB_PATH = os.path.join(PROJECT_ROOT, "data", "processed", "fixora.db")

# Category Normalization Mapping
CATEGORY_MAP = {
    # Laptop
    "laptop": "Laptop",
    "notebook": "Laptop",
    "netbook": "Laptop",
    
    # Smartphone
    "mobile": "Smartphone",
    "smartphone": "Smartphone",
    "mobile phone": "Smartphone",
    "handy": "Smartphone",
    
    # Desktop
    "desktop": "Desktop Computer",
    "computer - desktop": "Desktop Computer",
    "pc": "Desktop Computer",
    "desktop computer": "Desktop Computer",
    
    # Tablet
    "tablet": "Tablet",
    "e-reader": "Tablet",
    "e-book": "Tablet",
    
    # Gaming Console
    "tv and gaming-related accessories": "Gaming Console",
    "game console": "Gaming Console",
    "console": "Gaming Console",
    "video game": "Gaming Console",
    
    # Smart TV & Display
    "flat screen": "Smart TV",
    "tv": "Smart TV",
    "television": "Smart TV",
    "monitor": "Smart TV",
    "display": "Smart TV",
    
    # Audio
    "headphones": "Audio",
    "hi-fi separates": "Audio",
    "portable radio": "Audio",
    "audio": "Audio",
    "speaker": "Audio",
    "loudspeaker": "Audio",
    
    # Printer
    "printer/scanner": "Printer",
    "printer": "Printer",
    "scanner": "Printer",
    
    # Home Appliances
    "vacuum": "Home Appliance",
    "coffee maker": "Home Appliance",
    "food processor": "Home Appliance",
    "small home electrical": "Home Appliance",
    "small kitchen item": "Home Appliance",
    "toaster": "Home Appliance",
    "kettle": "Home Appliance",
    "iron": "Home Appliance",
    "sewing machine": "Home Appliance",
    "large home electrical": "Home Appliance",
    "hair & beauty item": "Home Appliance",
    "blender": "Home Appliance",
    "microwave": "Home Appliance"
}

def normalize_product_category(raw_cat: str) -> str:
    """Maps raw OpenRepair category to Fixora standard taxonomy."""
    if not raw_cat or pd.isna(raw_cat):
        return "Other"
    clean = str(raw_cat).strip().lower()
    for key, val in CATEGORY_MAP.items():
        if key in clean:
            return val
    return "Other"

# Multilingual Problem Clustering Regexes
PROBLEM_CLUSTERS = [
    ("POWER_FAILURE", re.compile(r"\b(ohne funktion|geht nicht an|startet nicht|schaltet nicht|ne s'allume pas|ne s’allume|no power|won't turn on|dead|stroom|power)\b", re.I)),
    ("BATTERY_CHARGING", re.compile(r"\b(akku|battery|batterie|lädt nicht|charge|charging|lader|ne charge pas|aliment|charger)\b", re.I)),
    ("SCREEN_DISPLAY", re.compile(r"\b(display|scherm|écran|screen|bildschirm|flackert|streifen|dunkel|black screen|lines)\b", re.I)),
    ("CABLE_CONNECTION", re.compile(r"\b(kabelbruch|kabel|cable|wackelkontakt|draht|wire|contact|loose)\b", re.I)),
    ("SWITCH_BUTTON", re.compile(r"\b(schalter|switch|bouton|taste|taster|knop|button)\b", re.I)),
    ("MECHANICAL_WEAR", re.compile(r"\b(mechanik|gebrochen|cassé|broken|jammed|klemmt|gehäuse|hinge|chassis)\b", re.I)),
    ("THERMAL_OVERHEAT", re.compile(r"\b(heiss|overheat|overheating|warm|lüfter|fan|ventilat|surchauffe|thermal)\b", re.I)),
    ("MOTOR_DRIVE", re.compile(r"\b(motor|moteur|antrieb|pumpe|pump|draait niet|tourne pas|drive)\b", re.I)),
    ("PAPER_FEED", re.compile(r"\b(papierstau|papiereinzug|jam|druckkopf|feed|roller|paper)\b", re.I)),
    ("COMPONENT_SHORT", re.compile(r"\b(sicherung|fuse|kondensator|capacitor|platine|board|short|circuit|kurzschluss)\b", re.I)),
    ("LIQUID_LEAK", re.compile(r"\b(wasser|water|ausgelaufen|undicht|fuite|tropft|liquid|leak)\b", re.I))
]

def cluster_problem_text(problem_text: str) -> str:
    """Classifies raw multilingual problem text into standardized failure modes."""
    if not problem_text or pd.isna(problem_text):
        return "GENERAL_DEFECT"
    text = str(problem_text)
    for cluster_name, pattern in PROBLEM_CLUSTERS:
        if pattern.search(text):
            return cluster_name
    return "GENERAL_DEFECT"

def run_openrepair_pipeline(batch_size: int = 15000, max_db_records: int = None) -> Dict[str, Any]:
    """
    Main pipeline entry point:
    1. Loads full raw CSV
    2. Cleans & normalizes fields
    3. Calculates rigorous statistical summaries
    4. Saves processed database and statistics JSON
    """
    if not os.path.exists(RAW_CSV_PATH):
        raise FileNotFoundError(f"OpenRepair raw CSV not found at: {RAW_CSV_PATH}")

    file_size_bytes = os.path.getsize(RAW_CSV_PATH)
    print(f"Starting OpenRepair pipeline on {RAW_CSV_PATH} ({file_size_bytes:,} bytes)...")

    # 1. Read CSV with optimized types
    df = pd.read_csv(
        RAW_CSV_PATH,
        dtype={
            "id": str,
            "data_provider": str,
            "country": str,
            "partner_product_category": str,
            "product_category": str,
            "brand": str,
            "repair_status": str,
            "repair_barrier_if_end_of_life": str,
            "group_identifier": str,
            "event_date": str,
            "problem": str
        },
        low_memory=False
    )
    total_raw = len(df)
    print(f"Loaded {total_raw:,} records from CSV.")

    # 2. Category Normalization
    df["normalized_category"] = df["product_category"].apply(normalize_product_category)

    # 3. Clean Brand and Age
    df["brand"] = df["brand"].fillna("Unknown").astype(str).str.strip()
    df["product_age"] = pd.to_numeric(df["product_age"], errors="coerce")
    # Clamp unreasonable product ages (> 80 years to NaN)
    df.loc[df["product_age"] > 80, "product_age"] = np.nan
    df.loc[df["product_age"] < 0, "product_age"] = np.nan

    # 4. Standardize Repair Status
    valid_statuses = {"Fixed", "Repairable", "End of life", "Unknown"}
    df["repair_status"] = df["repair_status"].fillna("Unknown")
    df.loc[~df["repair_status"].isin(valid_statuses), "repair_status"] = "Unknown"

    # 5. Clean Barriers
    df["repair_barrier"] = df["repair_barrier_if_end_of_life"].fillna("None").astype(str).str.strip()
    df.loc[df["repair_barrier"] == "nan", "repair_barrier"] = "None"

    # 6. Cluster Problems
    print("Clustering multilingual problem descriptions...")
    df["problem_cluster"] = df["problem"].apply(cluster_problem_text)

    # 7. Compute Rigorous Statistical Distribution
    print("Computing category failure statistics and empirical distributions...")
    category_stats = {}
    
    # Global metrics
    global_status_dist = df["repair_status"].value_counts().to_dict()
    total_valid = len(df)
    global_fix_rate = round(global_status_dist.get("Fixed", 0) / total_valid, 4)

    for cat, group in df.groupby("normalized_category"):
        cat_total = len(group)
        status_dist = group["repair_status"].value_counts().to_dict()
        fix_rate = round(status_dist.get("Fixed", 0) / cat_total, 4)
        repairable_rate = round(status_dist.get("Repairable", 0) / cat_total, 4)
        eol_rate = round(status_dist.get("End of life", 0) / cat_total, 4)

        # Top failure clusters
        clusters = group["problem_cluster"].value_counts()
        cluster_list = []
        for name, count in clusters.items():
            cluster_list.append({
                "cluster": name,
                "count": int(count),
                "frequency": round(count / cat_total, 4)
            })

        # Repair barriers for EOL devices
        eol_group = group[group["repair_status"] == "End of life"]
        barriers_dist = eol_group[eol_group["repair_barrier"] != "None"]["repair_barrier"].value_counts()
        barriers_list = []
        for name, count in barriers_dist.head(5).items():
            barriers_list.append({
                "barrier": name,
                "count": int(count),
                "frequency": round(count / len(eol_group), 4) if len(eol_group) > 0 else 0
            })

        # Top brands
        top_brands = group[group["brand"] != "Unknown"]["brand"].value_counts().head(8).to_dict()

        # Age metrics
        valid_ages = group["product_age"].dropna()
        avg_age = round(float(valid_ages.mean()), 1) if len(valid_ages) > 0 else None
        median_age = round(float(valid_ages.median()), 1) if len(valid_ages) > 0 else None

        category_stats[cat] = {
            "total_incidents": cat_total,
            "repair_status_distribution": {k: int(v) for k, v in status_dist.items()},
            "empirical_fix_rate": fix_rate,
            "empirical_repairable_rate": repairable_rate,
            "empirical_end_of_life_rate": eol_rate,
            "average_device_age_years": avg_age,
            "median_device_age_years": median_age,
            "top_failure_modes": cluster_list[:8],
            "top_repair_barriers": barriers_list,
            "top_brands": {k: int(v) for k, v in top_brands.items()}
        }

    dataset_summary = {
        "dataset_name": "Open Repair Alliance (ORA)",
        "source": "https://raw.githubusercontent.com/openrepair/data/main/OpenRepairData_v0.3_aggregate_202607_eee.csv",
        "processed_at": datetime.now().isoformat() + "Z",
        "total_records_analyzed": total_raw,
        "global_repair_rate": global_fix_rate,
        "categories_covered": len(category_stats),
        "category_statistics": category_stats
    }

    # Save Pre-computed Summary JSON
    os.makedirs(os.path.dirname(STATS_OUTPUT_PATH), exist_ok=True)
    with open(STATS_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset_summary, f, ensure_ascii=False, indent=2)
    print(f"Saved empirical statistics to {STATS_OUTPUT_PATH} ({os.path.getsize(STATS_OUTPUT_PATH):,} bytes).")

    # 8. Insert into SQLite Database
    print(f"Connecting to SQLite database: {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ensure table exists
    from api.services.db import init_db, record_dataset_import
    init_db()

    # Clear old incidents to ensure clean state
    cursor.execute("DELETE FROM repair_incidents;")
    conn.commit()

    # Batch insert
    insert_records = []
    limit = max_db_records if max_db_records else total_raw
    print(f"Inserting {limit:,} records into SQLite in chunks of {batch_size:,}...")

    insert_sql = """
    INSERT INTO repair_incidents (
        id, data_provider, country, partner_category, normalized_category,
        brand, product_age, repair_status, repair_barrier, problem_raw,
        problem_cluster, event_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    count = 0
    for idx, row in df.iloc[:limit].iterrows():
        insert_records.append((
            str(row["id"]),
            str(row["data_provider"]) if pd.notna(row["data_provider"]) else None,
            str(row["country"]) if pd.notna(row["country"]) else None,
            str(row["partner_product_category"]) if pd.notna(row["partner_product_category"]) else None,
            str(row["normalized_category"]),
            str(row["brand"]) if pd.notna(row["brand"]) else None,
            float(row["product_age"]) if pd.notna(row["product_age"]) else None,
            str(row["repair_status"]),
            str(row["repair_barrier"]) if row["repair_barrier"] != "None" else None,
            str(row["problem"]) if pd.notna(row["problem"]) else None,
            str(row["problem_cluster"]),
            str(row["event_date"]) if pd.notna(row["event_date"]) else None
        ))
        if len(insert_records) >= batch_size:
            cursor.executemany(insert_sql, insert_records)
            conn.commit()
            count += len(insert_records)
            print(f"  Inserted {count:,} / {limit:,} records...")
            insert_records = []

    if insert_records:
        cursor.executemany(insert_sql, insert_records)
        conn.commit()
        count += len(insert_records)

    conn.close()
    print(f"SQLite insertion complete: {count:,} records stored in `repair_incidents`.")

    # 9. Record Dataset Status
    record_dataset_import(
        dataset_key="open_repair_alliance",
        name="Open Repair Alliance (ORA)",
        source_url="https://raw.githubusercontent.com/openrepair/data/main/OpenRepairData_v0.3_aggregate_202607_eee.csv",
        file_path=RAW_CSV_PATH,
        file_size_bytes=file_size_bytes,
        total_raw_records=total_raw,
        total_indexed_records=count,
        status="operational",
        validation_notes=f"Successfully ingested and validated {count:,} records across {len(category_stats)} categories."
    )

    print("OpenRepair Alliance pipeline finished successfully.")
    return dataset_summary

if __name__ == "__main__":
    run_openrepair_pipeline()
