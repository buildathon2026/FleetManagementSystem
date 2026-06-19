"""
Planner — converts natural language questions into JSON tool-call plans.

Uses a small 8B model (Meta-Llama-3.1-8B-Instruct via Featherless) at temp=0.0
to generate deterministic, structured tool-call plans.
"""

import json
import os
from typing import Any

from openai import OpenAI

FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "")
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"
PLANNER_MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct"

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
- Today's date is 2026-06-19. Use this for relative date references like "last month" = 2026-05-01 to 2026-05-31.
- Output ONLY a valid JSON array. No explanations, no markdown, no extra text.
- Each element: {"tool": "tool_name", "params": {...}}

Examples:
User: "How much did I spend on parts last month?"
[{"tool": "get_expenses", "params": {"category": "parts", "date_from": "2026-05-01", "date_to": "2026-05-31"}}]

User: "What's truck 84's profit this quarter?"
[{"tool": "resolve_entity", "params": {"mention": "truck 84"}}, {"tool": "get_truck_profit", "params": {"truck_id": "T-084", "period": "Q2-2026"}}]

User: "Show me all documents for the white Cascadia"
[{"tool": "resolve_entity", "params": {"mention": "the white Cascadia"}}, {"tool": "find_document", "params": {"entity_id": "T-084"}}]

User: "Any renewals coming up?"
[{"tool": "get_upcoming_renewals", "params": {"days_ahead": 30}}]

User: "Fleet overview"
[{"tool": "get_fleet_overview", "params": {}}]
"""


def create_plan(question: str) -> list[dict[str, Any]]:
    """
    Use the 8B planner model to convert a question into a tool-call plan.
    Falls back to rule-based planning if the LLM is unavailable.

    Returns a list of tool calls: [{"tool": "...", "params": {...}}, ...]
    """
    # Try LLM-based planning first
    if FEATHERLESS_API_KEY:
        try:
            return _llm_plan(question)
        except Exception:
            pass  # Fall through to rule-based planner

    # Rule-based fallback planner
    return _rule_based_plan(question)


def _llm_plan(question: str) -> list[dict[str, Any]]:
    """LLM-based planner using Featherless 8B model."""
    client = OpenAI(api_key=FEATHERLESS_API_KEY, base_url=FEATHERLESS_BASE_URL)

    response = client.chat.completions.create(
        model=PLANNER_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        temperature=0.0,
        max_tokens=512,
    )

    raw_content = response.choices[0].message.content.strip()

    # Parse the JSON response — handle markdown fencing if model wraps it
    if raw_content.startswith("```"):
        lines = raw_content.split("\n")
        raw_content = "\n".join(
            line for line in lines if not line.startswith("```")
        ).strip()

    try:
        plan = json.loads(raw_content)
        if isinstance(plan, list):
            return plan
        if isinstance(plan, dict):
            return [plan]
    except json.JSONDecodeError:
        start = raw_content.find("[")
        end = raw_content.rfind("]") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(raw_content[start:end])
            except json.JSONDecodeError:
                pass

    return []


def _rule_based_plan(question: str) -> list[dict[str, Any]]:
    """
    Rule-based fallback planner. Handles common query patterns
    without requiring an LLM.
    """
    q = question.lower()
    plan: list[dict[str, Any]] = []

    # Entity resolution — detect truck/unit mentions
    import re
    truck_match = re.search(r'(?:truck|unit|trk)\s*#?(\d{2,3})', q)
    resolved_id = None
    if truck_match:
        num = truck_match.group(1).zfill(3)
        resolved_id = f"T-{num}"
        plan.append({"tool": "resolve_entity", "params": {"mention": f"truck {truck_match.group(1)}"}})

    # Expense queries
    if any(word in q for word in ["spend", "spent", "expense", "cost"]):
        params: dict[str, Any] = {}
        if resolved_id:
            params["truck_id"] = resolved_id
        # Category detection
        for cat in ["fuel", "parts", "labor", "insurance", "registration", "tax", "toll", "maintenance"]:
            if cat in q:
                params["category"] = cat
                break
        # Date detection
        if "last month" in q:
            params["date_from"] = "2026-05-01"
            params["date_to"] = "2026-05-31"
        elif "this month" in q:
            params["date_from"] = "2026-06-01"
            params["date_to"] = "2026-06-19"
        plan.append({"tool": "get_expenses", "params": params})
        return plan

    # Revenue queries
    if any(word in q for word in ["revenue", "income", "earn", "made"]):
        params = {}
        if resolved_id:
            params["truck_id"] = resolved_id
        if "last month" in q:
            params["date_from"] = "2026-05-01"
            params["date_to"] = "2026-05-31"
        elif "this month" in q:
            params["date_from"] = "2026-06-01"
            params["date_to"] = "2026-06-19"
        plan.append({"tool": "get_revenue", "params": params})
        return plan

    # Profit queries
    if any(word in q for word in ["profit", "net", "p&l", "margin"]):
        params = {}
        if resolved_id:
            params["truck_id"] = resolved_id
        if "q1" in q:
            params["period"] = "Q1-2026"
        elif "q2" in q:
            params["period"] = "Q2-2026"
        elif "last month" in q:
            params["period"] = "2026-05"
        elif "this month" in q:
            params["period"] = "2026-06"
        else:
            params["period"] = "2026-06"
        plan.append({"tool": "get_truck_profit", "params": params})
        return plan

    # Document queries
    if any(word in q for word in ["document", "doc", "find", "show me"]):
        params = {}
        if resolved_id:
            params["entity_id"] = resolved_id
        else:
            params["entity_id"] = "T-084"  # default
        plan.append({"tool": "find_document", "params": params})
        return plan

    # Renewal queries
    if any(word in q for word in ["renewal", "expir", "due", "upcoming"]):
        params = {"days_ahead": 30}
        plan.append({"tool": "get_upcoming_renewals", "params": params})
        return plan

    # Fleet overview (default)
    if any(word in q for word in ["fleet", "overview", "dashboard", "summary", "all trucks"]):
        plan.append({"tool": "get_fleet_overview", "params": {}})
        return plan

    # Default: fleet overview
    plan.append({"tool": "get_fleet_overview", "params": {}})
    return plan
