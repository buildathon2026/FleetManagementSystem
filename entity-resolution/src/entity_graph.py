from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional, Union


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = ROOT_DIR / "data" / "entity_graph.db"


@dataclass(frozen=True)
class Entity:
    id: str
    type: str
    canonical_name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


@dataclass(frozen=True)
class Alias:
    entity_id: str
    alias_text: str
    source_doc: Optional[str]
    confidence: float
    method: str


class EntityGraph:
    def __init__(self, db_path: Union[Path, str] = DEFAULT_DB_PATH) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_schema()

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_schema(self) -> None:
        with self.connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS entities (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    canonical_name TEXT NOT NULL,
                    lat REAL,
                    lng REAL,
                    description TEXT,
                    metadata_json TEXT NOT NULL DEFAULT '{}'
                );

                CREATE TABLE IF NOT EXISTS aliases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_id TEXT NOT NULL REFERENCES entities(id),
                    alias_text TEXT NOT NULL,
                    alias_key TEXT NOT NULL,
                    source_doc TEXT,
                    confidence REAL NOT NULL,
                    method TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(entity_id, alias_text, method)
                );

                CREATE INDEX IF NOT EXISTS idx_aliases_key ON aliases(alias_key);
                CREATE INDEX IF NOT EXISTS idx_aliases_entity_id ON aliases(entity_id);
                """
            )

    def upsert_entity(self, entity: Entity) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO entities (id, type, canonical_name, lat, lng, description, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    type = excluded.type,
                    canonical_name = excluded.canonical_name,
                    lat = excluded.lat,
                    lng = excluded.lng,
                    description = excluded.description,
                    metadata_json = excluded.metadata_json
                """,
                (
                    entity.id,
                    entity.type,
                    entity.canonical_name,
                    entity.lat,
                    entity.lng,
                    entity.description,
                    json.dumps(entity.metadata or {}),
                ),
            )

    def add_alias(
        self,
        entity_id: str,
        alias_text: str,
        alias_key: str,
        confidence: float,
        method: str,
        source_doc: Optional[str] = None,
    ) -> Alias:
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO aliases (entity_id, alias_text, alias_key, source_doc, confidence, method)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(entity_id, alias_text, method) DO UPDATE SET
                    alias_text = excluded.alias_text,
                    source_doc = excluded.source_doc,
                    confidence = excluded.confidence
                """,
                (entity_id, alias_text, alias_key, source_doc, confidence, method),
            )
        return Alias(entity_id, alias_text, source_doc, confidence, method)

    def find_alias(self, alias_key: str, methods: Optional[list[str]] = None) -> Optional[sqlite3.Row]:
        params: list[Any] = [alias_key]
        method_filter = ""
        if methods:
            placeholders = ",".join("?" for _ in methods)
            method_filter = f" AND a.method IN ({placeholders})"
            params.extend(methods)

        with self.connect() as conn:
            return conn.execute(
                f"""
                SELECT
                    a.entity_id,
                    a.alias_text,
                    a.source_doc,
                    a.confidence,
                    a.method,
                    e.type,
                    e.canonical_name,
                    e.lat,
                    e.lng,
                    e.description,
                    e.metadata_json
                FROM aliases a
                JOIN entities e ON e.id = a.entity_id
                WHERE a.alias_key = ?{method_filter}
                ORDER BY a.confidence DESC
                LIMIT 1
                """,
                params,
            ).fetchone()

    def get_entity(self, entity_id: str) -> Optional[sqlite3.Row]:
        with self.connect() as conn:
            return conn.execute(
                "SELECT * FROM entities WHERE id = ?",
                (entity_id,),
            ).fetchone()

    def get_aliases(self, entity_id: str) -> list[sqlite3.Row]:
        with self.connect() as conn:
            return conn.execute(
                """
                SELECT entity_id, alias_text, source_doc, confidence, method, created_at
                FROM aliases
                WHERE entity_id = ?
                ORDER BY confidence DESC, alias_text ASC
                """,
                (entity_id,),
            ).fetchall()

    def list_entities(self) -> list[sqlite3.Row]:
        with self.connect() as conn:
            return conn.execute(
                """
                SELECT
                    e.id,
                    e.type,
                    e.canonical_name,
                    e.lat,
                    e.lng,
                    COUNT(a.id) AS alias_count,
                    COUNT(DISTINCT CASE WHEN a.source_doc IS NOT NULL THEN a.source_doc END) AS doc_count
                FROM entities e
                LEFT JOIN aliases a ON a.entity_id = e.id
                GROUP BY e.id
                ORDER BY e.type ASC, e.id ASC
                """
            ).fetchall()

    def entities_with_descriptions(self) -> list[sqlite3.Row]:
        with self.connect() as conn:
            return conn.execute(
                """
                SELECT id, type, canonical_name, description, metadata_json
                FROM entities
                WHERE description IS NOT NULL AND TRIM(description) != ''
                """
            ).fetchall()

    def is_empty(self) -> bool:
        with self.connect() as conn:
            count = conn.execute("SELECT COUNT(*) FROM entities").fetchone()[0]
        return count == 0
