from __future__ import annotations

import time
import uuid
from dataclasses import asdict
from typing import Any

from fastapi import FastAPI, HTTPException

from .formatter import Formatter
from .models import AskRequest, AskResponse, FeedbackRequest
from .planner import Planner
from .storage import ConversationStore
from .tool_executor import ToolExecutor


app = FastAPI(title="Fleet AI Agent", version="0.1.0")
planner = Planner()
executor = ToolExecutor()
formatter = Formatter()
store = ConversationStore()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-agent"}


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest) -> AskResponse:
    conversation_id = request.conversation_id or f"conv-{uuid.uuid4().hex[:12]}"
    started = time.perf_counter()

    plan = planner.plan(request.question)
    results = await executor.execute(plan)
    answer, sources, confidence = formatter.format(request.question, plan, results)
    execution_time_ms = int((time.perf_counter() - started) * 1000)

    plan_executed: dict[str, Any] = {
        "tools_called": [call.model_dump() for call in plan.tools],
        "tool_results": [result.model_dump() for result in results],
        "execution_time_ms": execution_time_ms,
        "rationale": plan.rationale,
    }

    response = AskResponse(
        conversation_id=conversation_id,
        answer=answer,
        sources=sources[:20],
        confidence=confidence,
        query_type=plan.query_type,
        plan_executed=plan_executed,
    )

    store.append_message(conversation_id, "user", request.question)
    store.append_message(conversation_id, "assistant", answer, response.model_dump())

    return response


@app.get("/conversation/{conversation_id}")
def conversation(conversation_id: str) -> dict[str, Any]:
    history = store.get_conversation(conversation_id)
    if not history:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return history


@app.post("/feedback")
def feedback(request: FeedbackRequest) -> dict[str, str]:
    if not store.get_conversation(request.conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    store.save_feedback(request.conversation_id, request.rating, request.comment)
    return {"status": "ok"}
