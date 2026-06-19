from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx

from .config import HTTP_TIMEOUT_SECONDS, MCP_TOOLS_URL
from .models import Plan, ToolCall, ToolResult


def tool_url(path: str) -> str:
    return f"{MCP_TOOLS_URL}/{path.lstrip('/')}"


TOOL_ROUTES = {
    "resolve_entity": tool_url("entity/resolve"),
    "get_expenses": tool_url("expenses"),
    "get_revenue": tool_url("revenue"),
    "get_truck_profit": tool_url("profit"),
    "find_document": tool_url("documents"),
    "get_upcoming_renewals": tool_url("renewals"),
    "get_fleet_overview": tool_url("fleet-overview"),
}


class ToolExecutor:
    async def execute(self, plan: Plan) -> list[ToolResult]:
        results: list[ToolResult] = []
        resolved_context: dict[str, Any] = {}
        call_mapping: dict[str, ToolCall] = {}  # Map call_id to ToolCall

        # Build mapping of call IDs to tool calls
        for i, call in enumerate(plan.tools):
            call_id = call.call_id or f"{call.tool}_{i}"
            call_mapping[call_id] = call

        independent = [call for call in plan.tools if not call.depends_on]
        dependent = [call for call in plan.tools if call.depends_on]

        if independent:
            first_results = await asyncio.gather(*(self._call_tool(call, resolved_context, call_mapping) for call in independent))
            results.extend(first_results)
            # Store results by call_id in context
            for call, result in zip(independent, first_results):
                if result.ok and isinstance(result.data, dict):
                    # Store by explicit call_id if set
                    if call.call_id:
                        resolved_context[call.call_id] = result.data
                    else:
                        # For single-entity queries, store by tool name for backwards compatibility
                        resolved_context[call.tool] = result.data

        if dependent:
            next_results = await asyncio.gather(*(self._call_tool(call, resolved_context, call_mapping) for call in dependent))
            results.extend(next_results)
            # Store results by call_id in context
            for call, result in zip(dependent, next_results):
                if result.ok and isinstance(result.data, dict):
                    # Store by explicit call_id if set
                    if call.call_id:
                        resolved_context[call.call_id] = result.data
                    else:
                        # For single-entity queries, store by tool name for backwards compatibility
                        resolved_context[call.tool] = result.data

        return results

    async def _call_tool(self, call: ToolCall, context: dict[str, Any], call_mapping: dict[str, ToolCall] = None) -> ToolResult:
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

        url = TOOL_ROUTES[call.tool]
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
                response = await client.get(url, params=params)
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

    def _update_context(self, context: dict[str, Any], results: list[ToolResult], call_mapping: dict[str, ToolCall] = None) -> None:
        for i, result in enumerate(results):
            if result.ok and isinstance(result.data, dict):
                # Find the call_id for this result
                call_id = None
                if call_mapping:
                    for cid, call in call_mapping.items():
                        if call.tool == result.tool:
                            call_id = cid
                            break

                # Store by call_id if available, otherwise by tool name
                key = call_id or result.tool
                context[key] = result.data
