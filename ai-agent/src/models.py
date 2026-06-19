from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


Confidence = Literal["HIGH", "MEDIUM", "LOW"]
QueryType = Literal["STRUCTURED", "DOCUMENT", "MIXED", "OVERVIEW", "UNKNOWN"]


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None


class ToolCall(BaseModel):
    tool: str
    params: dict[str, Any] = Field(default_factory=dict)
    depends_on: Optional[str] = None


class Plan(BaseModel):
    query_type: QueryType
    tools: list[ToolCall]
    rationale: str


class ToolResult(BaseModel):
    tool: str
    params: dict[str, Any]
    ok: bool
    data: Any = None
    error: Optional[str] = None
    status_code: Optional[int] = None
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
    comment: Optional[str] = None
