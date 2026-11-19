---
id: "DIAG-01-BPMN-ASIS"
title: "AS-IS Legacy Recruitment Process Model (BPMN 2.0)"
type: "bpmn-process-diagram"
version: "2.1.0"
status: "approved"
owner: "ATS Enterprise Business Analysis & Architecture Team"
format: "OMG BPMN 2.0 XML + Mermaid Flowchart"
tools:
  - "bpmn.io (Web - Zero Install)"
  - "Camunda Modeler (Desktop Application)"
  - "Mermaid Live Editor"
last_updated: "2026-11-19"
language: "en-US"
---

# DIAGRAM 01: AS-IS MANUAL RECRUITMENT WORKFLOW (BPMN 2.0 OMG STANDARD)

> **Domain:** Talent Acquisition & Recruitment Operations  
> **Source XML Artifact:** [`docs/diagrams/01_as_is_recruitment_process_bpmn.bpmn`](file:///d:/ATS%20project/docs/diagrams/01_as_is_recruitment_process_bpmn.bpmn)  
> **Specification Standard:** OMG BPMN 2.0 (`xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"`)  
> **Documentation Standard:** Universal BA Toolkit (English Only Execution Standard).

---

## 1. Quick Export Guide (High-Resolution Vector SVG / PNG)

The companion XML file [`01_as_is_recruitment_process_bpmn.bpmn`](file:///d:/ATS%20project/docs/diagrams/01_as_is_recruitment_process_bpmn.bpmn) strictly complies with the Object Management Group (OMG) BPMN 2.0 standard and contains complete graphical layout elements (`BPMNDiagram`, `BPMNPlane`, `BPMNShape`, `BPMNEdge`).

### Option A: View & Export via bpmn.io (Instant Web Viewer - No Installation Required)
1. Open the official web modeler: **[https://demo.bpmn.io/new](https://demo.bpmn.io/new)**.
2. Drag and drop the file [`01_as_is_recruitment_process_bpmn.bpmn`](file:///d:/ATS%20project/docs/diagrams/01_as_is_recruitment_process_bpmn.bpmn) into the browser canvas (or click **Open BPMN diagram from your computer**).
3. The complete swimlane, tasks, gateways, and data stores will render immediately with precise alignment.
4. Click **Download SVG** at the bottom-left corner to export a crisp vector image for documents, or **Download PNG** for presentations.

### Option B: View & Export via Camunda Modeler (Desktop)
1. Launch **Camunda Modeler**.
2. Select `File -> Open File...` and choose `01_as_is_recruitment_process_bpmn.bpmn`.
3. Select `File -> Export -> Export as Image (SVG/PNG)`.

---

## 2. Visual Workflow Representation (Mermaid Flowchart)

```mermaid
flowchart TD
    %% START EVENT
    Start(["● Receive Candidate Applications via Email / Job Portals"]):::startEvent

    %% STEP 1 & 2
    T1["1. Download & Save CV to Local Computer Folder"]:::userTask
    T2["2. Read PDF CV & Manually Log Details into Excel"]:::userTask

    %% DATA STORES
    DB_Folder[("📁 Local Storage Directory<br>(Unindexed CV Files)")]:::dataStore
    DB_Excel[("📊 Recruitment Tracking<br>Excel Spreadsheet")]:::dataStore

    %% STEP 3: SCREENING
    T3["3. Manually Screen & Match CV against JD Requirements"]:::userTask
    GW1{"Profile meets<br>initial criteria?"}:::gateway

    %% REJECT AT CV STAGE
    T_RejCV["4A. Update Status to 'Rejected CV' in Excel"]:::userTask
    T_MailRej1["5A. Manually Draft & Send Rejection Email"]:::sendTask
    End_RejCV(["⦿ Closed: Disqualified at CV Screening"]):::endEvent

    %% INTERVIEW & EVALUATION
    T4["4B. Contact Candidate & Arrange Interview Schedule"]:::userTask
    T5["5B. Conduct Interview & Take Manual Evaluation Notes"]:::manualTask
    GW2{"Hiring assessment<br>result?"}:::gateway

    %% PASS / HIRED BRANCH
    T_Pass["6A. Update Status to 'Passed' in Excel"]:::userTask
    T_Offer["7A. Compose & Send Job Offer Letter via Email"]:::sendTask
    End_Pass(["⦿ Closed: Candidate Successfully Hired"]):::endPassEvent

    %% REJECT AFTER INTERVIEW BRANCH
    T_RejInt["6B. Update Status to 'Failed' in Excel"]:::userTask
    T_MailRej2["7B. Compose & Send Regret Email to Candidate"]:::sendTask
    End_RejInt(["⦿ Closed: Disqualified after Interview"]):::endEvent

    %% SEQUENCE FLOWS
    Start --> T1
    T1 --> T2
    T2 --> T3
    T3 --> GW1

    GW1 -- Does not meet criteria --> T_RejCV
    T_RejCV --> T_MailRej1
    T_MailRej1 --> End_RejCV

    GW1 -- Meets requirements --> T4
    T4 --> T5
    T5 --> GW2

    GW2 -- Passed Interview --> T_Pass
    T_Pass --> T_Offer
    T_Offer --> End_Pass

    GW2 -- Failed Interview --> T_RejInt
    T_RejInt --> T_MailRej2
    T_MailRej2 --> End_RejInt

    %% DATA ASSOCIATIONS
    T1 -. Save file .-> DB_Folder
    T2 -. Manually type rows .-> DB_Excel
    DB_Excel -. Lookup / Ctrl+F .-> T3
    T_RejCV -. Update status .-> DB_Excel
    T_Pass -. Update status .-> DB_Excel
    T_RejInt -. Update status .-> DB_Excel

    %% STYLING
    classDef startEvent fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px;
    classDef endEvent fill:#FFEBEE,stroke:#C62828,stroke-width:3px;
    classDef endPassEvent fill:#E8F5E9,stroke:#2E7D32,stroke-width:3px;
    classDef userTask fill:#E3F2FD,stroke:#1565C0,stroke-width:2px;
    classDef manualTask fill:#FFF3E0,stroke:#EF6C00,stroke-width:2px;
    classDef sendTask fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px;
    classDef gateway fill:#FFF9C4,stroke:#F57F17,stroke-width:2px;
    classDef dataStore fill:#ECEFF1,stroke:#455A64,stroke-width:2px;
```

---

## 3. Element Registry & Functional Specification

| Sequence | Element Name | BPMN 2.0 Element Type | Executing Actor | Operational Description & Pain Point |
| :---: | :--- | :--- | :--- | :--- |
| **01** | `Receive Candidate Applications` | `StartEvent` (None) | Candidate / External Channels | Applications arrive via fragmented channels (company inbox, TopCV, LinkedIn messages, personal referrals). |
| **02** | `1. Download & Save CV` | `UserTask` | Recruiter / HR Specialist | HR manually downloads attached files (`.pdf`, `.doc`) and renames/stores them in local folders. **Risk:** High file loss and duplication. |
| **03** | `Local Storage Directory` | `DataStoreReference` | Operating System File System | Unindexed local folder on the HR specialist's workstation. **Risk:** No centralized backup or access control. |
| **04** | `2. Read & Manually Log Data` | `UserTask` | Recruiter / HR Specialist | HR reads unstructured PDF files and re-types candidate Full Name, Phone, Email, and Experience into Excel. **Risk:** High transcription error rate (~15-20%). |
| **05** | `Recruitment Tracking Excel` | `DataStoreReference` | Microsoft Excel Spreadsheet | Shared or personal workbook. **Risk:** Merge conflicts, overwrites, lack of concurrency control, and zero audit trails. |
| **06** | `3. Screen & Match CV` | `UserTask` | Recruiter / HR Specialist | HR visually compares the candidate's resume with the Job Description or runs `Ctrl + F` queries across Excel rows. |
| **07** | `Profile meets initial criteria?` | `ExclusiveGateway` (XOR) | Recruiter / HR Specialist | Decision gate dividing qualified candidates from disqualified applications. |
| **08** | `4A. Update Status to 'Rejected CV'` | `UserTask` | Recruiter / HR Specialist | HR locates the candidate row in the spreadsheet and manually types "Rejected CV" or changes cell color. |
| **09** | `5A. Send Rejection Email` | `SendTask` | Recruiter / HR Specialist | HR manually writes or copies an email template to notify the applicant. Often skipped due to workload, harming employer branding. |
| **10** | `Closed: Disqualified at CV Stage`| `EndEvent` (None) | Recruiter / HR Specialist | Process terminates for the disqualified applicant. Resume remains static in local storage without talent pooling. |
| **11** | `4B. Contact & Arrange Interview` | `UserTask` | Recruiter / HR Specialist | HR makes outbound telephone calls or exchanges multiple emails with the candidate to negotiate an interview slot. |
| **12** | `5B. Conduct Interview & Evaluate` | `ManualTask` | Interview Board (HR & Lead) | Interviewers ask questions and record handwritten notes or print out paper forms. No structured competency rubrics. |
| **13** | `Hiring assessment result?` | `ExclusiveGateway` (XOR) | Interview Board | Decision gate evaluating candidate suitability based on subjective consensus. |
| **14** | `6A. Update Status to 'Passed'` | `UserTask` | Recruiter / HR Specialist | HR manually records the "Passed" status in the tracking spreadsheet. |
| **15** | `7A. Compose & Send Offer Letter` | `SendTask` | Recruiter / HR Specialist | HR prepares a job offer letter in Word, converts to PDF, and emails it to the candidate. |
| **16** | `Closed: Candidate Successfully Hired`| `EndEvent` (None) | Recruiter / HR Specialist | Final success milestone; data handover to Payroll/Onboarding is handled manually. |
| **17** | `6B. Update Status to 'Failed'` | `UserTask` | Recruiter / HR Specialist | HR marks the row as "Failed Interview" in the Excel spreadsheet. |
| **18** | `7B. Send Regret Email` | `SendTask` | Recruiter / HR Specialist | HR sends a rejection notification via Outlook/Gmail. |
| **19** | `Closed: Disqualified after Interview`| `EndEvent` (None) | Recruiter / HR Specialist | Process closure without structured re-pooling for future hiring cycles. |

---

## 4. Key AS-IS Bottlenecks & Strategic Rationale for To-Be ATS

```mermaid
mindmap
  root((AS-IS Inefficiencies))
    Manual Transcription
      ::icon(fa fa-keyboard)
      Manual typing from PDF to Excel
      15-20 minutes wasted per candidate
      Frequent typos in phone numbers and emails
    Zero Deduplication
      ::icon(fa fa-copy)
      Duplicate applications across multiple channels
      No automatic cross-job duplicate detection
    Fragmented Communication
      ::icon(fa fa-envelope)
      Scattered emails across personal inboxes
      Candidates left unnotified (Black hole syndrome)
    Subjective Evaluation
      ::icon(fa fa-gavel)
      Unstructured paper notes
      No weighted evaluation criteria
      Lack of compliance audit trail
```

1. **Labor-Intensive Manual Data Entry:** Over 60% of recruiter time is spent on non-value-adding manual entry (downloading PDFs, copy-pasting contacts).
2. **Lack of Automated Screening:** Zero algorithmic matching against Job Descriptions; reliance on manual keyword searches leads to high false-negative rates.
3. **No Centralized Collaboration:** Hiring Managers receive CVs via forwarded emails, leading to disjointed feedback and scheduling delays.
4. **No Lifecycle Data Governance:** Disqualified resumes rot in forgotten desktop folders instead of being indexed in an active, searchable Talent Pool.
