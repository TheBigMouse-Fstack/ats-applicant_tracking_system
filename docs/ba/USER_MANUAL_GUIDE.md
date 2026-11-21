---
id: "DOC-USER-MANUAL"
title: "ATS Comprehensive User Manual & Role-Based Operational Guide"
type: "user-guide"
version: "2.3.0"
status: "approved"
owner: "ATS Customer Success & Operations Training Team"
language: "en-US"
last_updated: "2026-11-21"
---

# ATS (APPLICANT TRACKING SYSTEM) — COMPREHENSIVE USER MANUAL

> **Platform:** Next-Generation AI-Assisted Recruitment Management System  
> **Document Code:** `DOC-USER-MANUAL-v2.3`  
> **Standard:** ISO/IEC/IEEE 26512 (Software User Documentation Standards)  
> **Target Audience:** Candidates, HR Recruiters, Hiring Managers, and System Administrators.

---

## 1. System Navigation & Role-Based Overview

The ATS platform is engineered to streamline end-to-end talent acquisition through role-based access control (RBAC), intelligent workflow automation, and real-time candidate pipeline tracking.

### 1.1 User Persona Taxonomy
| Role Name | Access Scope | Primary Screen Routes | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Candidate** | Public (Unauthenticated) | `/jobs`, `/jobs/[id]`, `/jobs/tracker` | Search vacancies, upload CV, auto-fill forms, track application milestones. |
| **HR Recruiter** | Internal Operator | `/admin/pipeline`, `/admin/candidates`, `/admin/talent-pool` | Sift new applicants (`NEW ➔ SCREENING`), edit 5 CV fields, manage Talent Pool. |
| **Hiring Manager** | Department Evaluator | `/admin/pipeline`, `/admin/jobs` | Advance candidates (`SCREENING ➔ INTERVIEW ➔ HIRED`), schedule sessions, submit Scorecards. |
| **System Administrator** | Governance & Security | `/admin/dashboard`, `/admin/users`, `/admin/jobs` | Manage user credentials, assign RBAC permissions, configure headcount quotas (`BRL-12/13`). |

### 1.2 Quick Role Switcher (Demo & Showcase)
For evaluation, testing, and portfolio reviews, a floating **Demo Role Bar** is mounted at the bottom of the administration interface. 
- Click **"HR Recruiter"** to inspect top-of-funnel resume screening and 5-field editing.
- Click **"Hiring Manager"** to test interview scheduling, weighted Scorecards, and final hiring gatekeepers.
- Click **"Administrator"** to access the 360° analytics dashboard, job quota configurations, and audit logs.

---

## 2. Candidate Guide (Public Careers Portal)

### 2.1 Exploring Vacancies (`/jobs`)
1. Navigate to the public careers portal at `https://ats-applicant-tracking-system.vercel.app/jobs`.
2. Browse active job openings. Filters allow searching by department (Engineering, Product, Marketing), employment type (Full-time, Contract), or office location.
3. Click on any job card to view detailed responsibilities, required technical skills, minimum experience years, and employee benefits.

### 2.2 Submitting an Application & Auto-Fill Resume Parsing (`/jobs/[id]`)
1. Click **"Apply for this Position"** on the job details screen.
2. **One-Click Sample CV (For Evaluators):** Click **"Fill Sample CV"** to instantly load the certified Senior Frontend Engineer resume (`sample-cv.pdf`).
3. **Manual Upload:** Drag and drop your resume file (.pdf or .docx format, maximum 5MB).
   - *Security Guard:* Binary magic bytes (`%PDF` or `PK`) are inspected immediately to prevent malicious script execution (`BRL-01`).
4. **Auto-Fill Acceleration:** The system automatically extracts your Full Name, Email, Phone Number, and key technical skills in sub-second time.
5. Review the auto-filled fields. You may update any field if your resume formatting caused a parsing variance.
6. Click **"Submit Application"**.
   - *Application Rate Limit:* Candidates are restricted to a maximum of 3 applications within any 90-day window (`BRL-04`).
   - *Deduplication Protection:* Submitting duplicate applications for the same position within 30 days is automatically merged and flagged (`BRL-02`).

### 2.3 Real-Time Application Tracking (`/jobs/tracker`)
1. Navigate to `/jobs/tracker`.
2. Enter your registered **Email Address** and **Application Tracking Token** (provided on successful submission).
3. The interactive milestone tracker displays your live progress across 5 stages:
   - `Application Received` ➔ `Profile Screening` ➔ `Interview Scheduled` ➔ `Final Decision`.
4. *Confidentiality Guarantee:* Candidates view friendly milestone timelines; internal evaluation notes, reviewer scores, and interview rubrics remain strictly confidential.

---

## 3. HR Recruiter Guide (Operational Intake & Kanban Management)

### 3.1 Reviewing Top-of-Funnel Intake (`/admin/pipeline` - `NEW` Column)
1. Log in as an **HR Recruiter** or use the 1-click role switcher at `/admin/login`.
2. Navigate to the **Pipeline** board. All newly submitted applications appear in the `NEW` column.
3. **Instant 0ms In-Memory Filtering:** Use the search bar to filter candidates by keyword, score tier (Green ≥75%, Yellow 50–74%, Red <50%), or star status with zero latency and zero skeleton flicker.
4. **SLA Breach Warnings:** Any card remaining in `NEW` for > 48 hours is highlighted with an orange SLA breach indicator (`BRL-07`).

### 3.2 Inspecting Profiles & Editing 5 Core CV Fields
1. Click on any candidate card to slide out the **Candidate Detail Drawer**.
2. **Review Extracted Data:** Verify the 5 core fields extracted by Hybrid AI: Full Name, Email, Phone Number, Experience Years, and Technical Skills.
3. **Source of Truth & Mismatch Warning (`BRL-12`):** If the candidate typed different contact details into the form compared to the CV document, a soft warning badge (`MINOR` or `CRITICAL` mismatch) is displayed.
4. **Manual Correction:** Click **"Edit 5 Core Fields"** to adjust parsing inaccuracies. Changes are immediately saved and logged in the immutable audit trail.
5. **Secure Resume Preview:** Click **"View Original Resume"** to stream the authentic PDF/DOCX via the authenticated storage proxy.

### 3.3 Advancing to Screening or Disqualifying Candidates
- **Advance Candidate:** Drag and drop the card from `NEW` to `SCREENING`.
  - *RBAC Stage Limit:* HR Recruiters are authorized to advance cards up to `SCREENING`. Moving cards to `INTERVIEW` or `HIRED` requires department expertise and is restricted to Hiring Managers.
- **Reject Candidate (`BRL-11` & `BRL-05`):**
  1. Drag the card to the `REJECTED` column.
  2. A mandatory modal requires selecting a structured rejection reason:
     - *Overqualified*, *Experience Mismatch*, *Skill Gap*, *Salary Expectation*, or *Location Incompatible*.
  3. **12-Hour Brand Courtesy Buffer:** Rejection notices are not dispatched immediately. The system places the email into an automated 12-hour holding queue to protect employer brand sentiment (`BRL-05`). If an accidental rejection is reverted within 12 hours, the email is automatically aborted.

---

## 4. Hiring Manager Guide (Interviews & Evaluated Hiring)

### 4.1 Technical Review & Advancing to Interview (`SCREENING ➔ INTERVIEW`)
1. Log in as a **Hiring Manager**.
2. Inspect candidates residing in the `SCREENING` column who have been qualified by HR.
3. Drag the card into the `INTERVIEW` column.
4. **Concurrent Interview Ceiling Check (`BRL-13`):** The system verifies that the number of active interviewees does not exceed `3 * remainingHeadcount`. If the ceiling is reached, a soft confirmation dialog prompts the manager before continuing.

### 4.2 Scheduling Interview Sessions & Automated Invites
1. Open the Candidate Detail Drawer and click **"Schedule Interview"**.
2. Select the **Interview Date & Time**, **Format** (Online via Google Meet or In-person Offline), and **Location/Meeting Room**.
3. Choose the dispatch mode:
   - **Automated n8n Webhook:** Automatically synchronizes the event with Google Calendar, creates a unique Google Meet video link, and dispatches an invitation email to candidate and interviewer.
   - **Custom Manual Email:** Allows the manager to draft a personalized briefing message before sending.
4. Click **"Confirm & Dispatch"**. The card badge updates to show the scheduled interview timestamp.

### 4.3 Submitting Structured Weighted Scorecards (`BRL-08`)
1. Following the interview session, click **"Open Scorecard"** on the candidate drawer.
2. Rate the candidate across 3 standardized criteria (scale 1 to 5 stars):
   - **Technical Competence (40% Weight):** Domain expertise, architecture depth, problem-solving.
   - **Communication & Teamwork (30% Weight):** Clarity, collaboration, stakeholder presentation.
   - **Culture Fit & Values (30% Weight):** Work ethic, leadership alignment, ownership mindset.
3. The platform computes the **Weighted Aggregate Score** automatically:
   $$\text{Final Score} = (\text{Tech} \times 0.40) + (\text{Comm} \times 0.30) + (\text{Culture} \times 0.30)$$
4. Select a hiring recommendation: `Strong Hire`, `Hire`, `No Hire`, or `Strong No Hire`.
5. Enter qualitative strengths, weaknesses, and rationale notes. Click **"Save Scorecard"**.

### 4.4 Final Hiring Approval & Job Auto-Closure (`BRL-06` & `BRL-13`)
1. Drag the candidate card from `INTERVIEW` into the `HIRED` column.
2. **Stage Gatekeeper Enforcement (`BRL-06`):** The system verifies that at least one valid completed Scorecard exists. Attempting to hire a candidate without a documented Scorecard is strictly blocked with an explanatory error alert.
3. **Headcount Fulfillment & Job Closure (`BRL-13`):** When the number of hired candidates reaches the approved job headcount, the job requisition automatically transitions to `CLOSED`, and external applications are shut down.

---

## 5. System Administrator Guide (Governance & CRM)

### 5.1 Executive 360° Analytics Dashboard (`/admin/dashboard`)
1. Log in as a **System Administrator**.
2. Inspect high-level organizational recruitment metrics:
   - **Active Headcount vs. Hired:** Real-time quota fulfillment tracking across departments.
   - **Pipeline Stage Distribution:** Visual breakdown of candidates across New, Screening, Interview, Hired, and Rejected.
   - **Average Time-to-Hire:** Velocity metric measuring application submission to final hire acceptance.
   - **SLA Breach Warnings:** Alerts identifying candidates stranded beyond SLA thresholds.

### 5.2 User Account Administration & RBAC Scoping (`/admin/users`)
1. Navigate to `/admin/users`.
2. Click **"Create User"** to provision a new staff member.
3. Enter Full Name, Corporate Email, and select the designated RBAC role:
   - `ADMIN`: Full access to settings, user management, and exports.
   - `HR`: Management of jobs, applicant intake, and Talent Pool.
   - `HIRING_MANAGER`: Technical screening, interview scheduling, and Scorecards.
4. Deactivate departed personnel instantly via the **"Deactivate Account"** toggle.

### 5.3 Configuring Job Requisitions & Quotas (`/admin/jobs`)
1. Navigate to `/admin/jobs`.
2. Click **"Create New Job Opening"**.
3. Fill in Job Title, Department, Work Location, Employment Type, and Job Description.
4. **Set Approved Headcount (`BRL-13`):** Define the exact number of personnel to hire.
5. **Set Interview Concurrency Limit:** Defaults to `3 * headcount` to maintain interviewer bandwidth.
6. Click **"Publish Job"**. The job becomes immediately visible on `/jobs`.

### 5.4 Talent Pool Management & 180-Day Lifecycle Retention (`/admin/talent-pool`)
1. Navigate to `/admin/talent-pool`.
2. Access disqualified but high-potential profiles organized into 3 operational tiers:
   - **Silver Medalists:** Strong candidates who passed interviews but lost to another finalist.
   - **Future Requisitions:** Candidates possessing valuable skills matching anticipated future openings.
   - **General Archive:** Disqualified applicants subject to data privacy retention limits.
3. **Re-Pooling Talent:** Click **"Re-pool into New Job"** to reassign a profile directly to a newly opened job requisition without requiring the candidate to re-apply.
4. **Data Privacy Automated Cleanup (`BRL-10`):** Candidate records exceeding the 180-day retention window are automatically flagged for permanent purging in compliance with GDPR and PDPA regulations.

---

## 6. Troubleshooting & Operational FAQ

| Symptom / Error | Probable Root Cause | Resolution Step |
| :--- | :--- | :--- |
| **"Upload Rejected: Unsupported File Type"** | File format is not standard PDF or DOCX, or magic bytes are missing (`BRL-01`). | Save the resume as a standard PDF in Word/Google Docs and upload again. Ensure file size is < 5MB. |
| **"Application Limit Exceeded (HTTP 429)"** | Candidate has submitted 3 applications within the past 90 days (`BRL-04`). | Inform candidate to wait until the 90-day window resets or email HR directly. |
| **"Cannot Move to Hired: Scorecard Missing"** | Hiring Manager attempted to drag candidate into `HIRED` without a scorecard (`BRL-06`). | Open candidate drawer, click **"Open Scorecard"**, complete the 3 criteria evaluation, then retry. |
| **"Permission Denied: HR Restricted"** | HR Recruiter attempted to drag candidate into `INTERVIEW` or `HIRED`. | Ask the designated Hiring Manager to log in and perform the stage promotion. |
| **"Google Calendar / Meet Link Failed"** | Local n8n automation engine is paused or webhook URL is misconfigured. | Ensure local n8n is running (`n8n start` on port 5678) or switch dispatch mode to `MANUAL_CUSTOM`. |
