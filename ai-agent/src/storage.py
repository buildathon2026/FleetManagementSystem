from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import AGENT_DB_PATH

# Python 3.9 compatibility
UTC = timezone.utc


class ConversationStore:
    def __init__(self, db_path: Path = AGENT_DB_PATH) -> None:
        self.db_path = db_path
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
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id TEXT NOT NULL REFERENCES conversations(id),
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    payload_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id TEXT NOT NULL,
                    rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
                    comment TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS prompt_improvement_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at TEXT NOT NULL,
                    example_count INTEGER NOT NULL,
                    prompt_snippet TEXT NOT NULL
                );
                """
            )

    def append_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        payload: dict[str, Any] | None = None,
    ) -> None:
        now = datetime.now(UTC).isoformat()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO conversations (id, created_at, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at
                """,
                (conversation_id, now, now),
            )
            conn.execute(
                """
                INSERT INTO messages (conversation_id, role, content, payload_json, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (conversation_id, role, content, json.dumps(payload or {}), now),
            )

    def get_conversation(self, conversation_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            conversation = conn.execute(
                "SELECT id, created_at, updated_at FROM conversations WHERE id = ?",
                (conversation_id,),
            ).fetchone()
            if not conversation:
                return None
            messages = conn.execute(
                """
                SELECT role, content, payload_json, created_at
                FROM messages
                WHERE conversation_id = ?
                ORDER BY id ASC
                """,
                (conversation_id,),
            ).fetchall()

        return {
            "id": conversation["id"],
            "created_at": conversation["created_at"],
            "updated_at": conversation["updated_at"],
            "messages": [
                {
                    "role": row["role"],
                    "content": row["content"],
                    "payload": json.loads(row["payload_json"] or "{}"),
                    "created_at": row["created_at"],
                }
                for row in messages
            ],
        }

    def save_feedback(self, conversation_id: str, rating: str, comment: str | None) -> None:
        now = datetime.now(UTC).isoformat()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO feedback (conversation_id, rating, comment, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (conversation_id, rating, comment, now),
            )

    def get_negative_feedback_examples(self, limit: int = 5) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT f.conversation_id, f.comment, f.created_at
                FROM feedback f
                WHERE f.rating = 'down'
                ORDER BY f.created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

            examples: list[dict[str, Any]] = []
            for row in rows:
                messages = conn.execute(
                    """
                    SELECT role, content, payload_json
                    FROM messages
                    WHERE conversation_id = ?
                    ORDER BY id ASC
                    """,
                    (row["conversation_id"],),
                ).fetchall()

                user_messages = [m for m in messages if m["role"] == "user"]
                assistant_messages = [m for m in messages if m["role"] == "assistant"]
                if not user_messages or not assistant_messages:
                    continue

                payload = json.loads(assistant_messages[-1]["payload_json"] or "{}")
                examples.append(
                    {
                        "conversation_id": row["conversation_id"],
                        "question": user_messages[-1]["content"],
                        "answer": assistant_messages[-1]["content"],
                        "plan": payload.get("plan_executed", {}),
                        "comment": row["comment"],
                        "created_at": row["created_at"],
                    }
                )

        return examples

    def save_prompt_improvement_run(self, examples: list[dict[str, Any]]) -> dict[str, Any]:
        prompt_snippet = self._build_prompt_snippet(examples)
        now = datetime.now(UTC).isoformat()
        with self.connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO prompt_improvement_runs (created_at, example_count, prompt_snippet)
                VALUES (?, ?, ?)
                """,
                (now, len(examples), prompt_snippet),
            )

        return {
            "run_id": cursor.lastrowid,
            "created_at": now,
            "example_count": len(examples),
            "prompt_snippet": prompt_snippet,
        }

    def _build_prompt_snippet(self, examples: list[dict[str, Any]]) -> str:
        if not examples:
            return "No negative feedback examples found. Keep current planner prompt unchanged."

        lines = [
            "Weekly feedback-derived planner guidance:",
            "Avoid repeating these failure patterns. Prefer resolving entities first, calling the narrowest approved tool, and returning grounded source IDs.",
        ]
        for index, example in enumerate(examples, start=1):
            tools = [
                tool.get("tool")
                for tool in example.get("plan", {}).get("tools_called", [])
                if isinstance(tool, dict)
            ]
            lines.append(
                f"{index}. Question: {example['question']} | Tools: {tools or 'none'} | User note: {example.get('comment') or 'thumbs down'}"
            )
        return "\n".join(lines)
