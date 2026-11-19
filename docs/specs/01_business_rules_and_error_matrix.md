---
id: "SPEC-01-BRL-ERR"
title: "ATS Core Business Rules, Error Matrix & Gherkin BDD Acceptance Criteria"
type: "technical-specification"
version: "2.1.0"
status: "approved"
owner: "ATS Enterprise Business Analysis & Architecture Team"
language: "en-US"
last_updated: "2026-11-19"
---

# SPECIFICATION 01: CORE BUSINESS RULES, SYSTEM ERROR MATRIX & GHERKIN BDD CRITERIA

> **Scope:** Enterprise Applicant Tracking System (ATS)  
> **Documentation Standard:** IEEE 830 / ISO 29148 Specification Format (English Only).

---

## 1. Executive Summary & Specification Scope

This document specifies the definitive, immutable business rules (`BRL-01` to `BRL-13`), the system-wide 7-column Error Handling Matrix, and executable Gherkin BDD scenarios governing the ATS platform. Every rule is defined using a formal **3-Clause Rule Syntax** (*Pre-condition, Invariant Constraint, System Enforcement Action*) ensuring zero ambiguity for engineering and quality assurance.

---

## 2. Definitive Business Rules Catalog (`BRL-01` to `BRL-13`)

### BRL-01: Ingress File Security & Magic Byte Guard
- **Pre-condition:** A user or guest candidate uploads a resume document through the public portal (`/jobs`) or internal intake modal.
- **Invariant Constraint:** The uploaded file must not exceed 5MB in size and its binary buffer header must strictly match authentic magic bytes for Adobe Portable Document Format (`%PDF-` / `0x25 0x50 0x44 0x46`) or Microsoft Office Open XML (`PK\x03\x04` / `0x50 0x4B 0x03 0x04`). Filename extension spoofing (e.g. `malware.exe` renamed to `resume.pdf`) is strictly prohibited.
- **System Enforcement Action:** Reject invalid uploads immediately with HTTP `400 Bad Request` and error code `ERR_INVALID_FILE_TYPE`. Valid files are hashed via SHA-256 for duplicate detection.

### BRL-02: Candidate Profile Deduplication (Email & Phone 30-Day Check)
- **Pre-condition:** An application is submitted for a specific job opening.
- **Invariant Constraint:** If a submission contains an `email` or `phone` matching an existing application for the **same job opening** within a **30-calendar-day window**, it is classified as a duplicate.
- **System Enforcement Action:** The system prevents creating redundant candidate records, associates the new submission with the existing candidate ID, flags a soft warning badge on the recruiter UI, and logs an audit record without overwriting verified historical data.

### BRL-03: Mandatory 5-Core-Field AI Extraction
- **Pre-condition:** An unparsed candidate resume document is ingested by the platform.
- **Invariant Constraint:** The parsing engine must extract the 5 mandatory core profile fields:
  1. Full Name (`fullName`)
  2. Contact Email (`email`)
  3. Contact Phone Number (`phone`)
  4. Core Technical Skills (`skills[]`)
  5. Relevant Work Experience (`experienceYears`)
- **System Enforcement Action:** Execution proceeds via a two-layer hybrid model. Layer 1 executes local stream parsing (< 500ms). Layer 2 invokes Google Gemini API (`@google/genai`) with `temperature: 0` to yield deterministic JSON. If contact details are missing from the CV, values default to user-verified form inputs.

### BRL-04: Application Velocity Rate Limiting
- **Pre-condition:** A guest candidate attempts to submit an application.
- **Invariant Constraint:** A single candidate identity (tracked via Email, Phone, and IP address) is permitted a maximum of **3 job applications within any rolling 90-day window**.
- **System Enforcement Action:** Submissions exceeding this threshold are blocked with HTTP `429 Too Many Requests` and error code `ERR_APPLICATION_LIMIT_EXCEEDED`.

### BRL-05: 12-Hour Delayed Rejection Buffer (Brand Courtesy Window)
- **Pre-condition:** A candidate is transitioned to the `REJECTED` stage.
- **Invariant Constraint:** Outbound rejection emails must never be dispatched instantly, preventing adverse psychological impact on candidates and protecting the employer brand.
- **System Enforcement Action:** The system sets `emailScheduledAt = now() + 12 hours`. The background n8n automation queue buffers the email and delivers it only after the 12-hour grace period matures. If the recruiter drags the card out of `REJECTED` before the timer expires, the scheduled email is automatically cancelled.

### BRL-06: Stage Gatekeeper — Mandatory Scorecard Prerequisite for Hiring
- **Pre-condition:** A user attempts to transition an application card into the `HIRED` stage.
- **Invariant Constraint:** Transition to `HIRED` is strictly prohibited unless at least **one (1) completed, non-empty evaluation Scorecard** exists for the application record.
- **System Enforcement Action:** If `evaluations.length === 0`, the backend rejects the stage move with HTTP `422 Unprocessable Entity` and error code `ERR_MISSING_SCORECARD`. The UI displays an alert prompting the user to complete the Scorecard first.

### BRL-07: Role-Based Access Control (RBAC) Stage Limits
- **Pre-condition:** An internal user performs stage drag-and-drop or pipeline edits.
- **Invariant Constraint:**
  - **Recruiter (`HR`):** Permitted to manage `NEW ➔ SCREENING`, `NEW ➔ REJECTED`, and `SCREENING ➔ REJECTED`. Prohibited from advancing cards to `INTERVIEW` or `HIRED`.
  - **Hiring Manager (`HIRING_MANAGER`):** Permitted to manage `SCREENING ➔ INTERVIEW`, `INTERVIEW ➔ HIRED`, and `INTERVIEW ➔ REJECTED`. Prohibited from moving cards directly from `NEW`.
  - **Administrator (`ADMIN`):** Unrestricted authority across all stages.
- **System Enforcement Action:** Unauthorized stage move requests are rejected with HTTP `403 Forbidden` and error code `ERR_FORBIDDEN_STAGE_TRANSITION`.

### BRL-08: 3-Criteria Weighted Scorecard Evaluation
- **Pre-condition:** An interviewer submits an evaluation Scorecard.
- **Invariant Constraint:** Scores must be integers from 1 to 5 across 3 fixed criteria with mathematical weighting:
  - Technical Competence: **40%** (`tech * 0.4`)
  - Interpersonal Communication: **30%** (`comm * 0.3`)
  - Cultural Alignment: **30%** (`cult * 0.3`)
- **System Enforcement Action:** The system automatically calculates `overallScore = (tech * 0.4) + (comm * 0.3) + (cult * 0.3)`. Submissions with scores outside 1–5 are rejected with HTTP `400 Bad Request`.

### BRL-09: 3-Tier Match Score Indicator
- **Pre-condition:** AI semantic analysis is executed comparing CV text against the Job Description.
- **Invariant Constraint:** Match percentage (0–100%) must be categorized into standard 3-tier indicators:
  - **Tier 1 (Green / Strong Match):** Score ≥ 75%
  - **Tier 2 (Yellow / Potential Match):** Score between 50% and 74%
  - **Tier 3 (Red / Low Match):** Score < 50%
- **System Enforcement Action:** Calculated score and rationale badge are stored with the application record for visual calm rendering on Kanban cards.

### BRL-10: Talent Pool Tri-Tier Categorization & 180-Day Lifecycle
- **Pre-condition:** A candidate is rejected from an active job opening.
- **Invariant Constraint:** Disqualified candidates with high qualifications are preserved in the centralized Talent Pool under 3 distinct operational tiers:
  1. *Silver Medalists* (Reached Interview stage, overall score ≥ 3.5)
  2. *Future Fit* (Match score ≥ 60%, rejected due to headcount limits)
  3. *General Archive* (All other rejected submissions)
- **System Enforcement Action:** Records remain searchable for 180 days. Recruiters can re-pool candidates to active jobs with one click, instantiating a fresh application record in `SCREENING`.

### BRL-11: Mandatory Structured Rejection Reason
- **Pre-condition:** An application card is moved to the `REJECTED` stage.
- **Invariant Constraint:** The transition payload must contain a non-empty, recognized rejection reason code (e.g., `UNDERQUALIFIED`, `SALARY_MISMATCH`, `CULTURE_MISALIGNMENT`, `NO_SHOW`, `OFFER_DECLINED`).
- **System Enforcement Action:** If reason is missing or empty, the transition is rejected with HTTP `422 Unprocessable Entity` and error code `ERR_MANDATORY_REJECTION_REASON`.

### BRL-12: Human-in-the-Loop AI Governance
- **Pre-condition:** AI parsing or scoring processes a candidate profile.
- **Invariant Constraint:** AI services are strictly advisory. The AI engine is prohibited from autonomously executing stage transitions, advancing candidates, or triggering rejection notices without explicit human confirmation.
- **System Enforcement Action:** All stage changes require an authenticated human user session. Discrepancies between CV extracted text and web form entries are flagged as `contactMismatchLevel` (`NONE`, `MINOR`, `CRITICAL`) for human review.

### BRL-13: Interview Concurrency & Headcount Quota Guard
- **Pre-condition:** A user attempts to schedule an interview or advance a candidate to `INTERVIEW`.
- **Invariant Constraint:** Concurrent active candidates in the `INTERVIEW` stage for a given job must not exceed `3 * targetHeadcount`.
- **System Enforcement Action:** When the limit is reached, the system returns a soft warning (`409 Conflict - ERR_INTERVIEW_QUOTA_EXCEEDED`) allowing an authorized manager to override or prompting the user to complete existing evaluations first. When all headcount positions are hired, the job status automatically updates to `CLOSED`.

---

## 3. Master 7-Column System Error Matrix

| Error Code | HTTP Status | Business Rule | Trigger Context | Technical / Developer Payload | End-User Friendly Message | Recommended Recovery Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ERR_INVALID_FILE_TYPE` | `400 Bad Request` | `BRL-01` | Uploading unsupported file format or spoofed extension. | `{ "error": "ERR_INVALID_FILE_TYPE", "detail": "Header mismatch" }` | "Please upload a valid PDF or Word document (.docx) under 5MB." | Select an authentic PDF or DOCX file and retry. |
| `ERR_FILE_TOO_LARGE` | `413 Payload Too Large` | `BRL-01` | Uploading resume file exceeding 5MB size limit. | `{ "error": "ERR_FILE_TOO_LARGE", "maxBytes": 5242880 }` | "File exceeds the 5MB size limit. Please compress your resume." | Compress PDF via tools or remove high-res embedded graphics. |
| `ERR_DUPLICATE_APPLICATION` | `409 Conflict` | `BRL-02` | Submitting duplicate application within 30 days. | `{ "error": "ERR_DUPLICATE_APPLICATION", "existingAppId": 104 }` | "You have already applied for this position within the last 30 days." | Check status in Applicant Portal or contact recruitment team. |
| `ERR_APPLICATION_LIMIT_EXCEEDED`| `429 Too Many Requests`| `BRL-04` | Exceeding 3 applications in 90-day window. | `{ "error": "ERR_APPLICATION_LIMIT_EXCEEDED", "windowDays": 90 }` | "You have reached the maximum application limit (3 jobs per 90 days)." | Wait for active applications to conclude or reapply next quarter. |
| `ERR_MISSING_SCORECARD` | `422 Unprocessable Entity`| `BRL-06` | Moving candidate to HIRED without completed Scorecard. | `{ "error": "ERR_MISSING_SCORECARD", "applicationId": 55 }` | "Cannot hire candidate. Please complete at least one evaluation Scorecard first." | Open the Scorecard tab, submit ratings, and retry hiring. |
| `ERR_FORBIDDEN_STAGE_TRANSITION`| `403 Forbidden` | `BRL-07` | Recruiter attempting to advance to INTERVIEW/HIRED. | `{ "error": "ERR_FORBIDDEN_STAGE_TRANSITION", "userRole": "HR" }` | "You do not have permission to advance candidates beyond the Screening stage." | Request Hiring Manager or Administrator to review and advance. |
| `ERR_MANDATORY_REJECTION_REASON`| `422 Unprocessable Entity`| `BRL-11` | Transitioning to REJECTED with empty reason. | `{ "error": "ERR_MANDATORY_REJECTION_REASON", "field": "reason" }` | "Please select a valid reason before rejecting this candidate." | Select a reason from the dropdown modal and confirm. |
| `ERR_INTERVIEW_QUOTA_EXCEEDED` | `409 Conflict` | `BRL-13` | Scheduling interview when concurrent cap is reached. | `{ "error": "ERR_INTERVIEW_QUOTA_EXCEEDED", "maxInterviews": 3 }` | "Interview quota reached for this opening (max 3 active candidates per position)." | Conclude pending evaluations or request admin quota override. |
| `ERR_JOB_CLOSED` | `422 Unprocessable Entity`| `BRL-13` | Applying to or advancing candidate in a closed job. | `{ "error": "ERR_JOB_CLOSED", "jobStatus": "CLOSED" }` | "This job position has reached full headcount and is now closed." | Select another active vacancy on the careers portal. |
| `ERR_UNAUTHORIZED` | `401 Unauthorized` | System | Accessing internal API without authenticated session. | `{ "error": "ERR_UNAUTHORIZED", "detail": "Session token missing" }` | "Your session has expired. Please log in again to continue." | Log in via `/login` and refresh session credentials. |

---

## 4. Executable Gherkin BDD Acceptance Criteria

### Scenario 1: Preventing Unqualified Hiring without Scorecard (BRL-06)
```gherkin
Feature: Hiring Gate Enforcement
  As a Hiring Manager
  I want the system to enforce scorecard completion before hiring
  So that all hiring decisions are backed by documented technical evaluations

  Scenario: Attempting to hire a candidate without an evaluation scorecard
    Given a candidate application exists in "INTERVIEW" stage with ID 101
    And no evaluation scorecard has been submitted for application 101
    When the Hiring Manager attempts to move the candidate to "HIRED"
    Then the system rejects the request with HTTP status 422
    And the response error code is "ERR_MISSING_SCORECARD"
    And the application stage remains "INTERVIEW"
    And an alert displays "Cannot hire candidate. Please complete at least one evaluation Scorecard first."

  Scenario: Successfully hiring a candidate with completed scorecard
    Given a candidate application exists in "INTERVIEW" stage with ID 102
    And a valid scorecard exists with technical score 4, communication 5, and culture 4
    When the Hiring Manager moves the candidate to "HIRED"
    Then the system accepts the request with HTTP status 200
    And the application stage transitions to "HIRED"
    And an audit log record is created with action "STAGE_CHANGE" and toStage "HIRED"
```

### Scenario 2: Enforcing Mandatory Rejection Reason & 12-Hour Delay Buffer (BRL-05 & BRL-11)
```gherkin
Feature: Candidate Rejection Governance
  As an HR Recruiter
  I want to provide structured rejection feedback and buffer notification dispatch
  So that candidate analytics remain accurate and candidate experience is protected

  Scenario: Rejecting a candidate without providing a reason
    Given a candidate application is in "SCREENING" stage
    When the recruiter drags the card to "REJECTED" without selecting a reason
    Then the system blocks the transition with HTTP status 422
    And the error code returned is "ERR_MANDATORY_REJECTION_REASON"
    And the card returns to "SCREENING" column

  Scenario: Rejecting a candidate with valid reason buffers notification for 12 hours
    Given a candidate application is in "SCREENING" stage
    When the recruiter selects rejection reason "Underqualified for senior level"
    And confirms the transition to "REJECTED"
    Then the system updates stage to "REJECTED"
    And sets "emailScheduledAt" to current time plus 12 hours
    And "isEmailSent" remains false
    And dispatches a delayed buffer task to the automation queue
```

### Scenario 3: Candidate Deduplication within 30 Days (BRL-02)
```gherkin
Feature: Automated Intake Deduplication
  As the ATS Platform
  I want to detect duplicate candidate submissions within 30 days
  So that recruiters do not waste time reviewing duplicate profiles

  Scenario: Candidate reapplies to the same job within 14 days
    Given an existing candidate with email "dev@example.com" applied for Job "Frontend Lead" 14 days ago
    When a new application is submitted with email "dev@example.com" for Job "Frontend Lead"
    Then the system detects the existing candidate record
    And associates the new application with the existing candidate profile
    And flags a duplicate warning badge on the application card
    And does not create a redundant candidate entity in the database
```
