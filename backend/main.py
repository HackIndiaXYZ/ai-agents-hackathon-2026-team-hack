"""
AgentBridge Backend - Complete in ONE file
Run: python main.py
Requires: pip install fastapi uvicorn groq python-dotenv loguru websockets
"""

import asyncio
import json
import os
import uuid
from collections import defaultdict
from datetime import datetime
from typing import Optional
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger
from groq import Groq
import uvicorn
from dotenv import load_dotenv

load_dotenv()

print("GROQ KEY LOADED:", os.getenv("GROQ_API_KEY", "NOT FOUND")[:10])
app = FastAPI(title="AgentBridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory storage ────────────────────────────────────────────────────────
sessions = {}
ws_connections = defaultdict(list)

# ─── Models ───────────────────────────────────────────────────────────────────
class RunTaskRequest(BaseModel):
    task: str
    language: str = "en"
    session_id: Optional[str] = None
    groq_api_key: Optional[str] = None

class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    reason: Optional[str] = None

# ─── Risk Classifier ──────────────────────────────────────────────────────────
def classify_risk(tool: str, inputs: dict) -> dict:
    HIGH_RISK = [
        {
            "tool": "gmail_send",
            "check": lambda i: len(i.get("to", []) if isinstance(i.get("to"), list) else [i.get("to","")]) > 10,
            "reason": "Sending email to more than 10 recipients"
        },
        {
            "tool": "*",
            "check": lambda i: any(k in str(i).lower() for k in ["drop table", "rm -rf", "truncate", "delete from"]),
            "reason": "Destructive command detected"
        },
        {
            "tool": "gmail_send",
            "check": lambda i: any(k in i.get("subject","").lower() for k in ["delete","terminate","cancel"]),
            "reason": "High-stakes keyword in email subject"
        },
    ]
    MEDIUM_RISK = [
        {"tool": "gmail_send",   "check": lambda i: True, "reason": "Outbound email — audit logged"},
        {"tool": "gdrive_write", "check": lambda i: True, "reason": "File write — audit logged"},
        {"tool": "jira_create",  "check": lambda i: True, "reason": "Issue creation — audit logged"},
        {"tool": "slack_send",   "check": lambda i: "#general" in i.get("channel",""), "reason": "Company-wide channel"},
        {"tool": "code_execute", "check": lambda i: True, "reason": "Code execution — audit logged"},
    ]
    for rule in HIGH_RISK:
        if rule["tool"] in ("*", tool):
            try:
                if rule["check"](inputs):
                    return {"level": "high", "score": 0.95, "reason": rule["reason"]}
            except: pass
    for rule in MEDIUM_RISK:
        if rule["tool"] == tool:
            try:
                if rule["check"](inputs):
                    return {"level": "medium", "score": 0.55, "reason": rule["reason"]}
            except: pass
    return {"level": "low", "score": 0.1, "reason": "No risk patterns detected"}

# ─── Tool Executor ────────────────────────────────────────────────────────────
def execute_tool(tool_name: str, inputs: dict) -> dict:
    time.sleep(0.3)
    mock_outputs = {
        "gmail_read": {
            "emails": [{"from": "manager@company.com", "subject": inputs.get("query","Latest"), "body": "Please review the Q2 report and share feedback by Friday."}],
            "total": 1
        },
        "gmail_send": {"message_id": f"msg_{int(time.time())}", "recipients": inputs.get("to",[]), "sent_at": datetime.utcnow().isoformat()},
        "gdrive_read": {"file_name": "Q2_Report_2026.pdf", "content_preview": "Q2 2026 — Revenue grew 23% YoY. Key highlights: Product A +45%", "size_bytes": 245678},
        "gdrive_write": {"file_id": f"file_{int(time.time())}", "file_name": inputs.get("file_name","output.txt"), "url": "https://drive.google.com/file/d/demo"},
        "slack_send": {"ok": True, "channel": inputs.get("channel","#general"), "ts": str(time.time())},
        "jira_create": {"issue_key": f"PROJ-{int(time.time()) % 9999}", "summary": inputs.get("summary",""), "url": "https://jira.company.com/browse/PROJ-001"},
        "jira_read": {"issues": [{"key": "PROJ-42", "summary": "Implement auth", "status": "In Progress"}], "total": 1},
        "web_search": {
            "query": inputs.get("query",""),
            "results": [
                {"title": f"AI Agents in 2026: Complete Guide", "link": "https://example.com/ai-agents", "snippet": f"Comprehensive overview of AI agent trends for '{inputs.get('query','')}'"},
                {"title": "LangGraph vs CrewAI: Comparison", "link": "https://example.com/langgraph", "snippet": "Deep dive into multi-agent frameworks and orchestration patterns"},
            ]
        },
        "code_execute": {"stdout": "Result: Analysis complete", "exit_code": 0, "duration_ms": 123},
    }
    return mock_outputs.get(tool_name, {"result": "Tool executed", "tool": tool_name})

# ─── Groq LLM calls ───────────────────────────────────────────────────────────
def call_groq(api_key: str, system: str, user: str) -> str:
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0.2,
        max_tokens=2048
    )
    return response.choices[0].message.content

def run_planner(api_key: str, task: str, language: str) -> list:
    raw = call_groq(
        api_key,
        system="""You are a task planner for an AI agent system.
Break the user task into 2-4 concrete subtasks.
Available tools: gmail_read, gmail_send, gdrive_read, gdrive_write, slack_send, jira_create, jira_read, web_search, code_execute
Respond ONLY with a valid JSON array. No markdown, no explanation.
Format: [{"id":"subtask_1","description":"...","required_tool":"tool_name","inputs":{"key":"val"},"estimated_risk":"low|medium|high"}]""",
        user=f"Task: {task}\nLanguage: {language}"
    )
    try:
        clean = raw.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"): clean = clean[4:]
        return json.loads(clean.strip())
    except:
        return [{"id":"subtask_1","description":task,"required_tool":"web_search","inputs":{"query":task},"estimated_risk":"low"}]

def run_evaluator(api_key: str, task: str, language: str, results: list) -> str:
    summary = json.dumps([
        {"task": r["description"], "tool": r["tool"], "success": r["success"], "output": str(r.get("output",""))[:300]}
        for r in results
    ], indent=2)
    return call_groq(
        api_key,
        system="You are a quality evaluator. Summarize what the agent accomplished clearly and helpfully. Respond in the same language as the original task.",
        user=f"Original task: {task}\nLanguage: {language}\nResults:\n{summary}"
    )

# ─── WebSocket broadcaster ────────────────────────────────────────────────────
async def broadcast(session_id: str, event: dict):
    dead = []
    for ws in ws_connections.get(session_id, []):
        try:
            await ws.send_text(json.dumps(event))
        except:
            dead.append(ws)
    for ws in dead:
        try: ws_connections[session_id].remove(ws)
        except: pass

# ─── Main agent runner ────────────────────────────────────────────────────────
async def run_agent_pipeline(session_id: str, task: str, language: str, api_key: str):
    results = []
    subtasks = []

    try:
        # Phase 1: Planning
        await broadcast(session_id, {"type": "status", "status": "planning", "message": "Planner breaking down task...", "timestamp": datetime.utcnow().isoformat()})

        subtasks = run_planner(api_key, task, language)
        sessions[session_id]["subtasks"] = subtasks

        plan_entry = {
            "agent": "planner",
            "timestamp": datetime.utcnow().isoformat(),
            "action": "task_breakdown",
            "subtask_count": len(subtasks),
            "subtasks": subtasks
        }
        sessions[session_id]["tool_calls_log"].append(plan_entry)
        await broadcast(session_id, {"type": "tool_call", "data": plan_entry})

        # Phase 2: Execution
        await broadcast(session_id, {"type": "status", "status": "executing", "timestamp": datetime.utcnow().isoformat()})

        for idx, subtask in enumerate(subtasks):
            risk = classify_risk(subtask["required_tool"], subtask["inputs"])

            log_entry = {
                "agent": "executor",
                "timestamp": datetime.utcnow().isoformat(),
                "subtask_id": subtask["id"],
                "tool": subtask["required_tool"],
                "inputs": subtask["inputs"],
                "risk_level": risk["level"],
                "risk_score": risk["score"],
                "risk_reason": risk["reason"],
            }

            # Block high risk
            if risk["level"] == "high":
                log_entry["status"] = "blocked"
                sessions[session_id]["tool_calls_log"].append(log_entry)
                sessions[session_id]["pending_approval"] = {"subtask": subtask, "risk": risk, "remaining_index": idx}
                sessions[session_id]["status"] = "blocked"
                await broadcast(session_id, {"type": "tool_call", "data": log_entry})
                await broadcast(session_id, {
                    "type": "blocked",
                    "pending_approval": {"subtask": subtask, "risk": risk},
                    "message": "⚠ High-risk action blocked. Human approval required.",
                    "timestamp": datetime.utcnow().isoformat()
                })
                return

            # Execute tool
            start = datetime.utcnow()
            try:
                tool_result = execute_tool(subtask["required_tool"], subtask["inputs"])
                duration_ms = int((datetime.utcnow() - start).total_seconds() * 1000)
                log_entry.update({"status": "success", "output_preview": str(tool_result)[:200], "duration_ms": duration_ms})
                results.append({"subtask_id": subtask["id"], "description": subtask["description"], "tool": subtask["required_tool"], "output": tool_result, "success": True})
            except Exception as e:
                duration_ms = int((datetime.utcnow() - start).total_seconds() * 1000)
                log_entry.update({"status": "error", "error": str(e), "duration_ms": duration_ms})
                results.append({"subtask_id": subtask["id"], "description": subtask["description"], "tool": subtask["required_tool"], "output": None, "error": str(e), "success": False})

            sessions[session_id]["tool_calls_log"].append(log_entry)
            sessions[session_id]["results"] = results
            await broadcast(session_id, {"type": "tool_call", "data": log_entry})
            await asyncio.sleep(0.1)

        # Phase 3: Evaluation
        await broadcast(session_id, {"type": "status", "status": "evaluating", "timestamp": datetime.utcnow().isoformat()})
        final_output = run_evaluator(api_key, task, language, results)

        eval_entry = {
            "agent": "evaluator",
            "timestamp": datetime.utcnow().isoformat(),
            "action": "synthesis",
            "tasks_completed": sum(1 for r in results if r["success"]),
            "tasks_failed": sum(1 for r in results if not r["success"]),
        }
        sessions[session_id]["tool_calls_log"].append(eval_entry)
        sessions[session_id]["final_output"] = final_output
        sessions[session_id]["status"] = "done"

        await broadcast(session_id, {"type": "tool_call", "data": eval_entry})
        await broadcast(session_id, {
            "type": "done",
            "final_output": final_output,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_subtasks": len(subtasks),
                "completed": sum(1 for r in results if r["success"]),
                "failed": sum(1 for r in results if not r["success"]),
            }
        })

    except Exception as e:
        logger.error(f"Agent pipeline failed: {e}")
        sessions[session_id]["status"] = "error"
        await broadcast(session_id, {"type": "error", "error": str(e), "timestamp": datetime.utcnow().isoformat()})

# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.post("/api/run")
async def run_task(request: RunTaskRequest):
    session_id = request.session_id or str(uuid.uuid4())
    api_key = request.groq_api_key or os.getenv("GROQ_API_KEY", "")

    if not api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY required")

    sessions[session_id] = {
        "session_id": session_id,
        "task": request.task,
        "language": request.language,
        "status": "planning",
        "subtasks": [],
        "tool_calls_log": [],
        "results": [],
        "final_output": None,
        "pending_approval": None,
        "api_key": api_key
    }

    asyncio.create_task(run_agent_pipeline(session_id, request.task, request.language, api_key))

    return {
        "session_id": session_id,
        "status": "started",
        "ws_url": f"ws://localhost:8000/ws/{session_id}"
    }

@app.get("/api/sessions")
async def list_sessions():
    return [
        {"session_id": sid, "task": s.get("task",""), "status": s.get("status",""), "tool_calls": len(s.get("tool_calls_log",[])), "language": s.get("language","en")}
        for sid, s in sessions.items()
    ]

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    s = sessions[session_id]
    return {
        "session_id": session_id,
        "task": s.get("task"),
        "language": s.get("language"),
        "status": s.get("status"),
        "subtasks": s.get("subtasks", []),
        "tool_calls_log": s.get("tool_calls_log", []),
        "results": s.get("results", []),
        "final_output": s.get("final_output"),
        "pending_approval": s.get("pending_approval"),
        "risk_summary": {
            "total": len(s.get("tool_calls_log",[])),
            "blocked": sum(1 for t in s.get("tool_calls_log",[]) if t.get("risk_level") == "high"),
            "medium": sum(1 for t in s.get("tool_calls_log",[]) if t.get("risk_level") == "medium"),
            "low": sum(1 for t in s.get("tool_calls_log",[]) if t.get("risk_level") == "low"),
        }
    }

@app.post("/api/approve")
async def approve_action(request: ApprovalRequest):
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    s = sessions[request.session_id]
    api_key = s.get("api_key", os.getenv("GROQ_API_KEY",""))

    if request.approved:
        pending = s.get("pending_approval", {})
        remaining_idx = pending.get("remaining_index", 0)
        s["pending_approval"] = None
        s["status"] = "executing"

        await broadcast(request.session_id, {"type": "approved", "message": "✓ Approved. Resuming.", "timestamp": datetime.utcnow().isoformat()})
        asyncio.create_task(run_agent_pipeline(request.session_id, s["task"], s["language"], api_key))
    else:
        s["pending_approval"] = None
        s["status"] = "cancelled"
        await broadcast(request.session_id, {"type": "denied", "message": f"✗ Denied: {request.reason or 'No reason'}", "timestamp": datetime.utcnow().isoformat()})

    return {"status": "ok", "approved": request.approved}

@app.get("/api/health")
async def health():
    return {"status": "ok", "sessions": len(sessions), "timestamp": datetime.utcnow().isoformat()}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    ws_connections[session_id].append(websocket)
    logger.info(f"[WS] Connected: {session_id}")

    if session_id in sessions:
        s = sessions[session_id]
        await websocket.send_text(json.dumps({
            "type": "history",
            "tool_calls_log": s.get("tool_calls_log", []),
            "status": s.get("status")
        }))

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        try: ws_connections[session_id].remove(websocket)
        except: pass
        logger.info(f"[WS] Disconnected: {session_id}")

if __name__ == "__main__":
    print("=" * 50)
    print("  AgentBridge Backend")
    print("  Running at http://localhost:8000")
    print("  Make sure GROQ_API_KEY is in .env")
    print("=" * 50)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
