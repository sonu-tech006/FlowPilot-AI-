# ⚡ FlowPilot AI — Autonomous Workflow Observability & Self-Healing Reliability Engine

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live%20Production-success?style=for-the-badge&logo=statuspage&logoColor=white" alt="Status" />
  <img src="https://img.shields.io/badge/Live%20Platform-flowpilot--ai--006.ai.studio-blue?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo" />
  <img src="https://img.shields.io/badge/AI%20Engine-Google%20Gemini%20API-8E75C4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <b>🌐 Live Application:</b> <a href="https://flowpilot-ai-006.ai.studio" target="_blank"><b>https://flowpilot-ai-006.ai.studio</b></a>
</p>

---

## 🖥️ Platform Preview & Overview

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  ⚡ FlowPilot AI  /  prod-core-v2  •  [● LIVE] App: Linear API Service (linear.app)  •  [● MongoDB Atlas]   ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                              ║
║  🌐 DEPLOYED URL DIAGNOSTICS: https://linear.app                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │ Status: 200 OK  │  Latency: 142ms  │  DNS: 18ms  │  TCP: 32ms  │  TTFB: 78ms  │  Download: 14ms        │  ║
║  └────────────────────────────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                                              ║
║  DAG WORKFLOW EXECUTION GRAPH: Core Request Pipeline                                                        ║
║  [ Ingress DNS ] ──▶ [ Auth & WAF ] ──▶ [ HTTP Endpoint Execution ] ──▶ [ Cache Invalidation ] ──▶ [ Telemetry ] ║
║                                                 │                                                            ║
║                                           ❌ [HTTP 504 TIMEOUT]                                              ║
║                                                 │                                                            ║
║  🤖 GEMINI ROOT-CAUSE TRIAGE                    ▼                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │ Root Cause: Upstream Gateway Socket Dropped (Socket hang-up after 5000ms)                              │  ║
║  │ Risk Assessment: LOW (Target endpoint idempotent via X-Idempotency-Key)                                │  ║
║  │ Proposed Action: RESUME_STEP with Preflight Dry-Run Verification                                        │  ║
║  └────────────────────────────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                                              ║
║  🛡️ OPERATOR GATED RECOVERY: [ Run Idempotent Dry-Run ] ──▶ [ Authorize & Resume ] ──▶ 🟢 100% SUCCESS       ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🛠️ Tech Stack & Technologies Used

<div align="center">

| Layer | Technologies & Badges | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | ![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite%208-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) | Real-time reactive dashboard, DAG flow canvas, dark/white theme switcher |
| **DAG Canvas & Charts** | ![React Flow](https://img.shields.io/badge/React%20Flow%20(xyflow)-FF0072?style=for-the-badge&logo=react&logoColor=white) ![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=for-the-badge&logo=d3dotjs&logoColor=white) ![Lucide](https://img.shields.io/badge/Lucide%20Icons-F56565?style=for-the-badge) | Interactive workflow DAG editor, telemetry charts & latency waterfalls |
| **Backend & Engine** | ![Node.js](https://img.shields.io/badge/Node.js%2022-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![tsx](https://img.shields.io/badge/TSX%20Runtime-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | Full-stack server, topological DAG execution engine, circuit breakers |
| **Database & Cache** | ![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white) | Cloud persistent multi-tenant collections, replica set synchronization, queue buffers |
| **AI Intelligence** | ![Google Gemini](https://img.shields.io/badge/Google%20Gemini%20API-8E75C4?style=for-the-badge&logo=googlegemini&logoColor=white) ![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white) | Generative SRE root-cause analysis, TF-IDF NLP log classification, risk scoring |
| **Security & Auth** | ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) ![bcrypt](https://img.shields.io/badge/bcryptjs-4A154B?style=for-the-badge) | Multi-tenant tenant isolation, cryptographic password hashing, role-based access control |

</div>

---

## 📊 Complete Project Flow & Architecture Diagram

```mermaid
graph TD
    %% Styling
    classDef client fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef server fill:#1e293b,stroke:#334155,stroke-width:2px,color:#fff;
    classDef engine fill:#4338ca,stroke:#3730a3,stroke-width:2px,color:#fff;
    classDef ai fill:#7e22ce,stroke:#6b21a8,stroke-width:2px,color:#fff;
    classDef db fill:#047857,stroke:#065f46,stroke-width:2px,color:#fff;
    classDef recovery fill:#b45309,stroke:#92400e,stroke-width:2px,color:#fff;

    subgraph ClientLayer ["1. Presentation & Observability Layer"]
        UI["FlowPilot Web Console (React 19 + Vite)"]:::client
        URLSearch["Deployed URL Diagnostic Search Bar"]:::client
        DAGView["Interactive DAG Workflow Canvas (xyflow)"]:::client
        ThemeEngine["Theme Switcher (Midnight Black / Clean White)"]:::client
    end

    subgraph ServerLayer ["2. API Gateway & Microservices"]
        Express["Express Full-Stack Server (/api)"]:::server
        AuthMiddleware["JWT Multi-Tenant Workspace Authenticator"]:::server
        URLProbe["Live HTTP Latency Probe & Waterfall Analyzer"]:::server
    end

    subgraph CoreEngine ["3. Workflow & Incident Engine"]
        DAGRuntime["Topological DAG Execution Engine"]:::engine
        CircuitBreaker["Circuit Breaker Registry (Closed/Open/Half-Open)"]:::engine
        FailureDetector["Step Failure & Anomaly Interceptor"]:::engine
    end

    subgraph IntelligenceLayer ["4. AI & ML Incident Investigation"]
        MLClassifier["NLP Log Classifier (TF-IDF + Calibrated Logistic Regression)"]:::ai
        GeminiSRE["Google Gemini 3.8 Flash SRE Reasoning Engine"]:::ai
    end

    subgraph SelfHealing ["5. Intelligent Self-Healing & Recovery"]
        DryRun["Preflight Idempotency & Mutation Dry-Run Validator"]:::recovery
        ApprovalGate["Human-in-the-Loop Operator Authorization Gate"]:::recovery
        StepResume["Stateful Step Resumption & Rollback Engine"]:::recovery
    end

    subgraph StorageLayer ["6. Authoritative Persistence"]
        MongoDB[("MongoDB Atlas Cloud Cluster (Cluster0)")]:::db
        LocalBackup[("Local Document DB Fallback (.flowpilot-data)")]:::db
    end

    %% Connections
    UI -->|HTTP / JSON| Express
    URLSearch -->|Inspect URL| URLProbe
    URLProbe -->|Latency Breakdown| UI
    Express --> AuthMiddleware
    AuthMiddleware --> DAGRuntime
    DAGRuntime --> CircuitBreaker
    DAGRuntime --> FailureDetector
    FailureDetector -->|Error Logs| MLClassifier
    FailureDetector -->|Context & Diagnostics| GeminiSRE
    GeminiSRE -->|Root Cause & Action Plan| UI
    UI -->|Request Recovery| DryRun
    DryRun -->|Validation OK| ApprovalGate
    ApprovalGate -->|Authorize| StepResume
    StepResume -->|Re-execute Node| DAGRuntime
    DAGRuntime --> MongoDB
    MongoDB -.->|Automatic Fallback| LocalBackup
```

---

## ✨ Key Features & Capabilities

### 1. 🌐 Real-Time Deployed URL Diagnostic Engine
* Input **any deployed website or microservice URL** (e.g., `https://my-app.com` or `https://linear.app`).
* Live latency waterfall breakdown across network hops:
  * **DNS Lookup** Latency
  * **TCP Connection Handshake** Time
  * **Time to First Byte (TTFB)**
  * **Content Download** Duration
* Automatically provisions dedicated workflows based on the target URL (purging dummy demo references).

### 2. ⚡ DAG Workflow Execution Engine
* Dependency-aware topological execution across asynchronous microservice steps.
* Per-step retry policies with exponential backoff and randomized jitter.
* Idempotency verification keys preventing double charges or duplicate database mutations.
* Interactive failure injection simulator (Network Timeouts, HTTP 429, HTTP 500, Database pool starvation).

### 3. 🤖 AI-Powered Incident Investigation (Google Gemini API)
* Uses **`gemini-3.8-flash`** via the modern `@google/genai` TypeScript SDK.
* Contextual root-cause analysis separating **verified observable evidence** from hypotheses.
* Analyzes execution stack traces, HTTP payloads, and environmental telemetry.
* Proposes safe, verified recovery plans with concrete remediation prerequisites.

### 4. 🛡️ Safety-Gated Self-Healing & Preflight Dry-Runs
* **Preflight Dry-Run Simulation:** Tests whether repeating a step will cause double-billing or orphaned records.
* **Human-in-the-Loop Approval:** Operators review proposed fixes with mandatory reason logging before mutations occur.
* **Step-Level Resumption:** Resumes pipelines directly from the failed node without restarting successful antecedent steps.

### 5. 🔌 Circuit Breakers & Dependency Mapping
* Real-time state machine tracking upstream dependencies (`CLOSED`, `OPEN`, `HALF_OPEN`).
* Error-budget burn rate, MTTR (Mean Time to Recovery), and MTTD (Mean Time to Detection) tracking.
* SLA policy compliance monitoring.

### 6. 🔒 Multi-Tenant User Isolation
* Dedicated workspaces (`ws-usr-<id>`) created upon registration.
* Strict tenant boundaries: User A only sees their own applications, workflows, and incident history.
* Zero data leakage across registered accounts.

### 7. 🌓 Dual Theme Architecture (Black & White Canvas)
* **Midnight Black Mode:** Obsidian `#070b13` canvas engineered for 24/7 NOC monitoring centers.
* **Clean White Mode:** Crisp `#f8fafc` canvas for executive reports and daytime presentations.
* 1-click toggle accessible from the top navigation and settings.

---

## 🚀 Getting Started Locally

### Prerequisites
* **Node.js**: v20 or higher
* **npm**: v10 or higher
* **MongoDB Atlas URI** (or use built-in local document storage)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sonu-tech006/FlowPilot-AI-.git
cd FlowPilot-AI-

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
```

### Environment Configuration (`.env`)

```env
# Server & App
PORT=3000
NODE_ENV=development

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.5epwjns.mongodb.net/flowpilot?retryWrites=true&w=majority
MONGODB_DB_NAME=flowpilot

# Security
JWT_SECRET=flowpilot-super-secure-jwt-secret-key-32chars

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment Guide (Render.com)

FlowPilot AI is pre-configured for full-stack Node.js deployment on Render:

1. Create a **New Web Service** on [Render](https://render.com).
2. Connect your GitHub repository: `sonu-tech006/FlowPilot-AI-`.
3. Configure the build parameters:
   * **Environment**: `Node`
   * **Build Command**: `npm install --legacy-peer-deps && npm run build`
   * **Start Command**: `npx tsx server.ts`
4. Add the **Environment Variables** in Render's Environment tab:
   ```env
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb://sonukr7435_db_user:akTlbvDErfxvY7Fp@ac-kwurxiq-shard-00-00.5epwjns.mongodb.net:27017,ac-kwurxiq-shard-00-01.5epwjns.mongodb.net:27017,ac-kwurxiq-shard-00-02.5epwjns.mongodb.net:27017/flowpilot?ssl=true&replicaSet=atlas-11g7da-shard-0&authSource=admin
   MONGODB_DB_NAME=flowpilot
   JWT_SECRET=flowpilot-super-secure-jwt-secret-key-32chars
   GEMINI_MODEL=gemini-3.8-flash
   ```
5. Click **Deploy Web Service**.

---

## 📄 License

This project is open-source and licensed under the **[MIT License](LICENSE)**.

```
MIT License

Copyright (c) 2026 Sonu Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Author & Contact Information

<div align="center">

### **Sonu Kumar**
*Full-Stack Engineer & AI Systems Developer*

[![Portfolio](https://img.shields.io/badge/Portfolio-animated--portfolio--pro.vercel.app-black?style=for-the-badge&logo=vercel&logoColor=white)](https://animated-portfolio-pro.vercel.app/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sonu_Kumar-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sonu-kumar-3234bb344/)
[![Email](https://img.shields.io/badge/Email-sonukr7435%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:sonukr7435@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-sonu--tech006-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sonu-tech006)

---

⭐ **Star this repository if you find FlowPilot AI useful for your microservices and workflows!**

</div>
