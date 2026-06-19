from __future__ import annotations

import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]

MCP_TOOLS_URL = os.getenv("MCP_TOOLS_URL", "http://192.168.1.160:8002/tools").rstrip("/")
FLEET_DATA_URL = os.getenv("FLEET_DATA_URL", "http://192.168.1.160:8002").rstrip("/")
ENTITY_RESOLUTION_URL = os.getenv("ENTITY_RESOLUTION_URL", "http://localhost:8003").rstrip("/")
INGESTION_URL = os.getenv("INGESTION_URL", "http://localhost:8004").rstrip("/")
AGENT_DB_PATH = Path(os.getenv("AGENT_DB_PATH", str(ROOT_DIR / "data" / "agent.db")))
HTTP_TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT_SECONDS", "6"))
