---
id: "DIAG-08-N8N"
title: "ATS Event-Driven Automation & n8n Workflow Topology"
type: "automation-workflow-diagram"
version: "2.1.0"
status: "approved"
owner: "ATS Enterprise Business Analysis & Architecture Team"
format: "Mermaid Flowchart Topology + Webhook Integration Specification"
tools:
  - "Mermaid Live Editor (https://mermaid.live)"
  - "Mermaid CLI (@mermaid-js/mermaid-cli)"
  - "n8n Workflow Automation Canvas (http://localhost:5678)"
last_updated: "2026-11-20"
language: "en-US"
---

# DIAGRAM 08: ATS EVENT-DRIVEN AUTOMATION & N8N WORKFLOW TOPOLOGY

> **Domain:** External Workflow Automation, Event-Driven Webhooks & Third-Party Synchronization  
> **Source Mermaid Script:** [`docs/diagrams/08_automation_workflow_n8n.mmd`](file:///d:/ATS%20project/docs/diagrams/08_automation_workflow_n8n.mmd)  
> **Specification Standard:** Multi-Tier Event-Driven Micro-Workflow Topology  
> **Documentation Standard:** Universal BA Toolkit (English Only Execution Standard).

---

## 1. Quick Export Guide (Vector SVG & Infrastructure Topology)

The companion file [`08_automation_workflow_n8n.mmd`](file:///d:/ATS%20project/docs/diagrams/08_automation_workflow_n8n.mmd) illustrates the end-to-end decoupled webhook architecture between the ATS Next.js core, the ingress Cloudflare tunnel, the local n8n automation engine, and third-party APIs (Google Calendar, Gmail, Telegram Bot).

### Option A: Render & Export via Mermaid Live Editor (Browser)
1. Open **[https://mermaid.live](https://mermaid.live)**.
2. Copy the code block from [`08_automation_workflow_n8n.mmd`](file:///d:/ATS%20project/docs/diagrams/08_automation_workflow_n8n.mmd) and paste it into the editor.
3. The 5 architectural tiers (Client UI, Dispatcher, Tunnel, n8n Workflows, External APIs) with color-coded nodes will render instantly.
4. Export as **SVG** (recommended for Word/PDF embedding) or **PNG (3x)**.

### Option B: Local CLI Export via Mermaid CLI (`mmdc`)
```powershell
npx @mermaid-js/mermaid-cli -i docs/diagrams/08_automation_workflow_n8n.mmd -o docs/diagrams/08_automation_workflow_n8n.svg
npx @mermaid-js/mermaid-cli -i docs/diagrams/08_automation_workflow_n8n.mmd -o docs/diagrams/08_automation_workflow_n8n.png -s 3
```

---

## 2. Visual Architecture Diagram (Embedded Mermaid)

```mermaid
flowchart TD
    classDef client fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef edgeGw fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef appCore fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;
    classDef n8nEngine fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12;
    classDef service fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#581c87;
    classDef queue fill:#fefce8,stroke:#eab308,stroke-width:2px,color:#713f12;

    subgraph CLIENT_TIER ["1. ATS Application Trigger (HR & Hiring Manager)"]
        UI_SCHEDULE["Schedule Interview Modal<br>(Candidate Drawer)"]:::client
        UI_NEW_APP["Public Careers Intake<br>(New CV Submission)"]:::client
        UI_REJECT["Kanban Drag to Rejected<br>(BRL-05 Buffer Gate)"]:::client
    end

    subgraph ATS_DISPATCHER ["2. ATS Core Dispatcher (Resilient & Non-blocking)"]
        N8N_LIB["src/lib/n8n.ts<br>(dispatchN8nWebhook)"]:::appCore
        TIMEOUT_GUARD["Strict 7s AbortController<br>(Fail-Safe Non-Blocking)"]:::appCore
        ENV_ROUTER{{"Environment Routing<br>(N8N_*_WEBHOOK_URL)"}}:::edgeGw
    end

    subgraph INGRESS_TUNNEL ["3. Ingress & Tunnel Layer"]
        CF_TUNNEL["Cloudflare Tunnel Daemon<br>(cloudflared / trycloudflare)"]:::edgeGw
        N8N_LOCAL["Local n8n Engine<br>(http://localhost:5678)"]:::n8nEngine
    end

    subgraph WORKFLOWS ["4. Production n8n Orchestration Workflows"]
        subgraph WF1 ["Workflow 1: Interview Invitation & Calendar Sync"]
            WH_INTERVIEW["Webhook: POST /webhook/interview-schedule"]:::n8nEngine
            VALIDATE_INT["Validate Candidate, Job & Time Data"]:::n8nEngine
            GCAL_NODE["Google Calendar Node<br>(googleCalendarOAuth2Api)"]:::service
            GMAIL_NODE["Gmail Node<br>(gmailOAuth2Api)"]:::service
        end

        subgraph WF2 ["Workflow 2: Telegram HR Alerts"]
            WH_TELEGRAM["Webhook: POST /webhook/telegram-alert"]:::n8nEngine
            FORMAT_MSG["Format Markdown Message<br>(Name, Score, Match Tier)"]:::n8nEngine
            TG_NODE["Telegram Bot Node<br>(@Rec_Hr_rBot / telegramApi)"]:::service
        end

        subgraph WF3 ["Workflow 3: 12-Hour Polite Rejection Buffer (BRL-05)"]
            WH_REJECT["Webhook: POST /webhook/rejection-buffer"]:::n8nEngine
            WAIT_NODE["Wait Node<br>(12 Hours Buffer Timer)"]:::queue
            CHECK_STATE["Check ATS Database State<br>(Cancel if Candidate Recovered)"]:::n8nEngine
            SMTP_REJECT["Send Polite Rejection Email<br>(SMTP / Gmail)"]:::service
        end
    end

    subgraph EXTERNAL_SERVICES ["5. External Ecosystem & Third-Party APIs"]
        EXT_GCAL["Google Calendar<br>(Event Created with Meet Link)"]:::service
        EXT_CANDIDATE["Candidate Mailbox<br>(Interview Invitation with ICS)"]:::service
        EXT_TG_CHANNEL["HR Telegram Channel<br>(Instant Notification Card)"]:::service
        EXT_REJECT_CAND["Candidate Mailbox<br>(Respectful Rejection Feedback)"]:::service
    end

    %% Data flow connections
    UI_SCHEDULE -->|Trigger| N8N_LIB
    UI_NEW_APP -->|Trigger| N8N_LIB
    UI_REJECT -->|Trigger| N8N_LIB

    N8N_LIB --> TIMEOUT_GUARD
    TIMEOUT_GUARD --> ENV_ROUTER

    ENV_ROUTER -->|HTTPS POST| CF_TUNNEL
    CF_TUNNEL -->|Forward Port 5678| N8N_LOCAL

    N8N_LOCAL --> WH_INTERVIEW
    N8N_LOCAL --> WH_TELEGRAM
    N8N_LOCAL --> WH_REJECT

    %% WF1 Flow
    WH_INTERVIEW --> VALIDATE_INT
    VALIDATE_INT --> GCAL_NODE
    GCAL_NODE -->|Event ID & Meet Link| GMAIL_NODE
    GCAL_NODE -.-> EXT_GCAL
    GMAIL_NODE -.-> EXT_CANDIDATE

    %% WF2 Flow
    WH_TELEGRAM --> FORMAT_MSG
    FORMAT_MSG --> TG_NODE
    TG_NODE -.-> EXT_TG_CHANNEL

    %% WF3 Flow
    WH_REJECT --> WAIT_NODE
    WAIT_NODE --> CHECK_STATE
    CHECK_STATE -->|If Still REJECTED| SMTP_REJECT
    CHECK_STATE -.->|If Recovered to Kanban| CANCEL_DISCARD["Discard Execution<br>(Silent Exit)"]:::queue
    SMTP_REJECT -.-> EXT_REJECT_CAND
```

---

## 3. Workflow Specifications & Operational Parameters

| Workflow Name | Webhook Endpoint | Trigger Condition | Target External Services | SLA / Latency |
| :--- | :--- | :--- | :--- | :--- |
| **WF-01: Interview Scheduling** | `/webhook/interview-schedule` | Recruiter clicks *"Lên lịch & Gửi lời mời"* in Candidate Drawer | Google Calendar (OAuth2), Gmail (OAuth2) | < 3,000ms |
| **WF-02: Telegram HR Alerts** | `/webhook/telegram-alert` | Candidate applies on Public Portal & AI Match Score computed | Telegram Bot API (`@Rec_Hr_rBot`) | < 800ms |
| **WF-03: Polite Rejection Buffer** | `/webhook/rejection-buffer` | Recruiter drags card to `REJECTED` column (BRL-05) | n8n Wait Node (12h), SMTP / Gmail | 12 hours delay |

---

## 4. Resilience & Error Handling Architecture
1. **Circuit Breaker via `AbortController`:** ATS Core dispatches all webhooks via `fetch` wrapped in a 7-second abort controller. If the tunnel or n8n is offline, user experience remains completely responsive (HTTP 200 returned locally with fallback logging).
2. **Tunnel Ingress Resilience:** Cloudflare tunnel automatically recovers from IP renegotiation and reconnects to local port 5678.
3. **Idempotency & Rejection Recovery:** Workflow 3 queries the ATS database after the 12-hour wait period. If the candidate was dragged back to `SCREENING` or `INTERVIEW` (recovered), the execution terminates cleanly without sending rejection emails.
