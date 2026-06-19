from __future__ import annotations

from src.config import MCP_TOOLS_LIST_URL
from src.tool_executor import TOOL_ROUTES


def test_mcp_tool_routes_use_hosted_tools_base() -> None:
    assert TOOL_ROUTES["resolve_entity"] == "http://192.168.1.160:8002/tools/entity/resolve"
    assert TOOL_ROUTES["get_expenses"] == "http://192.168.1.160:8002/tools/expenses"


def test_mcp_tools_list_url_points_to_registry_endpoint() -> None:
    assert MCP_TOOLS_LIST_URL == "http://192.168.1.160:8002/tools/list"
