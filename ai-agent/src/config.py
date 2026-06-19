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

# Featherless LLM configuration
FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "rc_6a6a2e1150058930ee0a3b008a9673670ca4fd17d8d17a8c54895634dac18abf")
FEATHERLESS_BASE_URL = os.getenv("FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1")
PLANNER_MODEL = os.getenv("PLANNER_MODEL", "meta-llama/Meta-Llama-3.1-8B-Instruct")
FORMATTER_MODEL = os.getenv("FORMATTER_MODEL", "meta-llama/Meta-Llama-3.1-8B-Instruct")
