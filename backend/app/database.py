import sqlite3
import os
from pathlib import Path

# Save database in the backend directory
DB_PATH = Path(__file__).resolve().parent.parent / "resource_ai.db"

def get_db_connection():
    """Returns a connection to the SQLite database with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Creates the waste_logs table if it doesn't already exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS waste_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_name TEXT NOT NULL,
            industry TEXT NOT NULL,
            waste_type TEXT NOT NULL,
            waste_type_standard TEXT NOT NULL,
            description TEXT,
            quantity REAL NOT NULL,
            frequency TEXT NOT NULL,
            location TEXT NOT NULL,
            current_disposal_method TEXT NOT NULL,
            match_confidence REAL NOT NULL,
            top_opportunity_name TEXT NOT NULL,
            buyer_name TEXT NOT NULL,
            distance_km REAL NOT NULL,
            monthly_revenue REAL NOT NULL,
            carbon_saved_monthly REAL NOT NULL,
            landfill_diverted_monthly REAL NOT NULL,
            circular_economy_score REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()
