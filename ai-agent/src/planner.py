from __future__ import annotations

import re
from datetime import date

from .models import Plan, ToolCall


MONTHS = {
    "january": "01",
    "february": "02",
    "march": "03",
    "april": "04",
    "may": "05",
    "june": "06",
    "july": "07",
    "august": "08",
    "september": "09",
    "october": "10",
    "november": "11",
    "december": "12",
}


class Planner:
    def plan(self, question: str) -> Plan:
        q = question.lower()
        entity_mentions = self._extract_all_entity_mentions(question)
        period = self._extract_period(q)
        is_comparison = any(word in q for word in ["compare", "vs", "versus", "between", "both", "each"])

        tools: list[ToolCall] = []

        # Handle multiple entities for comparison queries
        if is_comparison and len(entity_mentions) > 1:
            for i, mention in enumerate(entity_mentions):
                tools.append(ToolCall(tool="resolve_entity", params={"mention": mention}, call_id=f"resolve_entity_{i}"))
        elif entity_mentions:
            # Single entity - use first mention
            tools.append(ToolCall(tool="resolve_entity", params={"mention": entity_mentions[0]}))

        if any(word in q for word in ["profit", "profitable", "net", "earnings", "return", "performance"]):
            # Handle multiple trucks for comparison
            if is_comparison and len(entity_mentions) > 1:
                for i, mention in enumerate(entity_mentions):
                    params = {"period": period or date.today().strftime("%Y-%m"), "truck_id": f"$resolve_entity_{i}.canonical_id"}
                    tools.append(ToolCall(tool="get_truck_profit", params=params, depends_on=f"resolve_entity_{i}"))
            elif entity_mentions:
                params = {"period": period or date.today().strftime("%Y-%m"), "truck_id": "$resolve_entity.canonical_id"}
                tools.append(ToolCall(tool="get_truck_profit", params=params, depends_on="resolve_entity"))
            else:
                params = {"period": period or date.today().strftime("%Y-%m")}
                tools.append(ToolCall(tool="get_truck_profit", params=params))
            return Plan(query_type="STRUCTURED", tools=tools, rationale="Profit comparison queries resolve all entities then fetch profit data.")

        if any(word in q for word in ["expense", "expenses", "spend", "spent", "cost"]):
            params = self._date_params(q)
            category = self._extract_expense_category(q)
            if category:
                params["category"] = category
            # Handle multiple trucks for comparison
            if is_comparison and len(entity_mentions) > 1:
                for i, mention in enumerate(entity_mentions):
                    expense_params = {**params, "truck_id": f"$resolve_entity_{i}.canonical_id"}
                    tools.append(ToolCall(tool="get_expenses", params=expense_params, depends_on=f"resolve_entity_{i}"))
            elif entity_mentions:
                params["truck_id"] = "$resolve_entity.canonical_id"
                tools.append(ToolCall(tool="get_expenses", params=params, depends_on="resolve_entity"))
            else:
                tools.append(ToolCall(tool="get_expenses", params=params))
            return Plan(query_type="STRUCTURED", tools=tools, rationale="Expense comparison queries resolve all entities then fetch expense data.")

        if any(word in q for word in ["revenue", "income", "loads", "gross", "estimate", "estimates"]):
            params = self._date_params(q)
            # Handle multiple trucks for comparison
            if is_comparison and len(entity_mentions) > 1:
                for i, mention in enumerate(entity_mentions):
                    revenue_params = {**params, "truck_id": f"$resolve_entity_{i}.canonical_id"}
                    tools.append(ToolCall(tool="get_revenue", params=revenue_params, depends_on=f"resolve_entity_{i}"))
            elif entity_mentions:
                params["truck_id"] = "$resolve_entity.canonical_id"
                tools.append(ToolCall(tool="get_revenue", params=params, depends_on="resolve_entity"))
            else:
                tools.append(ToolCall(tool="get_revenue", params=params))
            return Plan(query_type="STRUCTURED", tools=tools, rationale="Revenue comparison queries resolve all entities then fetch revenue data.")

        if any(word in q for word in ["document", "documents", "invoice", "registration", "insurance", "inspection", "title"]):
            # Handle multiple trucks for document comparison
            if is_comparison and len(entity_mentions) > 1:
                for i, mention in enumerate(entity_mentions):
                    params = {"entity_id": f"$resolve_entity_{i}.canonical_id"}
                    doc_type = self._extract_doc_type(q)
                    if doc_type:
                        params["doc_type"] = doc_type
                    tools.append(ToolCall(tool="find_document", params=params, depends_on=f"resolve_entity_{i}"))
            elif entity_mentions:
                params = {"entity_id": "$resolve_entity.canonical_id"}
                doc_type = self._extract_doc_type(q)
                if doc_type:
                    params["doc_type"] = doc_type
                tools.append(ToolCall(tool="find_document", params=params, depends_on="resolve_entity"))
            else:
                params = {}
                doc_type = self._extract_doc_type(q)
                if doc_type:
                    params["doc_type"] = doc_type
                tools.append(ToolCall(tool="find_document", params=params))
            return Plan(query_type="DOCUMENT", tools=tools, rationale="Document questions use document lookup.")

        if any(word in q for word in ["renewal", "renewals", "expire", "expiring", "due"]):
            tools.append(ToolCall(tool="get_upcoming_renewals", params={"days_ahead": 30}))
            return Plan(query_type="STRUCTURED", tools=tools, rationale="Renewal questions use upcoming renewals.")

        if any(word in q for word in ["fleet", "overview", "dashboard", "status"]):
            tools.append(ToolCall(tool="get_fleet_overview", params={}))
            return Plan(query_type="OVERVIEW", tools=tools, rationale="Fleet summary questions use the overview tool.")

        if entity_mentions:
            return Plan(query_type="UNKNOWN", tools=tools, rationale="Only entity resolution was confidently identified.")

        return Plan(query_type="UNKNOWN", tools=[], rationale="No supported fleet intent was detected.")

    def _extract_all_entity_mentions(self, question: str) -> list[str]:
        """Extract all entity mentions from the question (for comparisons)."""
        patterns = [
            r"\b(?:truck|unit|trk)\s*#?\s*0*\d{1,4}\b",
            r"#\s*0*\d{1,4}\b",
            r"\bT-\d{3}\b",
            r"\bVIN\s+[A-HJ-NPR-Z0-9]{8,17}\b",
            r"\b(?:plate|tag)\s+[A-Z0-9-]{2,12}\b",
            r"\b(?:cdl|license)\s+[A-Z0-9-]{5,20}\b",
        ]

        mentions = []
        seen = set()

        for pattern in patterns:
            for match in re.finditer(pattern, question, flags=re.IGNORECASE):
                mention = match.group(0)
                if mention not in seen:
                    mentions.append(mention)
                    seen.add(mention)

        return mentions

    def _extract_entity_mention(self, question: str) -> str | None:
        """Extract first entity mention (legacy method for backward compatibility)."""
        mentions = self._extract_all_entity_mentions(question)
        return mentions[0] if mentions else None

    def _extract_period(self, q: str) -> str | None:
        today = date.today()
        if "this month" in q or "current month" in q:
            return today.strftime("%Y-%m")
        if "last month" in q or "previous month" in q:
            year = today.year
            month = today.month - 1
            if month == 0:
                year -= 1
                month = 12
            return f"{year}-{month:02d}"

        quarter = re.search(r"\bq([1-4])[-\s]?(20\d{2})\b", q)
        if quarter:
            return f"Q{quarter.group(1)}-{quarter.group(2)}"

        month = re.search(r"\b(" + "|".join(MONTHS.keys()) + r")\s+(20\d{2})\b", q)
        if month:
            return f"{month.group(2)}-{MONTHS[month.group(1)]}"

        numeric = re.search(r"\b(20\d{2})-(0[1-9]|1[0-2])\b", q)
        if numeric:
            return numeric.group(0)

        return None

    def _date_params(self, q: str) -> dict[str, str]:
        period = self._extract_period(q)
        if not period or period.startswith("Q"):
            return {}
        year, month = period.split("-")
        last_day = {
            "01": "31",
            "02": "28",
            "03": "31",
            "04": "30",
            "05": "31",
            "06": "30",
            "07": "31",
            "08": "31",
            "09": "30",
            "10": "31",
            "11": "30",
            "12": "31",
        }[month]
        return {"date_from": f"{year}-{month}-01", "date_to": f"{year}-{month}-{last_day}"}

    def _extract_expense_category(self, q: str) -> str | None:
        for category in ["fuel", "parts", "maintenance", "repair", "insurance", "tolls", "tax"]:
            if category in q:
                return "maintenance" if category == "repair" else category
        return None

    def _extract_doc_type(self, q: str) -> str | None:
        for doc_type in ["registration", "insurance", "inspection", "title", "tax_form", "fuel_receipt", "maintenance"]:
            if doc_type.replace("_", " ") in q or doc_type in q:
                return doc_type
        if "invoice" in q:
            return "maintenance"
        return None
