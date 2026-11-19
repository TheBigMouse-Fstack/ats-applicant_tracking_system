---
id: "DIAG-07-ARCH"
title: "ATS Cloud & System Architecture Topology Diagram"
type: "architecture-diagram"
version: "2.1.0"
status: "approved"
owner: "ATS Enterprise Business Analysis & Architecture Team"
format: "Mermaid Flowchart Architecture + Multi-Tier Specification"
tools:
  - "Mermaid Live Editor (https://mermaid.live)"
  - "Mermaid CLI (@mermaid-js/mermaid-cli)"
last_updated: "2026-11-19"
language: "en-US"
---

# DIAGRAM 07: CLOUD & FULLSTACK SYSTEM ARCHITECTURE TOPOLOGY

> **Domain:** Cloud Infrastructure, Micro-Services Topology & Automation Ecosystem  
> **Source Mermaid Script:** [`docs/diagrams/07_cloud_architecture.mmd`](file:///d:/ATS%20project/docs/diagrams/07_cloud_architecture.mmd)  
> **Specification Standard:** Multi-Tier Distributed Cloud Architecture  
> **Documentation Standard:** Universal BA Toolkit (English Only Execution Standard).

---

## 1. Quick Export Guide (Vector SVG & Infrastructure Topology)

The companion file [`07_cloud_architecture.mmd`](file:///d:/ATS%20project/docs/diagrams/07_cloud_architecture.mmd) illustrates the multi-tier physical and logical layout of the ATS system across edge delivery, application compute, persistence, AI inference, and background webhooks.

### Option A: Render & Export via Mermaid Live Editor (Browser)
1. Open **[https://mermaid.live](https://mermaid.live)**.
2. Copy the code block from [`07_cloud_architecture.mmd`](file:///d:/ATS%20project/docs/diagrams/07_cloud_architecture.mmd) and paste it into the editor.
3. The 6 architectural tiers with visual boundary boxes and directional dataflows will render instantly.
4. Export as **SVG** or **PNG (3x)**.

### Option B: Local CLI Export via Mermaid CLI (`mmdc`)
```powershell
mmdc -i docs/diagrams/07_cloud_architecture.mmd -o docs/diagrams/07_cloud_architecture.svg
```

---

## 2. Visual Architecture Diagram (Embedded Mermaid)

```mermaid
flowchart TD
    %% =========================================================================
    %% ATS — CLOUD & SYSTEM ARCHITECTURE DIAGRAM
    %% Multi-tier Fullstack Architecture: Edge, Next.js, AI, Neon DB & Automation
    %% =========================================================================

    %% CLIENT LAYER
    subgraph TIER_CLIENT ["1. Client & Presentation Layer (Edge Browser)"]
        direction LR
        UI_Public["🌐 Public Careers Portal<br>(/jobs, /jobs/tracker)<br>Responsive Mobile & Desktop"]
        UI_Admin["🖥️ Recruitment Workspace Console<br>(/dashboard, /talent-pool, /jobs/manage)<br>5-Stage Kanban (@hello-pangea/dnd)"]
    end

    %% NETWORK & EDGE SECURITY
    subgraph TIER_EDGE ["2. Edge Routing & Ingress Security"]
        CDN["🛡️ Vercel Edge Network / Cloudflare CDN<br>TLS 1.3 Termination & DDoS Mitigation"]
        WAF["⚙️ Ingress Security Middleware<br>Magic Byte Validation (%PDF, PK)<br>Application Rate Limiting (3/90d)"]
    end

    %% CORE APPLICATION SERVER
    subgraph TIER_APP ["3. Application Server (Next.js 14+ App Router)"]
        direction TB
        subgraph APP_PAGES ["Server & Client UI Components"]
            Comp_Kanban["Kanban Board Component"]
            Comp_Drawer["Candidate Detail Drawer"]
            Comp_Scorecard["Scorecard Modal"]
        end

        subgraph APP_API ["RESTful API Endpoints (/api/*)"]
            API_App["/api/applications<br>(CV Intake & Upload)"]
            API_Pipe["/api/pipeline/move<br>(Kanban Stage & Guards)"]
            API_Int["/api/interviews/schedule<br>(Calendar & Format)"]
            API_Eval["/api/evaluations<br>(Scorecard Submission)"]
            API_Job["/api/jobs<br>(Requisition Headcount)"]
        end

        subgraph APP_CORE ["Core Services & Business Logic"]
            Auth_RBAC["RBAC Session Guard<br>(ADMIN, HR, HIRING_MANAGER)"]
            Rule_Engine["Business Rules Engine<br>(BRL-01 to BRL-13 Enforcement)"]
            N8N_Dispatcher["n8n Webhook Dispatcher<br>(src/lib/n8n.ts - 7s Resilient Timeout)"]
        end
    end

    %% DATA & STORAGE LAYER
    subgraph TIER_DATA ["4. Database & Storage Layer"]
        direction LR
        subgraph DB_POSTGRES ["Neon Serverless PostgreSQL (Cloud Lakebase)"]
            ORM["Prisma ORM (Client Singleton)"]
            PgBouncer["PgBouncer Connection Pooler<br>(Port 6543 / 5432)"]
            Tables[("Normalized Tables (3NF):<br>users, jobs, candidates,<br>applications, evaluations, audit_logs")]
        end
        FS_Storage[("📁 Document Storage<br>Uploaded CV Files (PDF/DOCX)<br>SHA-256 Hash Verification")]
    end

    %% HYBRID AI ENGINE
    subgraph TIER_AI ["5. Hybrid AI Intelligence Engine"]
        direction TB
        AI_L1["Layer 1: Local Heuristic Parser<br>pdf-parse & mammoth Stream<br>Fast Text Extraction (< 500ms)"]
        AI_L2["Layer 2: Google Gemini Generative AI<br>@google/genai (temperature: 0)<br>5-Core-Field Extraction & 3-Tier Match Score"]
    end

    %% AUTOMATION & EXTERNAL SERVICES
    subgraph TIER_AUTO ["6. External Automation & Integration Layer (n8n Webhook Infrastructure)"]
        direction TB
        N8N_Node["⚡ n8n Workflow Automation Server<br>(Configured via .env Webhook URLs)"]
        WF1["Workflow 1: Interview Calendar Sync<br>(Google Calendar API + Gmail Invite)"]
        WF2["Workflow 2: HR Telegram Instant Alerts<br>(Telegram Bot API @Rec_Hr_rBot)"]
        WF3["Workflow 3: 12-Hour Delayed Rejection<br>(Wait Node Buffer + Brand Polite Email)"]
    end

    %% RELATIONSHIPS & DATAFLOW
    UI_Public --> CDN
    UI_Admin --> CDN
    CDN --> WAF
    WAF --> APP_PAGES
    APP_PAGES --> APP_API

    APP_API --> Auth_RBAC
    Auth_RBAC --> Rule_Engine
    Rule_Engine --> API_App
    Rule_Engine --> API_Pipe

    API_App --> FS_Storage
    API_App --> AI_L1
    AI_L1 --> AI_L2
    AI_L2 --> API_App

    API_App --> ORM
    API_Pipe --> ORM
    API_Int --> ORM
    API_Eval --> ORM
    API_Job --> ORM

    ORM --> PgBouncer
    PgBouncer --> Tables

    Rule_Engine --> N8N_Dispatcher
    API_Int --> N8N_Dispatcher

    N8N_Dispatcher -. "HTTP POST" .-> N8N_Node
    N8N_Node --> WF1
    N8N_Node --> WF2
    N8N_Node --> WF3

    %% CLASS STYLES
    classDef clientStyle fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef edgeStyle fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef appStyle fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;
    classDef dataStyle fill:#fdf4ff,stroke:#d946ef,stroke-width:2px,color:#701a75;
    classDef aiStyle fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12;
    classDef autoStyle fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#581c87;

    class UI_Public,UI_Admin clientStyle;
    class CDN,WAF edgeStyle;
    class Comp_Kanban,Comp_Drawer,Comp_Scorecard,API_App,API_Pipe,API_Int,API_Eval,API_Job,Auth_RBAC,Rule_Engine,N8N_Dispatcher appStyle;
    class ORM,PgBouncer,Tables,FS_Storage dataStyle;
    class AI_L1,AI_L2 aiStyle;
    class N8N_Node,WF1,WF2,WF3 autoStyle;
```

---

## 3. Multi-Tier Architecture Specifications

| Architectural Tier | Primary Technology | Hosting & Runtime | Responsibilities & Boundaries |
| :--- | :--- | :--- | :--- |
| **Tier 1: Client & Presentation** | Next.js 14, React 18, Tailwind CSS, `@hello-pangea/dnd` | Modern Web Browsers | Renders responsive careers portal (`/jobs`) and recruiter workspace (`/dashboard`) with visual calm 60-30-10 palette. |
| **Tier 2: Edge Routing & Security** | Vercel Edge Middleware | Vercel Global Edge Network | Enforces TLS 1.3 termination, DDOS mitigation, IP rate-limiting, and resume file magic byte inspection (`%PDF`, `PK`). |
| **Tier 3: Application Server** | Next.js App Router (Node.js runtime) | Vercel Serverless Functions | Hosts business logic, RBAC session authorization, RESTful API endpoints (`/api/*`), and resilience dispatchers. |
| **Tier 4: Database & Storage** | Neon Serverless PostgreSQL + Prisma ORM | AWS us-east-1 (Neon Lakebase) | Persists normalized 3NF relational data; handles connection pooling via PgBouncer with high-concurrency scaling. |
| **Tier 5: Hybrid AI Engine** | Local NLP stream + Google Gemini API (`@google/genai`) | Serverless Node.js Worker | Ingests PDF/DOCX resumes, extracts 5 core fields, computes 0–100% semantic score against JD, and provides explanation badges. |
| **Tier 6: Automation & Webhooks** | n8n Workflow Automation Platform | Self-hosted Docker / Cloud Node | Dispatches interview invitations with Google Calendar sync, delivers instant HR Telegram notifications, and manages the 12h rejection buffer. |

---

## 4. Security, High Availability & Resilience Policies

### 1. Ingress File Security & Magic Byte Guard
- To prevent executable injection or MIME spoofing, incoming resume uploads undergo a 2-stage verification:
  1. **Magic Byte Verification:** Inspects binary buffer headers (`0x25 0x50 0x44 0x46` for PDF, `0x50 0x4B 0x03 0x04` for DOCX).
  2. **SHA-256 Fingerprint:** Hashes file bytes to detect duplicate file submissions instantly without re-invoking AI inference.

### 2. Resilient Automation Integration (Timeout & Circuit Protection)
- Outbound requests to the external n8n automation layer (`src/lib/n8n.ts`) are bounded by a **7-second timeout**.
- If the n8n container is down or unresponsive, the API returns a graceful operational warning rather than causing 500 crashes or rollbacks of core candidate records.

### 3. Database Connection Pooling & Zero-Scale
- Configured with `DATABASE_URL` pointing to Neon's pooled endpoint (`-pooler.c-2.postgres.neon.tech:6543`), optimizing connection reuse across serverless function instances.
- Zero-scale capability minimizes cloud costs during idle off-hours while maintaining sub-second cold starts.
