from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx

from .config import ENTITY_RESOLUTION_URL, FLEET_DATA_URL, HTTP_TIMEOUT_SECONDS
from .models import Plan, ToolCall, ToolResult


TOOL_ROUTES = {
    "resolve_entity": (ENTITY_RESOLUTION_URL, "/resolve"),
    "get_expenses": (FLEET_DATA_URL, "/tools/expenses"),
    "get_revenue": (FLEET_DATA_URL, "/tools/revenue"),
    "get_truck_profit": (FLEET_DATA_URL, "/tools/profit"),
    "find_document": (FLEET_DATA_URL, "/tools/documents"),
    "get_upcoming_renewals": (FLEET_DATA_URL, "/tools/renewals"),
    "get_fleet_overview": (FLEET_DATA_URL, "/tools/fleet-overview"),
}


class ToolExecutor:
    async def execute(self, plan: Plan) -> list[ToolResult]:
        results: list[ToolResult] = []
        resolved_context: dict[str, Any] = {}

        independent = [call for call in plan.tools if not call.depends_on]
        dependent = [call for call in plan.tools if call.depends_on]

        if independent:
            first_results = await asyncio.gather(*(self._call_tool(call, resolved_context) for call in independent))
            results.extend(first_results)
            self._update_context(resolved_context, first_results)

        if dependent:
            next_results = await asyncio.gather(*(self._call_tool(call, resolved_context) for call in dependent))
            results.extend(next_results)

        return results

    async def _call_tool(self, call: ToolCall, context: dict[str, Any]) -> ToolResult:
        if call.tool not in TOOL_ROUTES:
            return ToolResult(
                tool=call.tool,
                params=call.params,
                ok=False,
                error="Unsupported tool",
                elapsed_ms=0,
            )

        params = self._resolve_params(call.params, context)
        missing_param = next((value for value in params.values() if value is None), None)
        if missing_param is None and any(value is None for value in params.values()):
            return ToolResult(tool=call.tool, params=params, ok=False, error="Required context was unavailable", elapsed_ms=0)

        base_url, path = TOOL_ROUTES[call.tool]
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
                response = await client.get(f"{base_url}{path}", params=params)
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            try:
                data = response.json()
            except ValueError:
                data = response.text
            return ToolResult(
                tool=call.tool,
                params=params,
                ok=response.is_success,
                data=data if response.is_success else None,
                error=None if response.is_success else str(data),
                status_code=response.status_code,
                elapsed_ms=elapsed_ms,
            )
        except httpx.HTTPError as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return ToolResult(tool=call.tool, params=params, ok=False, error=str(exc), elapsed_ms=elapsed_ms)

    def _resolve_params(self, params: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        resolved: dict[str, Any] = {}
        for key, value in params.items():
            if isinstance(value, str) and value.startswith("$"):
                resolved[key] = self._lookup_context(value[1:], context)
            else:
                resolved[key] = value
        return resolved

    def _lookup_context(self, path: str, context: dict[str, Any]) -> Any:
        current: Any = context
        for part in path.split("."):
            if not isinstance(current, dict):
                return None
            current = current.get(part)
        return current

    def _update_context(self, context: dict[str, Any], results: list[ToolResult]) -> None:
        for result in results:
            if result.ok and isinstance(result.data, dict):
                context[result.tool] = result.data
