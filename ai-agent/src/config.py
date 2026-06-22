from __future__ import annotations

import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]

MCP_TOOLS_URL = os.getenv("MCP_TOOLS_URL", "http://localhost:8002/tools").rstrip("/")
MCP_TOOLS_LIST_URL = os.getenv("MCP_TOOLS_LIST_URL", f"{MCP_TOOLS_URL}/list").rstrip("/")
FLEET_DATA_URL = os.getenv("FLEET_DATA_URL", "http://localhost:8002").rstrip("/")
ENTITY_RESOLUTION_URL = os.getenv("ENTITY_RESOLUTION_URL", "http://localhost:8003").rstrip("/")
INGESTION_URL = os.getenv("INGESTION_URL", "http://localhost:8004").rstrip("/")
AGENT_DB_PATH = Path(os.getenv("AGENT_DB_PATH", str(ROOT_DIR / "data" / "agent.db")))
HTTP_TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT_SECONDS", "6"))

# OpenAI-compatible LLM configuration.
# Examples:
# - Groq: LLM_BASE_URL=https://api.groq.com/openai/v1, PLANNER_MODEL=llama-3.1-8b-instant
# - Featherless: LLM_BASE_URL=https://api.featherless.ai/v1, PLANNER_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct
LLM_API_KEY = os.getenv("LLM_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("FEATHERLESS_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL") or os.getenv("FEATHERLESS_BASE_URL", "https://api.groq.com/openai/v1")
PLANNER_MODEL = os.getenv("PLANNER_MODEL", "llama-3.1-8b-instant")
FORMATTER_MODEL = os.getenv("FORMATTER_MODEL", "llama-3.3-70b-versatile")
