"""
LLM-based Formatter — uses Featherless model to produce natural language
answers from tool execution results.
"""

from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from .config import FEATHERLESS_API_KEY, FEATHERLESS_BASE_URL, FORMATTER_MODEL
from .models import Confidence, Plan, ToolResult

SYSTEM_PROMPT = """You are a fleet management assistant. Format tool execution results into a clear, concise natural language answer for a fleet operator.

RULES:
- ONLY use data from the tool results. NEVER invent numbers or facts.
- Include specific amounts (with $ and 2 decimal places), dates, and IDs.
- If results contain document IDs or invoice references, mention them as sources.
- Keep answers concise: 1-3 sentences for simple queries, short paragraph for complex.
- If a tool returned an error, acknowledge it clearly.
- Use plain language suitable for a fleet operator, not a developer.
- Do NOT wrap your answer in quotes or add prefixes like "Answer:".
"""


class LLMFormatter:
    def __init__(self) -> None:
        self._client: OpenAI | None = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            if not FEATHERLESS_API_KEY:
                raise RuntimeError("FEATHERLESS_API_KEY not set")
            self._client = OpenAI(api_key=FEATHERLESS_API_KEY, base_url=FEATHERLESS_BASE_URL)
        return self._client

    def format(
        self, question: str, plan: Plan, results: list[ToolResult]
    ) -> tuple[str, list[str], Confidence]:
        failed = [r for r in results if not r.ok]
        successful = [r for r in results if r.ok]

        if not plan.tools:
            return (
                "I could not identify a supported fleet query for that question.",
                [],
                "LOW",
            )

        # Determine confidence
        if failed and not successful:
            confidence: Confidence = "LOW"
        elif failed:
            confidence = "MEDIUM"
        else:
            confidence = "HIGH"

        # Extract sources
        sources = self._extract_sources(results)

        # Build context for LLM
        results_summary = []
        for r in results:
            entry: dict[str, Any] = {"tool": r.tool, "params": r.params}
            if r.ok:
                entry["result"] = r.data
            else:
                entry["error"] = r.error
            results_summary.append(entry)

        user_message = (
            f"User question: {question}\n\n"
            f"Tool execution results:\n{json.dumps(results_summary, indent=2, default=str)}"
        )

        try:
            client = self._get_client()
            response = client.chat.completions.create(
                model=FORMATTER_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.3,
                max_tokens=512,
            )
            answer = response.choices[0].message.content.strip()
        except Exception:
            # Fallback to basic formatting
            answer = self._fallback(results)

        return answer, sources[:20], confidence

    def _extract_sources(self, results: list[ToolResult]) -> list[str]:
        sources: list[str] = []
        for r in results:
            if r.ok and isinstance(r.data, dict):
                for key in ("items", "documents"):
                    items = r.data.get(key, [])
                    if isinstance(items, list):
                        for item in items:
                            if isinstance(item, dict):
                                src = item.get("doc_ref") or item.get("id") or item.get("load_id")
                                if src:
                                    sources.append(str(src))
        return sources

    def _fallback(self, results: list[ToolResult]) -> str:
        parts = []
        for r in results:
            if r.ok and isinstance(r.data, dict):
                if "total" in r.data:
                    parts.append(f"{r.tool}: ${r.data['total']:,.2f} ({r.data.get('count', '?')} records)")
                elif "canonical_id" in r.data:
                    parts.append(f"Resolved: {r.data['canonical_id']}")
                elif "fleet_size" in r.data:
                    parts.append(f"Fleet: {r.data['fleet_size']} trucks")
                else:
                    parts.append(f"{r.tool}: completed")
            elif not r.ok:
                parts.append(f"{r.tool}: error — {r.error}")
        return " | ".join(parts) if parts else "No data returned."
