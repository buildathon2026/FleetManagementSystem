from __future__ import annotations

from src.planner import Planner


def test_plans_profit_with_entity_resolution() -> None:
    plan = Planner().plan("How profitable was truck 84 in May 2026?")

    assert plan.query_type == "STRUCTURED"
    assert [tool.tool for tool in plan.tools] == ["resolve_entity", "get_truck_profit"]
    assert plan.tools[1].params["period"] == "2026-05"
    assert plan.tools[1].params["truck_id"] == "$resolve_entity.canonical_id"


def test_plans_parts_expense_query() -> None:
    plan = Planner().plan("How much did I spend on parts last month?")

    assert plan.query_type == "STRUCTURED"
    assert plan.tools[0].tool == "get_expenses"
    assert plan.tools[0].params["category"] == "parts"


def test_plans_document_lookup() -> None:
    plan = Planner().plan("Show insurance documents for unit 84")

    assert [tool.tool for tool in plan.tools] == ["resolve_entity", "find_document"]
    assert plan.tools[1].params["doc_type"] == "insurance"
