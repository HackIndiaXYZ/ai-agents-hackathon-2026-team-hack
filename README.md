# 🤖 AgentBridge — Enterprise AI Agent Orchestration Platform

> **AI Agents Hackathon 2026 — HackIndia** | Team Hack | ID: HI012414  
> **Adaptive Data Track** | Built with Groq + LangGraph + Adaption

[![Live Demo](https://img.shields.io/badge/Live%20Demo-agentbridge.vercel.app-7c3aed?style=for-the-badge)](https://ai-agents-hackathon-2026-team-hack.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge)](https://agentbridge-backend-q0o8.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🎯 Problem Statement

**95% of enterprise AI agent pilots fail** — not because of weak AI models, but because:

- ❌ Agents can't integrate with existing company tools (Gmail, Slack, Jira, Drive)
- ❌ Zero visibility into what the agent is doing or why it failed
- ❌ No safety layer to prevent risky autonomous actions
- ❌ Works only in English — ignores India's 22+ official languages
- ❌ No feedback loop — system never improves from mistakes

**AgentBridge solves all five.**

---

## 💡 Solution

AgentBridge is a **multi-agent orchestration platform** that makes enterprise AI agents:
- **Observable** — real-time dashboard shows every decision
- **Safe** — guardrail layer blocks risky actions before execution
- **Connected** — integrates with any company tool via MCP protocol
- **Multilingual** — supports 6 Indian languages via Adaption
- **Self-improving** — feedback loop builds better datasets over time

---

## 🏗️ Architecture

```
User Task (any language)
         │
         ▼
┌─────────────────────────┐
│   🧠 Planner Agent      │  Breaks task into 2-4 subtasks
│   (LLaMA 3.3 70B)      │  with tool assignments
└──────────┬──────────────┘
           │
    ┌──────▼──────┐
    │  🛡️ Guardrail │  Risk classifier — blocks HIGH risk
    │   Layer      │  before any execution
    └──────┬──────┘
           │
┌──────────▼──────────────┐
│   ⚙️ Executor Agent     │  Calls MCP tools:
│                         │  Gmail · Drive · Slack · Jira
│                         │  Web Search · Code Execute
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│   ✅ Evaluator Agent    │  Quality check + final summary
│                         │  in user's language
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│  📊 Adaptive Data       │  Feedback loop → dataset improves
│  (Adaption Platform)    │  Push to HuggingFace + Kaggle
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│  🖥️ React Dashboard     │  Live observability via WebSocket
│  (AgentBridge UI)       │  Approve/deny blocked actions
└─────────────────────────┘
```

---

## ✨ Key Features

### 1. 🧠 Multi-Agent Orchestration
Three specialized agents work together via a state machine:
- **Planner** — breaks natural language tasks into concrete subtasks
- **Executor** — calls the right tool for each subtask with full logging
- **Evaluator** — synthesizes results and writes user-friendly summary

### 2. 🛡️ Compliance Guardrail Layer
Every action is classified BEFORE execution:
| Risk Level | Action |
|-----------|--------|
| 🟢 Low | Execute immediately |
| 🟡 Medium | Execute + audit log |
| 🔴 High | **BLOCK** — require human approval |

Examples blocked: mass emails (15+ recipients), destructive DB commands, high-stakes deletions

### 3. 📊 Real-Time Observability Dashboard
- Live WebSocket stream of every agent decision
- Expandable tool call cards with inputs, outputs, latency, risk score
- Human approval panel for blocked actions
- Session history with timeline + risk donut chart
- Export session as JSON

### 4. 🌍 Multilingual Support (Adaptive Data Track)
Powered by **Adaption's Adaptive Data platform** (242 languages):
- English, Hindi (हिन्दी), Marathi (मराठी), Gujarati (ગુજરાતી), Tamil (தமிழ்), Telugu (తెలుగు)
- Agent responds in the same language as the task
- Every human correction becomes a training example

### 5. 🔄 Continuous Learning Loop
- Real usage → feedback collected → pushed to Adaption platform
- Dataset published on HuggingFace for open research
- Risk classifier improves from human corrections over time

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | LLaMA 3.3 70B via **Groq** (free tier) |
| Agent Framework | **LangGraph** state machine |
| Tool Protocol | **MCP** (Model Context Protocol) |
| Backend | **FastAPI** + WebSockets |
| Frontend | **React** + Tailwind + shadcn/ui + Framer Motion |
| Dataset Platform | **Adaption Adaptive Data** |
| Dataset Hosting | HuggingFace Hub + Kaggle |
| Backend Deploy | **Render** |
| Frontend Deploy | **Vercel** |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
python main.py
# Runs at http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/run` | POST | Start agent task |
| `/api/sessions` | GET | List all sessions |
| `/api/session/{id}` | GET | Full session log |
| `/api/approve` | POST | Approve/deny blocked action |
| `/api/health` | GET | Health check |
| `/ws/{session_id}` | WS | Live event stream |

---

## 🎬 Demo

### Test Inputs

**Basic search:**
```
Search for top 3 AI agent frameworks in 2026
```

**Multi-tool pipeline:**
```
Read latest email from manager, summarize it and create a Jira ticket
```

**Guardrail trigger (most impressive!):**
```
Send email with subject cancel subscription to delete files to 15 team members
```
→ Shows red blocked panel with human Approve/Deny

**Multilingual (set language to Hindi):**
```
AI एजेंट के बारे में जानकारी खोजें और टीम को Slack पर बताएं
```

---

## 📦 Adaptive Data Track Submission

This project integrates **Adaption's Adaptive Data platform** for:

✅ Multilingual task support (6 Indian languages)  
✅ Continuous feedback loop from human corrections  
✅ Dataset published on HuggingFace  
✅ Credits Adaption in all documentation  
✅ 500 Adaption credits actively used  

**Dataset:** [HuggingFace — AgentBridge Enterprise Workflows](https://huggingface.co/datasets/SimranShaikh20/agentbridge-enterprise-workflows)

---

## 🌐 Live Links

| | URL |
|-|-----|
| 🖥️ Frontend | https://ai-agents-hackathon-2026-team-hack.vercel.app |
| ⚙️ Backend API | https://agentbridge-backend-q0o8.onrender.com |
| 📚 API Docs | https://agentbridge-backend-q0o8.onrender.com/docs |
| 💾 Dataset | https://huggingface.co/datasets/SimranShaikh20/agentbridge-enterprise-workflows |
| 🐙 GitHub | https://github.com/SimranShaikh20/ai-agents-hackathon-2026-team-hack |

---

## 👩‍💻 Team

**Simran Shaikh** — AI/ML Engineer  
- 🎓 B.E. Computer Science, MSU Baroda (University Rank 1, CGPA 8.16)
- 💼 ML Intern @ Atlas Copco (Industrial Defect Detection)
- 🏆 Global Agent Hackathon — 1st Place
- 📊 GSSoC Top 5% Global Contributor (50+ PRs)
- 🐙 GitHub: [@SimranShaikh20](https://github.com/SimranShaikh20)
- 📧 shaikhsimran20.2003@gmail.com

---

## 🏆 Why AgentBridge Wins

| Criterion | How AgentBridge Delivers |
|-----------|--------------------------|
| Innovation | First platform combining observability + guardrails + multilingual for enterprise agents |
| Technical Quality | LangGraph state machine + WebSocket streaming + risk classifier |
| Real-world Impact | Solves the #1 reason enterprise AI fails — integration + safety |
| AI Agent Capabilities | 3 specialized agents + 8 tool integrations + MCP protocol |
| Scalability | Stateless FastAPI backend, Redis-ready, cloud-deployed |
| Presentation | Live dark-theme dashboard with real-time streaming |

---

## 📄 License

MIT License — free for research and commercial use.

---

*Built with ❤️ for AI Agents Hackathon 2026 — HackIndia*  
*Powered by Groq · Adaption · LangGraph · Anthropic MCP*