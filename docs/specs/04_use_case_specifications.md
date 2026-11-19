---
id: "SPEC-04-USECASE"
title: "ATS Core Use Case Specifications (Alistair Cockburn Format)"
type: "technical-specification"
version: "2.1.0"
status: "approved"
owner: "ATS Enterprise Business Analysis & Architecture Team"
language: "en-US"
last_updated: "2026-11-19"
---

# SPECIFICATION 04: CORE USE CASE SPECIFICATIONS (ALISTAIR COCKBURN 12-PART FORMAT)

> **Scope:** Enterprise Applicant Tracking System (ATS)  
> **Documentation Standard:** Alistair Cockburn Structured Use Case Template (English Only).

---

## 1. Specification Methodology

Each use case in this specification follows the industry-standard **Alistair Cockburn 12-part formal structure**, explicitly distinguishing the primary actor, stakeholder interests, preconditions, success guarantees, step-by-step main success scenario (happy path), exception branches (extensions), and underlying business rule constraints.

---

## 2. Core Use Case Specifications

### Use Case 01: UC-02 Submit Online Application & Resume

1. **Use Case ID & Name:** `UC-02: Submit Online Application & Resume`
2. **Scope & Level:** ATS Public Careers Portal (`/jobs`) / User Goal Level.
3. **Primary Actor:** Job Seeker (External Guest Candidate).
4. **Secondary Actors:** Hybrid AI Parsing Engine, PostgreSQL Database.
5. **Stakeholders & Interests:**
   - *Candidate:* Wants a seamless, rapid submission experience with clear status confirmation.
   - *Recruiter:* Wants deduplicated, accurate applicant contact data and parsed skills.
   - *Enterprise:* Wants to prevent malicious file injection and candidate spamming.
6. **Pre-conditions:**
   - The selected job requisition is in `ACTIVE` status.
   - The candidate has not exceeded the 3 applications per 90 days velocity limit (`BRL-04`).
7. **Post-conditions (Guarantees):**
   - *Minimal Guarantee:* No invalid files or unverified data stored; system logs submission attempt.
   - *Success Guarantee:* A new application record is instantiated in `NEW` stage; resume file saved; AI parsing and scoring executed; candidate receives tracking reference ID.
8. **Trigger:** Candidate completes the web form on `/jobs` and clicks "Submit Application".
9. **Main Success Scenario:**
   1. Candidate accesses the application modal, inputs full name, email, phone, and uploads a PDF resume.
   2. Client validates file size (≤ 5MB) and confirms valid file extension.
   3. Candidate submits the form; client sends `multipart/form-data` to `POST /api/applications`.
   4. Server verifies file binary magic bytes (`%PDF-`) and computes SHA-256 hash (`BRL-01`).
   5. Server executes deduplication check: queries database for matching email and phone within 30 days (`BRL-02`).
   6. Server confirms unique candidate and creates a record in `candidates` table.
   7. Server invokes Layer 1 text extraction and Layer 2 Google Gemini AI to parse 5 core fields (`BRL-03`) and compute semantic match score against JD requirements (`BRL-09`).
   8. Server inserts application record into `applications` with `currentStage = "NEW"` and AI score.
   9. Server logs audit trail entry with action `"CV_UPLOAD"`.
   10. Server returns HTTP `201 Created` with application ID and tracking reference.
   11. Portal displays a friendly confirmation banner and provides candidate tracking instructions.
10. **Extensions (Alternative & Exception Paths):**
    - **4a. File fails magic byte validation or exceeds 5MB limit:**
      - 4a1. Server rejects upload with HTTP `400 ERR_INVALID_FILE_TYPE` or HTTP `413 ERR_FILE_TOO_LARGE`.
      - 4a2. UI displays: *"Please upload a valid PDF or Word document (.docx) under 5MB."* Use case ends.
    - **5a. Candidate has applied to same job within 30 days (`BRL-02`):**
      - 5a1. Server identifies existing profile; associates submission to existing candidate record.
      - 5a2. Server sets `duplicateWarningNote` and displays soft warning on recruiter dashboard. Flow continues.
    - **5b. Candidate has exceeded 3 applications in 90 days (`BRL-04`):**
      - 5b1. Server blocks submission with HTTP `429 ERR_APPLICATION_LIMIT_EXCEEDED`.
      - 5b2. UI displays: *"Application limit reached (max 3 jobs per 90 days)."* Use case ends.
11. **Technology & Data Variations:**
    - Supports both Adobe PDF (`%PDF`) and Microsoft Word (`.docx` / `PK`).
12. **Related Business Rules:** `BRL-01`, `BRL-02`, `BRL-03`, `BRL-04`, `BRL-09`.

---

### Use Case 02: UC-08 Transition Stage on 5-Stage Kanban Board

1. **Use Case ID & Name:** `UC-08: Transition Stage on 5-Stage Kanban Board`
2. **Scope & Level:** ATS Recruiter Workspace (`/dashboard`) / User Goal Level.
3. **Primary Actor:** Recruiter (`HR`) or Hiring Manager (`HIRING_MANAGER`).
4. **Secondary Actors:** Business Rules Engine, Database, Background Automation Worker.
5. **Stakeholders & Interests:**
   - *Recruiter / HM:* Wants smooth visual drag-and-drop workflow tracking.
   - *Candidate:* Expects timely, courteous, and accurate progress updates.
   - *Management:* Demands auditable recruitment governance and stage enforcement.
6. **Pre-conditions:**
   - User is authenticated with a valid RBAC session token.
   - Target candidate card exists on the active Kanban board.
7. **Post-conditions (Guarantees):**
   - *Success Guarantee:* Candidate stage updated; audit log entry recorded; downstream automation triggered.
8. **Trigger:** User drags a candidate card and drops it into a new Kanban stage column.
9. **Main Success Scenario:**
   1. User drags card from source column (e.g. `NEW`) to destination column (e.g. `SCREENING`).
   2. UI optimistically positions card and dispatches `PATCH /api/pipeline/move`.
   3. Backend checks user role against permitted stage transitions (`BRL-07`).
   4. Backend verifies stage guard conditions:
      - Checks scorecard presence if target is `HIRED` (`BRL-06`).
      - Checks reason presence if target is `REJECTED` (`BRL-11`).
   5. Backend updates `currentStage` and `stageUpdatedAt` in `applications` table.
   6. Backend writes immutable log to `audit_logs` table (`fromStage`, `toStage`, `userId`, `action`).
   7. Backend returns HTTP `200 OK`.
   8. UI confirms card position with subtle visual feedback.
10. **Extensions (Exception Paths):**
    - **3a. User role lacks authorization for target stage (`BRL-07`):**
      - 3a1. Server rejects with HTTP `403 ERR_FORBIDDEN_STAGE_TRANSITION`.
      - 3a2. Card snaps back to original column; UI displays warning. Use case ends.
    - **4a. Target stage is `HIRED` but Scorecard is missing (`BRL-06`):**
      - 4a1. Server checks `evaluations` table; count equals 0.
      - 4a2. Server rejects with HTTP `422 ERR_MISSING_SCORECARD`.
      - 4a3. Card snaps back; UI displays modal: *"Cannot hire candidate without a completed Scorecard."*
    - **4b. Target stage is `REJECTED`:**
      - 4b1. UI intercepts drop and opens Mandatory Rejection Reason dialog (`BRL-11`).
      - 4b2. If user provides valid reason, server sets `emailScheduledAt = now() + 12h` (`BRL-05`).
      - 4b3. Candidate profile is indexed into Talent Pool. Flow continues.
11. **Technology & Data Variations:**
    - Drag-and-drop implemented via `@hello-pangea/dnd` with fallback stage selector buttons.
12. **Related Business Rules:** `BRL-05`, `BRL-06`, `BRL-07`, `BRL-11`, `BRL-12`.

---

### Use Case 03: UC-13 & UC-14 Schedule Interview Session & Automated Dispatch

1. **Use Case ID & Name:** `UC-13: Schedule Interview Session & Automated Dispatch`
2. **Scope & Level:** ATS Recruiter Workspace / User Goal Level.
3. **Primary Actor:** Hiring Manager (`HIRING_MANAGER`) or Recruiter (`HR`).
4. **Secondary Actors:** n8n Workflow Automation Platform, Google Calendar API.
5. **Stakeholders & Interests:**
   - *Hiring Team:* Wants conflict-free interview calendar events and meeting links.
   - *Candidate:* Wants timely interview details with clear preparation instructions.
6. **Pre-conditions:**
   - Candidate card is in `SCREENING` or `INTERVIEW` stage.
   - Job opening has not exceeded concurrent interview limit (`BRL-13`).
7. **Post-conditions (Guarantees):**
   - Application record updated with interview timestamp and location.
   - Automated calendar event created and email invitations dispatched.
8. **Trigger:** User opens Candidate Drawer, navigates to Interview tab, and clicks "Schedule Interview".
9. **Main Success Scenario:**
   1. User selects date, time, format (Online via Google Meet), and inputs interviewer notes.
   2. User submits form; client sends `POST /api/interviews/schedule`.
   3. Server verifies that concurrent active interviews for the job do not exceed `3 * targetHeadcount` (`BRL-13`).
   4. Server updates application record with `interviewDate`, `interviewFormat`, `interviewLocation`, and sets `currentStage = "INTERVIEW"`.
   5. Server records audit log entry with action `"STAGE_CHANGE"` and `toStage = "INTERVIEW"`.
   6. Server dispatches HTTP POST payload to `N8N_INTERVIEW_WEBHOOK_URL` (`src/lib/n8n.ts`).
   7. External n8n workflow creates Google Calendar event, attaches Meet link, and emails candidate and interviewers.
   8. Server marks `isInterviewInviteSent = true` and returns HTTP `200 OK`.
   9. UI displays confirmation banner indicating interview has been scheduled.
10. **Extensions (Exception Paths):**
    - **3a. Active interview count exceeds concurrency quota (`BRL-13`):**
      - 3a1. Server returns HTTP `409 ERR_INTERVIEW_QUOTA_EXCEEDED`.
      - 3a2. UI displays prompt offering manager override or advising completion of existing candidates.
    - **6a. n8n automation service unreachable or times out:**
      - 6a1. Internal 7-second timeout triggers graceful warning in server logs.
      - 6a2. Database updates persist; UI informs user: *"Interview saved. Calendar sync queued."*
11. **Technology & Data Variations:**
    - Supports Online (Google Meet, Zoom) and Offline (Conference Room) formats.
12. **Related Business Rules:** `BRL-07`, `BRL-13`.

---

### Use Case 04: UC-15 Complete 3-Criteria Weighted Scorecard Evaluation

1. **Use Case ID & Name:** `UC-15: Complete 3-Criteria Weighted Scorecard Evaluation`
2. **Scope & Level:** ATS Recruiter Workspace / User Goal Level.
3. **Primary Actor:** Technical Interviewer / Hiring Manager.
4. **Secondary Actors:** Database (Evaluations Table).
5. **Stakeholders & Interests:**
   - *Hiring Manager:* Wants objective, calibrated evaluation across standardized dimensions.
   - *Enterprise:* Requires audit-proof evaluation records to justify hiring and promotion decisions.
6. **Pre-conditions:**
   - Candidate has been moved to `INTERVIEW` stage.
   - Evaluator holds valid `HIRING_MANAGER` or `ADMIN` privileges.
7. **Post-conditions (Guarantees):**
   - Non-empty Scorecard recorded in `evaluations` table; weighted overall score calculated (`BRL-08`).
   - Unlocks eligibility for the candidate to be advanced to `HIRED` (`BRL-06`).
8. **Trigger:** Interviewer finishes candidate assessment and clicks "Submit Scorecard".
9. **Main Success Scenario:**
   1. Evaluator opens the Scorecard tab inside the Candidate Drawer.
   2. Evaluator rates candidate from 1 to 5 stars across Technical (40%), Communication (30%), and Cultural Alignment (30%).
   3. Evaluator selects a recommendation (`HIRE`, `STRONG_HIRE`, `NO_HIRE`) and writes technical observations.
   4. Evaluator submits form; client sends `POST /api/evaluations`.
   5. Server validates rating boundaries (1 ≤ score ≤ 5) and required commentary.
   6. Server computes weighted rating: `overallScore = (tech * 0.4) + (comm * 0.3) + (cult * 0.3)`.
   7. Server inserts new record into `evaluations` table.
   8. Server creates audit log entry with action `"SCORECARD_EVALUATE"`.
   9. Server returns HTTP `201 Created` with computed overall score.
   10. Drawer immediately displays the completed Scorecard with weighted rating badge.
10. **Extensions (Exception Paths):**
    - **5a. Evaluator leaves technical score blank or outside 1–5 range:**
      - 5a1. Server rejects with HTTP `400 ERR_INVALID_SCORE_RANGE`.
      - 5a2. UI highlights invalid field in red and prevents submission.
11. **Technology & Data Variations:**
    - Interactive 5-star rating widget with instant real-time score preview.
12. **Related Business Rules:** `BRL-06`, `BRL-08`.
