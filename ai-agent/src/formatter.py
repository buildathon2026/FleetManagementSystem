from __future__ import annotations

from typing import Any

from .models import Confidence, Plan, ToolResult


class Formatter:
    def format(self, question: str, plan: Plan, results: list[ToolResult]) -> tuple[str, list[str], Confidence]:
        failed = [result for result in results if not result.ok]
        successful = [result for result in results if result.ok]

        if not plan.tools:
            return (
                "I could not identify a supported fleet tool for that question yet. Try asking about expenses, revenue, profit, documents, renewals, or fleet overview.",
                [],
                "LOW",
            )

        if failed and not successful:
            errors = "; ".join(f"{result.tool}: {result.error}" for result in failed)
            return f"I could not complete the request because the required service call failed: {errors}.", [], "LOW"

        primary = successful[-1] if successful else failed[-1]
        data = primary.data if isinstance(primary.data, dict) else {}

        if primary.tool == "get_expenses":
            return self._format_expenses(data), self._expense_sources(data), self._confidence(failed, data.get("count", 0))

        if primary.tool == "get_revenue":
            return self._format_revenue(data), self._revenue_sources(data), self._confidence(failed, data.get("load_count", 0))

        if primary.tool == "get_truck_profit":
            return self._format_profit(data), [], self._confidence(failed, len(data.get("trucks", [])))

        if primary.tool == "find_document":
            return self._format_documents(data), [doc["id"] for doc in data.get("documents", []) if "id" in doc], self._confidence(failed, data.get("count", 0))

        if primary.tool == "get_upcoming_renewals":
            return self._format_renewals(data), self._generic_sources(data), "MEDIUM" if failed else "HIGH"

        if primary.tool == "get_fleet_overview":
            return self._format_overview(data), [], "MEDIUM" if failed else "HIGH"

        if primary.tool == "resolve_entity":
            canonical_id = data.get("canonical_id") or data.get("id")
            confidence = data.get("confidence", 0)
            return f"I resolved that mention to {canonical_id} with confidence {confidence}.", [], "MEDIUM"

        return "I ran the planned tools, but I do not have a formatter for that result yet.", self._generic_sources(data), "LOW"

    def _format_expenses(self, data: dict[str, Any]) -> str:
        total = self._money(data.get("total", 0))
        count = data.get("count", 0)
        if count == 0:
            return "I found no matching expenses for that query."
        return f"You spent {total} across {count} matching expense records."

    def _format_revenue(self, data: dict[str, Any]) -> str:
        total = self._money(data.get("total", 0))
        count = data.get("load_count", 0)
        if count == 0:
            return "I found no matching revenue records for that query."
        return f"You earned {total} across {count} matching loads."

    def _format_profit(self, data: dict[str, Any]) -> str:
        trucks = data.get("trucks", [])
        period = data.get("period", "the requested period")
        if not trucks:
            return f"I found no profit records for {period}."

        if len(trucks) == 1:
            truck = trucks[0]
            return (
                f"For {period}, {truck['id']} had {self._money(truck.get('revenue', 0))} in revenue, "
                f"{self._money(truck.get('expenses', 0))} in expenses, and net profit of {self._money(truck.get('net', 0))}."
            )

        net = sum(float(truck.get("net", 0)) for truck in trucks)
        revenue = sum(float(truck.get("revenue", 0)) for truck in trucks)
        expenses = sum(float(truck.get("expenses", 0)) for truck in trucks)
        return (
            f"For {period}, the fleet had {self._money(revenue)} in revenue, "
            f"{self._money(expenses)} in expenses, and net profit of {self._money(net)} across {len(trucks)} trucks."
        )

    def _format_documents(self, data: dict[str, Any]) -> str:
        docs = data.get("documents", [])
        if not docs:
            return "I found no matching documents."
        first = docs[0]
        return f"I found {len(docs)} matching documents. The newest is {first.get('id')} ({first.get('type')}) dated {first.get('date')}."

    def _format_renewals(self, data: dict[str, Any]) -> str:
        items = data.get("items") or data.get("renewals") or []
        if not items:
            return "I found no upcoming renewals in the requested window."
        return f"I found {len(items)} upcoming renewals. The soonest is {items[0]}."

    def _format_overview(self, data: dict[str, Any]) -> str:
        fleet_size = data.get("fleet_size", len(data.get("trucks", [])))
        alerts = data.get("alerts", [])
        return f"Fleet overview: {fleet_size} trucks, {len(alerts)} active alerts."

    def _expense_sources(self, data: dict[str, Any]) -> list[str]:
        return [item["doc_ref"] for item in data.get("items", []) if item.get("doc_ref")]

    def _revenue_sources(self, data: dict[str, Any]) -> list[str]:
        return [item["load_id"] for item in data.get("items", []) if item.get("load_id")]

    def _generic_sources(self, data: dict[str, Any]) -> list[str]:
        sources: list[str] = []
        for value in data.values():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        source = item.get("id") or item.get("doc_ref") or item.get("load_id")
                        if source:
                            sources.append(source)
        return sources

    def _confidence(self, failed: list[ToolResult], evidence_count: int) -> Confidence:
        if failed:
            return "MEDIUM" if evidence_count else "LOW"
        return "HIGH" if evidence_count else "MEDIUM"

    def _money(self, value: Any) -> str:
        return f"${float(value):,.2f}"
