import json
import sqlite3
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.core.database import get_db, get_connection

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            phone TEXT,
            is_active INTEGER DEFAULT 1,
            is_verified INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            brand TEXT,
            model TEXT,
            serial_number TEXT,
            purchase_year INTEGER,
            os_version TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS diagnosis_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            device_category TEXT NOT NULL,
            brand TEXT,
            model TEXT,
            problem_category TEXT,
            raw_description TEXT NOT NULL,
            extracted_symptoms TEXT,
            severity_level TEXT DEFAULT 'medium',
            confidence_score REAL DEFAULT 0.85,
            possible_causes TEXT NOT NULL,
            recommended_steps TEXT NOT NULL,
            required_tools TEXT,
            estimated_difficulty TEXT DEFAULT 'moderate',
            estimated_minutes INTEGER DEFAULT 30,
            safety_warnings TEXT,
            requires_technician INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS repair_guides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_category TEXT NOT NULL,
            problem_category TEXT NOT NULL,
            title_en TEXT NOT NULL,
            title_ar TEXT NOT NULL,
            summary_en TEXT NOT NULL,
            summary_ar TEXT NOT NULL,
            difficulty TEXT DEFAULT 'moderate',
            estimated_minutes INTEGER DEFAULT 30,
            required_tools TEXT,
            safety_precautions TEXT,
            steps_json TEXT NOT NULL,
            is_published INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS technician_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            business_name TEXT NOT NULL,
            bio TEXT,
            specializations TEXT NOT NULL,
            experience_years INTEGER DEFAULT 1,
            city TEXT NOT NULL,
            address TEXT,
            rating REAL DEFAULT 5.0,
            total_reviews INTEGER DEFAULT 0,
            verification_status TEXT DEFAULT 'pending',
            is_available INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS repair_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            technician_id INTEGER NOT NULL,
            diagnosis_id INTEGER,
            device_info TEXT NOT NULL,
            problem_summary TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            customer_notes TEXT,
            estimated_quote REAL,
            scheduled_date TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (technician_id) REFERENCES technician_profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (diagnosis_id) REFERENCES diagnosis_reports(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title_en TEXT NOT NULL,
            title_ar TEXT NOT NULL,
            message_en TEXT NOT NULL,
            message_ar TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            link TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

# --- USER OPERATIONS ---
def create_user(email: str, hashed_pw: str, full_name: str, role: str = "user", phone: str = None) -> Dict[str, Any]:
    with get_db() as conn:
        now = utc_now_iso()
        cursor = conn.execute(
            "INSERT INTO users (email, hashed_password, full_name, role, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (email.lower(), hashed_pw, full_name, role, phone, now)
        )
        user_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower(),)).fetchone()
        return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None

def list_users(limit: int = 100) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT id, email, full_name, role, phone, is_active, created_at FROM users ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]

def toggle_user_active(user_id: int) -> Optional[bool]:
    with get_db() as conn:
        row = conn.execute("SELECT is_active FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            return None
        new_val = 0 if row["is_active"] else 1
        conn.execute("UPDATE users SET is_active = ? WHERE id = ?", (new_val, user_id))
        return bool(new_val)

# --- DEVICE OPERATIONS ---
def create_device(user_id: int, category: str, brand: str = None, model: str = None, serial: str = None, year: int = None, os_v: str = None) -> Dict[str, Any]:
    with get_db() as conn:
        now = utc_now_iso()
        cursor = conn.execute(
            "INSERT INTO devices (user_id, category, brand, model, serial_number, purchase_year, os_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, category, brand, model, serial, year, os_v, now)
        )
        row = conn.execute("SELECT * FROM devices WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return dict(row)

def get_user_devices(user_id: int) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM devices WHERE user_id = ? ORDER BY id DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]

def delete_device(device_id: int, user_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM devices WHERE id = ? AND user_id = ?", (device_id, user_id))
        return cursor.rowcount > 0

# --- DIAGNOSIS OPERATIONS ---
def create_diagnosis_report(data: Dict[str, Any]) -> int:
    with get_db() as conn:
        now = utc_now_iso()
        cursor = conn.execute("""
            INSERT INTO diagnosis_reports (
                user_id, device_category, brand, model, problem_category,
                raw_description, extracted_symptoms, severity_level, confidence_score,
                possible_causes, recommended_steps, required_tools, estimated_difficulty,
                estimated_minutes, safety_warnings, requires_technician, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("user_id"),
            data["device_category"],
            data.get("brand"),
            data.get("model"),
            data.get("problem_category"),
            data["raw_description"],
            json.dumps(data.get("extracted_symptoms", [])),
            data.get("severity_level", "medium"),
            data.get("confidence_score", 0.85),
            json.dumps(data.get("possible_causes", [])),
            json.dumps(data.get("recommended_steps", [])),
            json.dumps(data.get("required_tools", [])),
            data.get("estimated_difficulty", "moderate"),
            data.get("estimated_minutes", 30),
            json.dumps(data.get("safety_warnings", [])),
            1 if data.get("requires_technician") else 0,
            now
        ))
        return cursor.lastrowid

def get_diagnosis_report(report_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM diagnosis_reports WHERE id = ?", (report_id,)).fetchone()
        return dict(row) if row else None

def get_user_diagnosis_reports(user_id: int) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM diagnosis_reports WHERE user_id = ? ORDER BY id DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]

def delete_diagnosis_report(report_id: int, user_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM diagnosis_reports WHERE id = ? AND user_id = ?", (report_id, user_id))
        return cursor.rowcount > 0

# --- REPAIR GUIDES OPERATIONS ---
def list_guides(category: str = None, difficulty: str = None, search: str = None) -> List[Dict[str, Any]]:
    with get_db() as conn:
        query = "SELECT * FROM repair_guides WHERE is_published = 1"
        params = []
        if category and category != "all":
            query += " AND device_category = ?"
            params.append(category)
        if difficulty and difficulty != "all":
            query += " AND difficulty = ?"
            params.append(difficulty)
        if search:
            query += " AND (title_en LIKE ? OR title_ar LIKE ? OR summary_en LIKE ? OR summary_ar LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param, s_param])
        query += " ORDER BY id DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

def get_guide_by_id(guide_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM repair_guides WHERE id = ?", (guide_id,)).fetchone()
        return dict(row) if row else None

# --- TECHNICIAN OPERATIONS ---
def create_technician_profile(user_id: int, business_name: str, specializations: str, city: str, bio: str = None, status: str = "pending", rating: float = 5.0, reviews: int = 0) -> int:
    with get_db() as conn:
        now = utc_now_iso()
        cursor = conn.execute("""
            INSERT INTO technician_profiles (user_id, business_name, specializations, city, bio, verification_status, rating, total_reviews, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, business_name, specializations, city, bio, status, rating, reviews, now))
        return cursor.lastrowid

def get_technician_by_user_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM technician_profiles WHERE user_id = ?", (user_id,)).fetchone()
        return dict(row) if row else None

def get_technician_by_id(tech_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("""
            SELECT t.*, u.full_name as technician_name, u.email as technician_email, u.phone as technician_phone
            FROM technician_profiles t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        """, (tech_id,)).fetchone()
        return dict(row) if row else None

def list_technicians(city: str = None, specialization: str = None, status: str = "approved") -> List[Dict[str, Any]]:
    with get_db() as conn:
        query = """
            SELECT t.*, u.full_name as technician_name, u.email as technician_email, u.phone as technician_phone
            FROM technician_profiles t
            JOIN users u ON t.user_id = u.id
            WHERE t.verification_status = ?
        """
        params = [status]
        if city and city != "all":
            query += " AND t.city LIKE ?"
            params.append(f"%{city}%")
        if specialization and specialization != "all":
            query += " AND t.specializations LIKE ?"
            params.append(f"%{specialization}%")
        query += " ORDER BY t.rating DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

def set_technician_status(tech_id: int, status: str) -> bool:
    with get_db() as conn:
        cursor = conn.execute("UPDATE technician_profiles SET verification_status = ? WHERE id = ?", (status, tech_id))
        return cursor.rowcount > 0

# --- REPAIR REQUESTS (BOOKINGS) ---
def create_repair_request(user_id: int, tech_id: int, device_info: str, problem_summary: str, notes: str = None, scheduled_date: str = None, diag_id: int = None) -> int:
    with get_db() as conn:
        now = utc_now_iso()
        cursor = conn.execute("""
            INSERT INTO repair_requests (user_id, technician_id, diagnosis_id, device_info, problem_summary, customer_notes, scheduled_date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        """, (user_id, tech_id, diag_id, device_info, problem_summary, notes, scheduled_date, now))
        return cursor.lastrowid

def get_repair_requests_for_user(user_id: int) -> List[Dict[str, Any]]:
    with get_db() as conn:
        query = """
            SELECT r.*, t.business_name as technician_business, u.full_name as customer_name
            FROM repair_requests r
            JOIN technician_profiles t ON r.technician_id = t.id
            JOIN users u ON r.user_id = u.id
            WHERE r.user_id = ?
            ORDER BY r.id DESC
        """
        rows = conn.execute(query, (user_id,)).fetchall()
        return [dict(r) for r in rows]

def get_repair_requests_for_technician(tech_profile_id: int) -> List[Dict[str, Any]]:
    with get_db() as conn:
        query = """
            SELECT r.*, t.business_name as technician_business, u.full_name as customer_name, u.phone as customer_phone
            FROM repair_requests r
            JOIN technician_profiles t ON r.technician_id = t.id
            JOIN users u ON r.user_id = u.id
            WHERE r.technician_id = ?
            ORDER BY r.id DESC
        """
        rows = conn.execute(query, (tech_profile_id,)).fetchall()
        return [dict(r) for r in rows]

def update_request_status(request_id: int, status: str, quote: float = None) -> bool:
    with get_db() as conn:
        if quote is not None:
            cursor = conn.execute("UPDATE repair_requests SET status = ?, estimated_quote = ? WHERE id = ?", (status, quote, request_id))
        else:
            cursor = conn.execute("UPDATE repair_requests SET status = ? WHERE id = ?", (status, request_id))
        return cursor.rowcount > 0

# --- PLATFORM STATS ---
def get_stats() -> Dict[str, int]:
    with get_db() as conn:
        total_users = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        total_techs = conn.execute("SELECT COUNT(*) as c FROM technician_profiles").fetchone()["c"]
        pending_techs = conn.execute("SELECT COUNT(*) as c FROM technician_profiles WHERE verification_status = 'pending'").fetchone()["c"]
        total_diags = conn.execute("SELECT COUNT(*) as c FROM diagnosis_reports").fetchone()["c"]
        total_reqs = conn.execute("SELECT COUNT(*) as c FROM repair_requests").fetchone()["c"]
        total_guides = conn.execute("SELECT COUNT(*) as c FROM repair_guides").fetchone()["c"]
        return {
            "total_users": total_users,
            "total_technicians": total_techs,
            "pending_approvals": pending_techs,
            "total_diagnoses": total_diags,
            "total_repair_requests": total_reqs,
            "total_repair_guides": total_guides
        }
