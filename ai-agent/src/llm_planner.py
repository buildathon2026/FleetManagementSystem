"""
LLM-based Planner — uses an OpenAI-compatible model to convert
natural language questions into JSON tool-call plans.
"""

from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from .config import LLM_API_KEY, LLM_BASE_URL, PLANNER_MODEL
from .models import Plan, ToolCall

SYSTEM_PROMPT = """You are a fleet management query planner. Your ONLY job is to convert a user question into a JSON array of tool calls.

Available tools:
1. get_expenses - Query expense records. Params: truck_id (optional), category (optional: fuel|parts|labor|insurance|registration|tax|toll), date_from (YYYY-MM-DD, optional), date_to (YYYY-MM-DD, optional)
2. get_revenue - Query revenue records. Params: truck_id (optional), date_from (optional), date_to (optional)
3. get_truck_profit - Calculate net profit. Params: truck_id (optional), period (required: Q1-2026 or 2026-05)
4. find_document - Find documents for an entity. Params: entity_id (required), doc_type (optional: title|registration|insurance|tax_form|fuel_receipt|maintenance|inspection|settlement|email|toll_receipt), date_from (optional)
5. resolve_entity - Resolve natural language mention to canonical ID. Params: mention (required)
6. get_upcoming_renewals - Find expiring documents. Params: days_ahead (optional, default 30)
7. get_fleet_overview - Get fleet dashboard summary. No params.

RULES:
- If the user mentions a truck by informal name (e.g., "truck 84", "unit 84", "the white Cascadia"), FIRST call resolve_entity, then use the resolved ID in subsequent calls.
- Today's date is 2026-06-19. Use this for relative date references like "last month" = 2026-05-01 to 2026-05-31, "this month" = 2026-06-01 to 2026-06-19.
- Output ONLY a valid JSON object with keys: "tools" (array of tool calls) and "rationale" (one sentence explaining your plan).
- Each tool call: {"tool": "tool_name", "params": {...}}
- For dependent calls (e.g., resolve_entity result needed by next call), use "$resolve_entity.canonical_id" as the param value.

Examples:
User: "How much did I spend on parts last month?"
{"tools": [{"tool": "get_expenses", "params": {"category": "parts", "date_from": "2026-05-01", "date_to": "2026-05-31"}}], "rationale": "Direct expense lookup with category and date filter."}

User: "What's truck 84's profit this quarter?"
{"tools": [{"tool": "resolve_entity", "params": {"mention": "truck 84"}}, {"tool": "get_truck_profit", "params": {"truck_id": "$resolve_entity.canonical_id", "period": "Q2-2026"}}], "rationale": "Resolve truck mention first, then calculate profit for current quarter."}

User: "Any renewals coming up?"
{"tools": [{"tool": "get_upcoming_renewals", "params": {"days_ahead": 30}}], "rationale": "Check for documents expiring in the next 30 days."}
"""


class LLMPlanner:
    def __init__(self) -> None:
        self._client: OpenAI | None = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            if not LLM_API_KEY:
                raise RuntimeError("LLM_API_KEY or GROQ_API_KEY not set")
            self._client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
        return self._client

    def plan(self, question: str) -> Plan:
        client = self._get_client()
        response = client.chat.completions.create(
            model=PLANNER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
            temperature=0.0,
            max_tokens=512,
        )

        raw = response.choices[0].message.content.strip()
        parsed = self._parse_response(raw)

        tools: list[ToolCall] = []
        has_resolve = False
        for call in parsed.get("tools", []):
            tool_name = call.get("tool", "")
            params = call.get("params", {})
            depends_on = None
            if has_resolve and any(
                isinstance(v, str) and v.startswith("$resolve_entity")
                for v in params.values()
            ):
                depends_on = "resolve_entity"
            tools.append(ToolCall(tool=tool_name, params=params, depends_on=depends_on))
            if tool_name == "resolve_entity":
                has_resolve = True

        rationale = parsed.get("rationale", "LLM-generated plan.")
        query_type = self._infer_query_type(tools)

        return Plan(query_type=query_type, tools=tools, rationale=rationale)

    def _parse_response(self, raw: str) -> dict[str, Any]:
        # Strip markdown fences if present
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(line for line in lines if not line.startswith("```")).strip()

        try:
            result = json.loads(raw)
            if isinstance(result, dict):
                return result
            if isinstance(result, list):
                return {"tools": result, "rationale": "Parsed from array response."}
        except json.JSONDecodeError:
            pass

        # Try extracting JSON object
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(raw[start:end])
            except json.JSONDecodeError:
                pass

        # Try extracting JSON array
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            try:
                tools = json.loads(raw[start:end])
                return {"tools": tools, "rationale": "Parsed from array."}
            except json.JSONDecodeError:
                pass

        return {"tools": [], "rationale": "Failed to parse LLM response."}

    def _infer_query_type(self, tools: list[ToolCall]) -> str:
        tool_names = {t.tool for t in tools}
        if "find_document" in tool_names:
            return "DOCUMENT"
        if "get_fleet_overview" in tool_names:
            return "OVERVIEW"
        if tool_names & {"get_expenses", "get_revenue", "get_truck_profit"}:
            return "STRUCTURED"
        if tool_names == {"resolve_entity"}:
            return "UNKNOWN"
        return "STRUCTURED"
