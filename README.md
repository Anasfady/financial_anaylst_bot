# FinTech Triage Ops (Financial Analyst Bot)

An AI-powered incident management prototype designed to automatically classify, assess operational urgency, summarize, and route unstructured financial customer claims. The system features a dual-pipeline architecture allowing for high-speed cloud inference via Groq's LPU network or privacy-first local inference using Ollama.

## ✨ Features

* **Intelligent Routing:** Automatically categorizes claims (e.g., Fraud, Payment Failure, Compliance) and routes them to the appropriate department (e.g., Fraud Ops, Payments IT).
* **Dual AI Pipelines:**
  * **External Cloud:** Ultra-low latency inference using Groq (`openai/gpt-oss-120b`).
  * **Local Edge:** On-device privacy-focused inference using Ollama (`tinyllama`).
* **Side-by-Side Comparison:** Run the same incident claim through both cloud and local models simultaneously to compare latency, tokens, cost, and routing logic.
* **Resilient Output Parsing:** Built-in Pydantic pre-validators sanitize hallucinated or malformed LLM JSON outputs into strict schema categories, ensuring 100% backend uptime.
* **Execution Metrics:** Live tracking of inference latency, token usage (input/output), and dynamic fractional-cent cost calculation.
* **Human-in-the-Loop:** Frontend UI requires human review and approval before finalizing the AI's triage recommendation.

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI, Uvicorn, Pydantic (V2)
* **Frontend:** React, Tailwind CSS, Lucide React Icons
* **AI & Integration:** Groq Python SDK, HTTPX, Ollama

## ⚙️ Prerequisites

* Python 3.10+
* Node.js 18+ (for frontend)
* [Ollama](https://ollama.com/) installed locally for offline inference
* A [Groq API Key](https://console.groq.com/keys)

## 🚀 Installation & Setup

### 1. Local AI Model Setup (Ollama)
Ensure the Ollama daemon is running in the background, then pull the required model:
```bash
ollama pull tinyllama
