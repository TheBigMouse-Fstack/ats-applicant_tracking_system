---
id: "SPEC-02-API"
title: "ATS RESTful API Specifications & Endpoint Contracts"
type: "technical-specification"
version: "2.1.0"
status: "approved"
owner: "ATS Enterprise Business Analysis & Architecture Team"
language: "en-US"
last_updated: "2026-11-19"
---

# SPECIFICATION 02: RESTFUL API SPECIFICATIONS & ENDPOINT CONTRACTS

> **Scope:** Enterprise Applicant Tracking System (ATS) REST API Architecture  
> **Documentation Standard:** OpenAPI 3.1 / RFC 7807 Problem Details Standard (English Only).

---

## 1. Architectural Overview & Global Standards

The ATS platform exposes a standardized RESTful API architecture powered by the Next.js 14+ App Router. All endpoints adhere to consistent design patterns:
- **Base URI:** `https://recoverx.careers/api` (Production) / `http://localhost:3000/api` (Development).
- **Transport Security:** Enforced TLS 1.3 across all communication channels.
- **Content Type:** `application/json` (or `multipart/form-data` for resume file uploads).
- **Session Authentication:** Secured via HTTP-only, SameSite signed session cookies (`ats_session`).
- **Standard Error Format (RFC 7807):**
```json
{
  "error": "ERR_CODE_IDENTIFIER",
  "message": "Human-readable friendly explanation",
  "statusCode": 422,
  "timestamp": "2026-11-19T14:30:00.000Z",
  "details": {}
}
```

---

## 2. Comprehensive Endpoint Catalog (16 Core Contracts)

### Section A: Public & Careers Portal Endpoints

#### 1. List Active Job Openings
- **Route:** `GET /api/jobs`
- **Access Level:** Public (No authentication required)
- **Query Parameters:**
  - `department` (optional string): Filter by department (e.g. `Engineering`).
  - `search` (optional string): Full-text search across job title and keywords.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Senior Frontend Engineer (React/Next.js)",
      "department": "Engineering",
      "location": "Ho Chi Minh City",
      "employmentType": "Full-time",
      "targetHeadcount": 2,
      "status": "ACTIVE",
      "createdAt": "2026-11-15T08:00:00.000Z"
    }
  ]
}
```

#### 2. Submit Candidate Application
- **Route:** `POST /api/applications`
- **Access Level:** Public / Candidate
- **Request Format:** `multipart/form-data`
- **Form Fields:**
  - `jobId` (required integer): Target Job ID.
  - `fullName` (required string, 2-100 chars): Candidate full name.
  - `email` (required string, valid email format): Candidate email.
  - `phone` (required string, valid phone format): Contact phone number.
  - `resumeFile` (required binary file): PDF or DOCX file (≤ 5MB).
- **Validation Rules:**
  - Magic byte inspection (`%PDF` / `PK`).
  - Velocity limit: max 3 submissions per candidate in 90 days (`BRL-04`).
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "applicationId": 128,
    "candidateId": 84,
    "currentStage": "NEW",
    "aiMatchScore": 88.5,
    "matchTier": "GREEN",
    "trackingToken": "trk_8f92a10c7"
  }
}
```
- **cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/applications" \
  -F "jobId=1" \
  -F "fullName=Tran Minh Quan" \
  -F "email=quan.tran@example.com" \
  -F "phone=0909123456" \
  -F "resumeFile=@/path/to/resume.pdf"
```

---

### Section B: Kanban Pipeline & Stage Transitions

#### 3. Transition Pipeline Stage (Drag-and-Drop)
- **Route:** `PATCH /api/pipeline/move`
- **Access Level:** Authenticated Internal Users (`HR`, `HIRING_MANAGER`, `ADMIN`)
- **Request Body Schema:**
```json
{
  "applicationId": 128,
  "toStage": "SCREENING",
  "reason": "Meets core technical qualifications"
}
```
- **Business Guard Enforcements:**
  - **RBAC Limit (`BRL-07`):** `HR` cannot advance to `INTERVIEW` or `HIRED`.
  - **Scorecard Prerequisite (`BRL-06`):** If `toStage === "HIRED"`, at least 1 completed Scorecard must exist; returns `422 ERR_MISSING_SCORECARD` if missing.
  - **Mandatory Rejection Reason (`BRL-11`):** If `toStage === "REJECTED"`, `reason` must be provided; returns `422 ERR_MANDATORY_REJECTION_REASON` if empty.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Candidate successfully transitioned to SCREENING",
  "data": {
    "applicationId": 128,
    "previousStage": "NEW",
    "currentStage": "SCREENING",
    "stageUpdatedAt": "2026-11-19T14:35:10.000Z"
  }
}
```

#### 4. Fetch Pipeline Board Data & Multi-Column Pagination
- **Route:** `GET /api/pipeline`
- **Access Level:** Authenticated Internal Users
- **Query Parameters:**
  - `jobId` (optional integer): Filter candidates by specific job requisition.
  - `limitPerStage` (optional integer, default 15): Progressive pagination limit.
  - `search` (optional string): Filter candidate names or skills.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "NEW": { "items": [], "totalCount": 12, "hasMore": false },
    "SCREENING": { "items": [], "totalCount": 8, "hasMore": false },
    "INTERVIEW": { "items": [], "totalCount": 5, "hasMore": false },
    "HIRED": { "items": [], "totalCount": 2, "hasMore": false },
    "REJECTED": { "items": [], "totalCount": 19, "hasMore": true }
  }
}
```

---

### Section C: Interview Scheduling & Automated Workflows

#### 5. Schedule Interview Session
- **Route:** `POST /api/interviews/schedule`
- **Access Level:** `HIRING_MANAGER`, `ADMIN`
- **Request Body Schema:**
```json
{
  "applicationId": 128,
  "interviewDate": "2026-11-22T10:00:00.000Z",
  "interviewFormat": "ONLINE",
  "interviewLocation": "https://meet.google.com/abc-defg-hij",
  "interviewNotes": "Focus on system architecture and Next.js performance",
  "interviewInterviewerNotes": "Candidate has 5 years experience, verify SSR knowledge",
  "interviewEmailOption": "AUTO_N8N"
}
```
- **Business Rule Enforcement:**
  - **Concurrency Quota (`BRL-13`):** Active interviews in job must not exceed `3 * targetHeadcount`. Returns `409 ERR_INTERVIEW_QUOTA_EXCEEDED` if cap reached without override.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Interview scheduled successfully and automated calendar invite dispatched",
  "data": {
    "applicationId": 128,
    "interviewDate": "2026-11-22T10:00:00.000Z",
    "isInterviewInviteSent": true
  }
}
```

#### 6. Trigger External Automation Dispatch (n8n Webhook Integration)
- **Route:** `POST /api/interviews/trigger-n8n`
- **Access Level:** Authenticated Staff
- **Backend Behavior:**
  - Directly dispatches HTTP POST payload to `N8N_INTERVIEW_WEBHOOK_URL` configured in `.env`.
  - Bounded by resilient 7-second timeout.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "dispatchedUrl": "http://localhost:5678/webhook/interview-schedule",
  "httpStatus": 200,
  "timestamp": "2026-11-19T14:40:00.000Z"
}
```

---

### Section D: Interview Scorecards & Evaluations

#### 7. Submit Structured Evaluation Scorecard
- **Route:** `POST /api/evaluations`
- **Access Level:** `HIRING_MANAGER`, `ADMIN`
- **Request Body Schema:**
```json
{
  "applicationId": 128,
  "round": "Round 1 Technical Evaluation",
  "technicalScore": 4,
  "communicationScore": 5,
  "culturalFitScore": 4,
  "recommendation": "HIRE",
  "levelRecommendation": "SENIOR",
  "strengths": "Deep knowledge of React Server Components and micro-frontends",
  "weaknesses": "Limited exposure to Kubernetes cluster management",
  "technicalNotes": "Strong problem solving in live coding exercise",
  "communicationNotes": "Clear, structured English communication",
  "cultureNotes": "Highly collaborative and aligns well with team principles"
}
```
- **Mathematical Calculation (`BRL-08`):**
  - Automatically calculates: `overallScore = (4 * 0.4) + (5 * 0.3) + (4 * 0.3) = 4.30`.
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "evaluationId": 42,
    "overallScore": 4.30,
    "recommendation": "HIRE",
    "createdAt": "2026-11-19T14:45:00.000Z"
  }
}
```

---

### Section E: Talent Pool & Candidate Recovery

#### 8. Query Centralized Talent Pool
- **Route:** `GET /api/talent-pool`
- **Access Level:** `HR`, `ADMIN`
- **Query Parameters:**
  - `tier` (optional string): `SILVER_MEDALIST` | `FUTURE_FIT` | `ARCHIVE`.
  - `maxDays` (optional integer, default 180): Filter within retention window.
  - `search` (optional string): Filter candidate names or skills.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "totalTalent": 34,
  "data": [
    {
      "candidateId": 67,
      "fullName": "Nguyen Van B",
      "email": "b.nguyen@example.com",
      "tier": "SILVER_MEDALIST",
      "aiMatchScore": 82.0,
      "rejectionReason": "Headcount filled by internal referral",
      "daysSinceRejection": 24,
      "retainedUntil": "2027-05-18T00:00:00.000Z"
    }
  ]
}
```

#### 9. Re-Pool Candidate to Active Requisition
- **Route:** `POST /api/talent-pool/repool`
- **Access Level:** `HR`, `ADMIN`
- **Request Body Schema:**
```json
{
  "candidateId": 67,
  "targetJobId": 4
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Candidate successfully reactivated into SCREENING stage for Job ID 4",
  "newApplicationId": 145
}
```
