---
id: "DIAG-06-SEQUENCE"
title: "ATS Core System Sequence Diagrams (UML 2.5)"
type: "sequence-diagram"
version: "2.1.0"
status: "approved"
owner: "ATS Enterprise Business Analysis & Architecture Team"
format: "Mermaid sequenceDiagram + API Message Contracts"
tools:
  - "Mermaid Live Editor (https://mermaid.live)"
  - "Mermaid CLI (@mermaid-js/mermaid-cli)"
last_updated: "2026-11-19"
language: "en-US"
---

# DIAGRAM 06: CORE SYSTEM SEQUENCE DIAGRAMS & API MESSAGE CONTRACTS

> **Domain:** API Message Orchestration, Micro-Interactions & Service Workflows  
> **Source Mermaid Script:** [`docs/diagrams/06_system_sequence_diagrams.mmd`](file:///d:/ATS%20project/docs/diagrams/06_system_sequence_diagrams.mmd)  
> **Specification Standard:** UML 2.5 Interaction Sequence Diagram  
> **Documentation Standard:** Universal BA Toolkit (English Only Execution Standard).

---

## 1. Quick Export Guide (Vector SVG & Sequence Charts)

The companion file [`06_system_sequence_diagrams.mmd`](file:///d:/ATS%20project/docs/diagrams/06_system_sequence_diagrams.mmd) contains standard Mermaid `sequenceDiagram` definitions featuring automatic message numbering (`autonumber`), activation lifelines, and conditional fragments (`alt`, `else`, `opt`).

### Option A: Render & Export via Mermaid Live Editor (Browser)
1. Navigate to **[https://mermaid.live](https://mermaid.live)**.
2. Paste any individual flow or the complete sequence script into the editor.
3. Observe the left-to-right lifeline progression and structured error branches.
4. Export as **SVG** for crisp documentation embedding or **PNG (3x)**.

### Option B: Local CLI Export via Mermaid CLI (`mmdc`)
```powershell
mmdc -i docs/diagrams/06_system_sequence_diagrams.mmd -o docs/diagrams/06_system_sequence_diagrams.svg
```

---

## 2. Visual Sequence Flows (Embedded Mermaid)

### Flow 1: Candidate Application Intake, Deduplication & Hybrid AI Scoring

```mermaid
sequenceDiagram
    autonumber
    actor C as Candidate (Applicant)
    participant FE as Next.js Web Client (/jobs)
    participant API as Next.js API Route (/api/applications)
    participant DB as Neon PostgreSQL (Prisma ORM)
    participant AI as Hybrid AI Engine (NLP + Gemini)
    participant N8N as n8n Webhook Automation

    C->>+FE: Selects Job & Uploads Resume (PDF/DOCX)
    FE->>FE: Validates File Size (<= 5MB) & Magic Bytes (%PDF/PK)
    FE->>+API: POST /api/applications (Multipart Form Data)
    
    API->>API: Computes SHA-256 Resume File Hash
    API->>+DB: Query Candidate by Email & Phone (BRL-02)
    DB-->>-API: Return Matching Profile (if any)
    
    alt Candidate Already Exists within 30 Days
        API->>API: Flag Duplicate Warning Badge (Soft Link)
    else Unique Candidate Profile
        API->>+DB: INSERT into candidates table
        DB-->>-API: Return New candidateId
    end

    API->>+AI: Trigger Hybrid AI Parsing (Layer 1 NLP + Layer 2 Gemini)
    AI-->>-API: Return 5 Core Fields + Match Score (0-100%) + Rationale

    API->>+DB: INSERT into applications (currentStage="NEW", aiMatchScore)
    DB-->>-API: Return application record

    API->>+DB: INSERT into audit_logs (action="CV_UPLOAD")
    DB-->>-API: Acknowledge Audit Trail

    opt Telegram Alert Configured (N8N_TELEGRAM_WEBHOOK_URL)
        API-)N8N: Async POST /webhook/telegram-alert (Candidate Applied)
        Note right of N8N: Dispatches alert to HR Telegram Channel
    end

    API-->>-FE: 201 Created (Application ID, Score, Status="NEW")
    FE-->>-C: Display Success Confirmation & Application Tracking ID
```

---

### Flow 2: Kanban Drag-and-Drop Stage Transition with Guard Checks

```mermaid
sequenceDiagram
    autonumber
    actor U as Recruiter / Hiring Manager
    participant UI as Kanban Board View (/dashboard)
    participant API as Pipeline Move API (/api/pipeline/move)
    participant DB as Neon PostgreSQL (Prisma ORM)
    participant N8N as n8n Webhook (Delayed Rejection Buffer)

    U->>+UI: Drags Candidate Card to Target Column
    UI->>+API: PATCH /api/pipeline/move { applicationId, toStage, reason? }

    API->>+DB: Fetch Application & Current User Role (RBAC Check)
    DB-->>-API: Return Application State & User Role

    alt User Role Unauthorized for Target Stage
        API-->>UI: 403 Forbidden (ERR_FORBIDDEN_STAGE_TRANSITION)
        UI-->>U: Alert: "You do not have permission to advance to this stage."
    else Target Stage is "HIRED" and Scorecard is Missing (BRL-06)
        API->>+DB: Query Count of Evaluations for applicationId
        DB-->>-API: Return Count = 0
        API-->>UI: 422 Unprocessable Entity (ERR_MISSING_SCORECARD)
        UI-->>U: Alert: "Cannot Hire candidate without a completed Scorecard."
    else Target Stage is "REJECTED" and Reason is Empty (BRL-11)
        API-->>UI: 422 Unprocessable Entity (ERR_MANDATORY_REJECTION_REASON)
        UI-->>U: Prompt: "Please provide a valid rejection reason."
    else Valid Transition (Happy Path)
        API->>+DB: UPDATE applications SET currentStage=toStage, stageUpdatedAt=now()
        alt Target Stage is "REJECTED"
            API->>DB: SET emailScheduledAt = now() + 12 Hours (BRL-05 Buffer)
            opt n8n Rejection Buffer Configured
                API-)N8N: Async POST /webhook/rejection-buffer (Queue Delayed Notice)
            end
        end
        DB-->>-API: Updated Record

        API->>+DB: INSERT into audit_logs (action="STAGE_CHANGE", fromStage, toStage, reason)
        DB-->>-API: Log Persisted

        API-->>-UI: 200 OK { success: true, updatedStage: toStage }
        UI-->>-U: Card Snaps to Target Column with Visual Confirmation
    end
```

---

### Flow 3: Interview Scheduling & Automated Calendar Integration

```mermaid
sequenceDiagram
    autonumber
    actor HM as Hiring Manager
    participant UI as Interview Modal (/dashboard)
    participant API as Schedule API (/api/interviews/schedule)
    participant DB as Neon PostgreSQL (Prisma ORM)
    participant N8N as n8n Webhook (Calendar & Email Worker)
    actor C as Candidate

    HM->>+UI: Selects Date, Time, Format (Google Meet) & Notes
    UI->>+API: POST /api/interviews/schedule { applicationId, interviewDate, format, location, notes }

    API->>+DB: Check Concurrency Limit for Job (BRL-13: Active <= 3x Headcount)
    DB-->>-API: Current Active Interviews Count

    alt Interview Quota Exceeded
        API-->>UI: 422 Unprocessable Entity (ERR_INTERVIEW_QUOTA_EXCEEDED)
        UI-->>HM: Alert: "Interview concurrency cap reached for this job opening."
    else Quota Verified
        API->>+DB: UPDATE applications SET interviewDate, interviewFormat, interviewLocation, currentStage="INTERVIEW"
        DB-->>-API: Update Success

        API->>+DB: INSERT into audit_logs (action="STAGE_CHANGE", toStage="INTERVIEW")
        DB-->>-API: Log Recorded

        opt Automated Dispatch Enabled (N8N_INTERVIEW_WEBHOOK_URL)
            API->>+N8N: POST /webhook/interview-schedule (Candidate & Session Details)
            N8N-)C: Dispatches Automated Email Invite & Google Calendar Event (.ics)
            N8N-)HM: Dispatches Calendar Invite with Google Meet Link
            N8N-->>-API: 200 OK { calendarEventId: "evt_99182", status: "DISPATCHED" }
            API->>DB: UPDATE applications SET isInterviewInviteSent=true
        end

        API-->>-UI: 200 OK { success: true, scheduledDate: interviewDate }
        UI-->>-HM: Display Confirmation Banner: "Interview Scheduled & Calendar Synced"
    end
```

---

## 3. Core API Message Specifications

| Flow ID | HTTP Method & Route | Request Payload Schema | Success Code | Error Code & Scenarios |
| :--- | :--- | :--- | :--- | :--- |
| **Flow 1** | `POST /api/applications` | `FormData: { jobId, fullName, email, phone, resumeFile }` | `201 Created` | `400 ERR_INVALID_FILE_TYPE`<br>`429 ERR_RATE_LIMIT_EXCEEDED` |
| **Flow 2** | `PATCH /api/pipeline/move` | `{ applicationId: number, toStage: string, reason?: string }` | `200 OK` | `403 ERR_FORBIDDEN_STAGE_TRANSITION`<br>`422 ERR_MISSING_SCORECARD`<br>`422 ERR_MANDATORY_REJECTION_REASON` |
| **Flow 3** | `POST /api/interviews/schedule` | `{ applicationId: number, interviewDate: string, format: string, location: string }` | `200 OK` | `422 ERR_INTERVIEW_QUOTA_EXCEEDED`<br>`404 ERR_APPLICATION_NOT_FOUND` |
| **Flow 4** | `POST /api/evaluations` | `{ applicationId: number, technicalScore: 1-5, communicationScore: 1-5, culturalFitScore: 1-5, recommendation: string }` | `201 Created` | `400 ERR_INVALID_SCORE_RANGE`<br>`401 ERR_UNAUTHORIZED` |

---

## 4. Asynchronous Integration Architecture

### 1. Hybrid AI Extraction Engine
- **Synchronous Phase:** Local Node.js stream parsing extracts raw text from PDF/DOCX via `pdf-parse` / `mammoth` (< 500ms).
- **Asynchronous Phase:** Structured prompting to Google Gemini API (`@google/genai`) runs with `temperature: 0` to yield deterministic 5-core-field JSON extraction and a 3-tier Match Score against the job description.

### 2. External n8n Webhook Automation
- Configured via environment variables (`N8N_INTERVIEW_WEBHOOK_URL`, `N8N_TELEGRAM_WEBHOOK_URL`, `N8N_REJECTION_WEBHOOK_URL`).
- **Resilience Strategy:** The Next.js backend issues outbound HTTP requests with a strict 7-second timeout. If the webhook endpoint is unreachable or delayed, the backend logs the warning without crashing the core user experience or blocking database persistence.
