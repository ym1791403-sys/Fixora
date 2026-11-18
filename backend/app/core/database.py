import sqlite3
import os
from contextlib import contextmanager

if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/techrepair.db"
else:
    DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "techrepair.db"))

def get_connection():
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    con.row_factory = sqlite3.Row  # Access columns by name like dict
    con.execute("PRAGMA foreign_keys = ON;")
    return con

@contextmanager
def get_db():
    con = get_connection()
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()
