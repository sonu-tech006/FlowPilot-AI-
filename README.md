# FlowPilot AI — Autonomous Workflow Monitoring & Intelligent Recovery Platform

FlowPilot AI is an enterprise-grade autonomous workflow observability, failure investigation, intelligent recovery, and reliability analytics platform. It monitors business-critical workflows, detects execution faults, classifies errors via scikit-learn models, investigates root causes using Google Gemini, evaluates risk/idempotency, and guides authorized operators through safe, verified recovery.

---

## 1. System Architecture

```
                    ┌──────────────────────────────────────────┐
                    │           FlowPilot Web Dashboard        │
                    │   (React 19 + TypeScript + React Flow)   │
                    └─────────────────────┬────────────────────┘
                                          │ REST API & WebSockets
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │        Node.js Express Full-Stack        │
                    │       (API Routes + Workflow Engine)     │
                    └──────┬──────────────┬──────────────┬─────┘
                           │              │              │
             ┌─────────────┴──┐    ┌──────┴───────┐   ┌──┴─────────────┐
             ▼                ▼    ▼              ▼   ▼                ▼
     ┌──────────────┐  ┌──────────────┐    ┌──────────────┐     ┌──────────────┐
     │ MongoDB Store│  │ Redis / Bull │    │Python FastAPI│     │Google Gemini │
     │  (Mongoose   │  │ Idempotent   │    │  ML Service  │     │  Flash SRE   │
     │ Collections) │  │ Queue Engine │    │(scikit-learn)│     │Investigation │
     └──────────────┘  └──────────────┘    └──────────────┘     └──────────────┘
```

---

## 2. Key Capabilities

1. **DAG Workflow Execution Engine**:
   - Dependency-aware topological execution across asynchronous nodes.
   - Idempotency key tracking preventing duplicate charges and mutations.
   - Step-level timeouts, retry limits, and exponential backoff with jitter.
   - Safe step resumption from points of failure.
   - Deterministic failure injection simulator (Network Timeout, HTTP 429, HTTP 500, DB pool, Auth).

2. **Machine Learning Service**:
   - Multi-class NLP classifier using TF-IDF term vectors + Calibrated Logistic Regression across 8 failure categories:
     `Network timeout`, `Rate limit`, `Authentication failure`, `Database connection failure`, `Validation error`, `Server error`, `Dependency unavailable`, `Unknown failure`.
   - Evaluated on held-out test splits with exact Precision, Recall, F1, and an 8×8 Confusion Matrix.
   - Isolation Forest multi-variate anomaly detector.
   - Proactive failure risk score predictor.

3. **Gemini Root-Cause Investigation**:
   - Powered by `@google/genai` using model `gemini-3.8-flash`.
   - Distinguishes observable evidence from hypotheses.
   - Structured JSON response: root cause, impact assessment, risk level, recovery action, prerequisites.
   - Automatic fallback to deterministic SRE rule engine when offline or without API key.

4. **Safety-Gated Recovery Planner**:
   - Proposed recovery actions: `RESUME_STEP`, `RETRY_TRANSIENT`, `RETRY_WITH_DELAY`, `RECHECK_DEPENDENCY`, `REFRESH_CONFIG`, `SKIP_OPTIONAL_STEP`, `ESCALATE_HUMAN`.
   - Dry-Run pre-flight verification before state mutation.
   - Strict Operator/Admin approval gate with reason logging.
   - Verifies outcome post-execution before marking incidents resolved.

5. **Circuit Breakers & SLA Management**:
   - Dependency registry (Stripe Payment Gateway, SAP ERP Inventory, Billing API, SendGrid, Snowflake).
   - CLOSED, OPEN, HALF_OPEN states with probe recovery.
   - Error-budget burn rate, MTTR, MTTD, and P95 latency tracking.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, `@xyflow/react` (React Flow), Recharts, Lucide Icons.
- **Backend API**: Node.js, Express, TypeScript, Mongoose document store, JWT authentication, bcryptjs, Zod.
- **AI & ML**: Google Gemini API (`@google/genai`), Python 3.10, FastAPI, scikit-learn, pandas, numpy, joblib.
- **Storage & Infrastructure**: MongoDB Mongoose persistence, Redis background queues, Docker Compose.

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js >= 20
- (Optional for external deployment) Docker & Docker Compose

### Running the App
```bash
# 1. Install dependencies
npm install

# 2. Start the unified development server (Port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 5. End-to-End Demo Scenario

FlowPilot includes a guided 10-step interactive walkthrough:
1. **Operator Sign In**: Active session as Operator Sarah Chen.
2. **Order Processing Pipeline**: 5-step DAG (Validate Order → Check Inventory → Process Payment → Generate Invoice → Send Notification).
3. **Inject Failure**: Click "Simulate Incident" to inject an upstream HTTP 504 network timeout on Stripe payment.
4. **Inspect Telemetry**: View execution step failure, stack trace, and socket timeout logs.
5. **ML Classification**: Inspect TF-IDF feature breakdown and 94% confidence Network Timeout prediction.
6. **Circuit Breaker Check**: View Stripe dependency state tripped to HALF_OPEN.
7. **Gemini Investigation**: Inspect root-cause analysis, observed evidence, and recommended `RESUME_STEP`.
8. **Preflight Dry-Run**: Run simulation verifying idempotency key and ledger status.
9. **Operator Approval**: Authorize resumption with signed reason.
10. **Safe Resumption**: Re-execute step 3 directly; verify invoice generation, email dispatch, and audit log.

---

## 6. Docker Multi-Container Deployment

Run all microservices using Docker Compose:

```bash
docker-compose up --build
```
This launches:
- `flowpilot-web-api` (Port 3000)
- `ml-service` (FastAPI on Port 8000)
- `mongo` (MongoDB on Port 27017)
- `redis` (Redis on Port 6379)
