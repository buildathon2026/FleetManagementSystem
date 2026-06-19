"""
Formatter — converts raw tool execution results into natural language answers.

Uses a larger model (70B via Featherless) at temp=0.3 to produce
human-readable answers with citations. Never fabricates data — only
summarizes what the tools returned.
"""

import json
import os
from typing import Any

from openai import OpenAI

FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "")
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"
FORMATTER_MODEL = "meta-llama/Meta-Llama-3.1-70B-Instruct"

SYSTEM_PROMPT = """You are a fleet management assistant. Your job is to format tool execution results into a clear, concise natural language answer.

RULES:
- ONLY use data from the tool results provided. NEVER make up numbers or facts.
- Include specific numbers, dates, and IDs from the results.
- If results contain document IDs or invoice IDs, cite them as sources.
- Keep answers concise — 1-3 sentences for simple queries, up to a short paragraph for complex ones.
- If a tool returned an error, acknowledge it and explain what information is missing.
- Format currency with $ and 2 decimal places.
- Use plain language suitable for a fleet operator (not a developer).

CONFIDENCE SCORING:
- HIGH: All tools returned successfully with clear data.
- MEDIUM: Some tools had partial results or ambiguous entity resolution.
- LOW: Errors occurred or entity could not be resolved.

Respond with ONLY the answer text. No JSON, no markdown formatting, no prefixes like "Answer:".
"""


def format_response(
    question: str, tool_results: list[dict[str, Any]]
) -> dict[str, Any]:
    """
    Format tool execution results into a natural language response.

    Returns: {"answer": str, "sources": list, "confidence": str, "query_type": str}
    """
    # Determine confidence and query type
    has_errors = any("error" in r for r in tool_results)
    has_results = any("result" in r for r in tool_results)

    if has_errors and not has_results:
        confidence = "LOW"
    elif has_errors:
        confidence = "MEDIUM"
    else:
        confidence = "HIGH"

    # Determine query type based on tools used
    tools_used = [r["tool"] for r in tool_results]
    if "find_document" in tools_used:
        query_type = "RETRIEVAL"
    elif any(t in tools_used for t in ["get_expenses", "get_revenue", "get_truck_profit"]):
        if "find_document" in tools_used:
            query_type = "HYBRID"
        else:
            query_type = "STRUCTURED"
    else:
        query_type = "STRUCTURED"

    # Extract sources from results
    sources = []
    for r in tool_results:
        if "result" in r:
            result_data = r["result"]
            if isinstance(result_data, dict):
                # Pull document/invoice IDs from items
                items = result_data.get("items", []) or result_data.get("documents", [])
                for item in items[:10]:  # Cap at 10 sources
                    item_id = item.get("id") or item.get("doc_id")
                    if item_id:
                        sources.append(str(item_id))

    # Build context for the formatter
    results_context = json.dumps(tool_results, indent=2, default=str)

    client = OpenAI(api_key=FEATHERLESS_API_KEY, base_url=FEATHERLESS_BASE_URL)

    try:
        if not FEATHERLESS_API_KEY:
            raise ValueError("No API key")
        response = client.chat.completions.create(
            model=FORMATTER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"User question: {question}\n\nTool execution results:\n{results_context}",
                },
            ],
            temperature=0.3,
            max_tokens=512,
        )
        answer = response.choices[0].message.content.strip()
    except Exception as e:
        # Fallback: produce a basic summary from the data
        answer = _fallback_format(question, tool_results)

    return {
        "answer": answer,
        "sources": sources[:10],
        "confidence": confidence,
        "query_type": query_type,
    }


def _fallback_format(question: str, tool_results: list[dict[str, Any]]) -> str:
    """Basic fallback formatter when the LLM is unavailable."""
    parts = []
    for r in tool_results:
        if "error" in r:
            parts.append(f"Error calling {r['tool']}: {r['error']}")
        elif "result" in r:
            result = r["result"]
            if isinstance(result, dict):
                if "total" in result:
                    parts.append(f"{r['tool']}: total ${result['total']:,.2f} ({result.get('count', '?')} items)")
                elif "canonical_id" in result:
                    parts.append(f"Resolved to {result['canonical_id']} ({result.get('canonical_name', '')})")
                elif "trucks" in result:
                    parts.append(f"Fleet: {len(result['trucks'])} trucks")
                elif "documents" in result:
                    parts.append(f"Found {result.get('count', len(result['documents']))} documents")
                else:
                    parts.append(f"{r['tool']}: completed")
    return " | ".join(parts) if parts else "No data available for your question."
