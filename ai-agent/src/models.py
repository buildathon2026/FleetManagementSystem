from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


Confidence = Literal["HIGH", "MEDIUM", "LOW"]
QueryType = Literal["STRUCTURED", "DOCUMENT", "MIXED", "OVERVIEW", "UNKNOWN"]


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    conversation_id: str | None = None


class ToolCall(BaseModel):
    tool: str
    params: dict[str, Any] = Field(default_factory=dict)
    depends_on: str | None = None


class Plan(BaseModel):
    query_type: QueryType
    tools: list[ToolCall]
    rationale: str


class ToolResult(BaseModel):
    tool: str
    params: dict[str, Any]
    ok: bool
    data: Any = None
    error: str | None = None
    status_code: int | None = None
    elapsed_ms: int


class AskResponse(BaseModel):
    conversation_id: str
    answer: str
    sources: list[str]
    confidence: Confidence
    query_type: QueryType
    plan_executed: dict[str, Any]


class FeedbackRequest(BaseModel):
    conversation_id: str
    rating: Literal["up", "down"]
    comment: str | None = None
