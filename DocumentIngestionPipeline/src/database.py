"""Database models and initialization for the ingestion pipeline."""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

DATABASE_PATH = Path("fleet.db")


def init_database():
    """Initialize SQLite database with required schema."""
    conn = sqlite3.connect(str(DATABASE_PATH))
    cursor = conn.cursor()

    # Documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            doc_type TEXT NOT NULL,
            entity_id TEXT,
            filename TEXT NOT NULL,
            raw_content TEXT NOT NULL,
            extracted_fields JSON,
            confidence REAL,
            ingested_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL,
            status TEXT DEFAULT 'completed',
            active BOOLEAN DEFAULT TRUE
        )
    """)

    # Ingestion logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id TEXT NOT NULL,
            stage TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT,
            duration_ms REAL,
            timestamp TIMESTAMP NOT NULL,
            FOREIGN KEY (doc_id) REFERENCES documents(id)
        )
    """)

    # Document statistics
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_stats (
            doc_type TEXT PRIMARY KEY,
            count INTEGER DEFAULT 0,
            total_size_bytes INTEGER DEFAULT 0,
            avg_processing_time_ms REAL DEFAULT 0,
            last_ingested_at TIMESTAMP
        )
    """)

    # Structured data extracts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fuel_receipts (
            doc_id TEXT PRIMARY KEY,
            station TEXT,
            date TEXT,
            truck_id TEXT,
            driver TEXT,
            gallons REAL,
            price_per_gallon REAL,
            total REAL,
            odometer INTEGER,
            FOREIGN KEY (doc_id) REFERENCES documents(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_invoices (
            doc_id TEXT PRIMARY KEY,
            invoice_number TEXT,
            date TEXT,
            truck_id TEXT,
            service_type TEXT,
            hours REAL,
            labor_cost REAL,
            parts_cost REAL,
            total REAL,
            FOREIGN KEY (doc_id) REFERENCES documents(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS insurance_certs (
            doc_id TEXT PRIMARY KEY,
            certificate_number TEXT,
            policy_number TEXT,
            truck_id TEXT,
            coverage_limits TEXT,
            expiration_date TEXT,
            FOREIGN KEY (doc_id) REFERENCES documents(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settlements (
            doc_id TEXT PRIMARY KEY,
            settlement_id TEXT,
            load_number TEXT,
            truck_id TEXT,
            driver TEXT,
            miles INTEGER,
            revenue REAL,
            total_deductions REAL,
            net_settlement REAL,
            date TEXT,
            FOREIGN KEY (doc_id) REFERENCES documents(id)
        )
    """)

    # Create indices for faster queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_doc_type ON documents(doc_type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_entity_id ON documents(entity_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ingested_at ON documents(ingested_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_active ON documents(active)")

    conn.commit()
    conn.close()


class DocumentDB:
    """Database operations for documents."""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or str(DATABASE_PATH)

    def get_connection(self):
        """Get database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def insert_document(
        self,
        doc_id: str,
        doc_type: str,
        filename: str,
        raw_content: str,
        extracted_fields: Dict[str, Any],
        entity_id: Optional[str] = None,
        confidence: float = 0.0,
    ) -> bool:
        """Insert a new document record."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            now = datetime.utcnow().isoformat()

            cursor.execute(
                """
                INSERT OR REPLACE INTO documents
                (id, doc_type, entity_id, filename, raw_content, extracted_fields,
                 confidence, ingested_at, updated_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    doc_id,
                    doc_type,
                    entity_id,
                    filename,
                    raw_content,
                    json.dumps(extracted_fields),
                    confidence,
                    now,
                    now,
                    "completed",
                ),
            )

            # Update stats
            cursor.execute(
                """
                INSERT INTO document_stats (doc_type, count, last_ingested_at)
                VALUES (?, 1, ?)
                ON CONFLICT(doc_type) DO UPDATE SET
                    count = count + 1,
                    last_ingested_at = ?
                """,
                (doc_type, now, now),
            )

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error inserting document: {e}")
            return False

    def insert_typed_data(
        self, doc_id: str, doc_type: str, data: Dict[str, Any]
    ) -> bool:
        """Insert typed document data into specific tables."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            if doc_type == "fuel_receipt":
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO fuel_receipts
                    (doc_id, station, date, truck_id, driver, gallons, price_per_gallon, total, odometer)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        doc_id,
                        data.get("station"),
                        data.get("date"),
                        data.get("truck_id"),
                        data.get("driver"),
                        data.get("gallons"),
                        data.get("price_per_gallon"),
                        data.get("total"),
                        data.get("odometer"),
                    ),
                )
            elif doc_type == "maintenance_invoice":
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO maintenance_invoices
                    (doc_id, invoice_number, date, truck_id, service_type, hours, labor_cost, parts_cost, total)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        doc_id,
                        data.get("invoice_number"),
                        data.get("date"),
                        data.get("truck_id"),
                        data.get("service_type"),
                        data.get("hours"),
                        data.get("labor_cost"),
                        data.get("parts_cost"),
                        data.get("total"),
                    ),
                )
            elif doc_type == "insurance_cert":
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO insurance_certs
                    (doc_id, certificate_number, policy_number, truck_id, coverage_limits, expiration_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        doc_id,
                        data.get("certificate_number"),
                        data.get("policy_number"),
                        data.get("truck_id"),
                        data.get("coverage_limits"),
                        data.get("expiration_date"),
                    ),
                )
            elif doc_type == "settlement":
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO settlements
                    (doc_id, settlement_id, load_number, truck_id, driver, miles, revenue,
                     total_deductions, net_settlement, date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        doc_id,
                        data.get("settlement_id"),
                        data.get("load_number"),
                        data.get("truck_id"),
                        data.get("driver"),
                        data.get("miles"),
                        data.get("revenue"),
                        data.get("total_deductions"),
                        data.get("net_settlement"),
                        data.get("date"),
                    ),
                )

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error inserting typed data: {e}")
            return False

    def log_pipeline_stage(
        self,
        doc_id: str,
        stage: str,
        status: str,
        message: str = None,
        duration_ms: float = None,
    ):
        """Log a pipeline processing stage."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO ingestion_logs (doc_id, stage, status, message, duration_ms, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (doc_id, stage, status, message, duration_ms, datetime.utcnow().isoformat()),
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error logging stage: {e}")

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a document by ID."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            conn.close()

            if row:
                return dict(row)
            return None
        except Exception as e:
            print(f"Error retrieving document: {e}")
            return None

    def get_stats(self) -> Dict[str, Any]:
        """Get ingestion statistics."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "SELECT COUNT(*) as total_ingested, COUNT(DISTINCT doc_type) as doc_types FROM documents"
            )
            total_row = cursor.fetchone()

            cursor.execute(
                "SELECT doc_type, count, last_ingested_at FROM document_stats ORDER BY count DESC"
            )
            by_type = [dict(row) for row in cursor.fetchall()]

            cursor.execute("SELECT MAX(ingested_at) as last_ingested_at FROM documents")
            last_row = cursor.fetchone()

            conn.close()

            return {
                "total_ingested": total_row["total_ingested"] if total_row else 0,
                "doc_types": total_row["doc_types"] if total_row else 0,
                "by_type": by_type,
                "last_ingested_at": last_row["last_ingested_at"] if last_row else None,
            }
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {
                "total_ingested": 0,
                "doc_types": 0,
                "by_type": [],
                "last_ingested_at": None,
            }

    def get_documents_by_entity(
        self, entity_id: str, doc_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all documents for an entity."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            if doc_type:
                cursor.execute(
                    "SELECT * FROM documents WHERE entity_id = ? AND doc_type = ? AND active = TRUE",
                    (entity_id, doc_type),
                )
            else:
                cursor.execute(
                    "SELECT * FROM documents WHERE entity_id = ? AND active = TRUE", (entity_id,)
                )

            rows = cursor.fetchall()
            conn.close()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error retrieving documents: {e}")
            return []
