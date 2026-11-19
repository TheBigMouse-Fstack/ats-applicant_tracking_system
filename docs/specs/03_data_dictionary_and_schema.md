---
id: "SPEC-03-DATA-DICT"
title: "ATS Enterprise Data Dictionary & PII Security Governance"
type: "technical-specification"
version: "2.1.0"
status: "approved"
owner: "ATS Enterprise Business Analysis & Architecture Team"
language: "en-US"
last_updated: "2026-11-19"
---

# SPECIFICATION 03: ENTERPRISE DATA DICTIONARY & PII SECURITY GOVERNANCE

> **Scope:** Relational Database Schema & Data Protection Governance  
> **Documentation Standard:** 10-Column Data Dictionary & GDPR / ISO 27001 Masking Standards (English Only).

---

## 1. Data Architecture & Physical Design Guidelines

The ATS database layer is fully normalized to Third Normal Form (3NF) to ensure transactional integrity, auditability, and zero data anomalies.
- **Engines Supported:** PostgreSQL 15+ (Production via Neon Lakebase) / SQLite 3 (Local Development via `dev.db`).
- **ORM:** Prisma Client with singleton connection lifecycle.
- **Naming Conventions:** Lower snake_case for physical columns (`@@map`), PascalCase for TypeScript models.

---

## 2. Standard 10-Column Enterprise Data Dictionary

| # | Entity (Table) | Column Name | Physical Type | Nullable | Key Type | Default Value | Business Definition & Description | Business Rule Link | PII / Masking Standard |
| :-: | :--- | :--- | :--- | :-: | :-: | :--- | :--- | :--- | :--- |
| **1** | `users` | `id` | `INTEGER` | NO | PK | Autoincrement | Unique internal user identifier. | — | None |
| **2** | `users` | `full_name` | `VARCHAR(100)`| NO | — | — | Full legal name of staff member. | — | Internal Staff PII |
| **3** | `users` | `email` | `VARCHAR(150)`| NO | UK | — | Corporate login email address. | `BRL-07` | Unmasked for staff |
| **4** | `users` | `password_hash`| `VARCHAR(255)`| NO | — | — | BCrypt password hash (cost factor ≥ 10). | Security | Critical Credential (Never returned) |
| **5** | `users` | `role` | `VARCHAR(20)` | NO | — | `'HR'` | Authorization role (`ADMIN`, `HR`, `HIRING_MANAGER`). | `BRL-07` | None |
| **6** | `users` | `is_active` | `BOOLEAN` | NO | — | `TRUE` | Soft deletion status indicator. | Security | None |
| **7** | `users` | `created_at` | `TIMESTAMP` | NO | — | `CURRENT_TIMESTAMP` | Account provisioning timestamp. | — | None |
| **8** | `jobs` | `id` | `INTEGER` | NO | PK | Autoincrement | Unique job requisition opening identifier. | — | None |
| **9** | `jobs` | `creator_id` | `INTEGER` | NO | FK | — | Foreign key references `users.id`. | `BRL-07` | None |
| **10** | `jobs` | `title` | `VARCHAR(150)`| NO | — | — | Official title of recruitment opening. | — | None (Public) |
| **11** | `jobs` | `department` | `VARCHAR(100)`| NO | — | — | Sponsoring business department. | — | None (Public) |
| **12** | `jobs` | `location` | `VARCHAR(100)`| NO | — | `'Hồ Chí Minh'` | Physical office location or Remote status. | — | None (Public) |
| **13** | `jobs` | `employment_type`| `VARCHAR(50)`| NO | — | `'Toàn thời gian'`| Working arrangement (Full-time, Part-time). | — | None (Public) |
| **14** | `jobs` | `requirements_jd`| `TEXT` | NO | — | — | Full text job description and qualifications. | `BRL-09` | None (Public) |
| **15** | `jobs` | `min_experience_years`| `INTEGER` | NO | — | `0` | Minimum required years of domain experience. | `BRL-09` | None |
| **16** | `jobs` | `required_skills`| `TEXT (JSON)` | NO | — | `'[]'` | JSON array of mandatory skill keywords. | `BRL-09` | None |
| **17** | `jobs` | `target_headcount`| `INTEGER` | NO | — | `1` | Approved hiring quota positions. | `BRL-13` | None |
| **18** | `jobs` | `max_active_interviews`| `INTEGER`| NO | — | `3` | Maximum concurrent candidates in interview (`3 * target`). | `BRL-13` | None |
| **19** | `jobs` | `status` | `VARCHAR(20)` | NO | — | `'ACTIVE'` | Job lifecycle status (`ACTIVE`, `CLOSED`). | `BRL-13` | None |
| **20** | `jobs` | `created_at` | `TIMESTAMP` | NO | — | `CURRENT_TIMESTAMP` | Requisition creation timestamp. | — | None |
| **21** | `candidates` | `id` | `INTEGER` | NO | PK | Autoincrement | Unique master candidate profile identifier. | — | None |
| **22** | `candidates` | `full_name` | `VARCHAR(100)`| NO | — | — | Candidate full name from submission form. | `BRL-12` | Candidate PII |
| **23** | `candidates` | `email` | `VARCHAR(150)`| NO | UK (Comp)| — | Candidate primary contact email. | `BRL-02` | Direct PII (Masked in public exports) |
| **24** | `candidates` | `phone` | `VARCHAR(20)` | NO | UK (Comp)| — | Candidate primary contact phone number. | `BRL-02` | Direct PII (Masked: `+84 *** *** 888`) |
| **25** | `candidates` | `cv_extracted_name`| `VARCHAR(100)`| YES | — | `NULL` | Secondary candidate name extracted by AI parser. | `BRL-12` | Audit snapshot |
| **26** | `candidates` | `cv_extracted_email`| `VARCHAR(150)`| YES | — | `NULL` | Secondary contact email extracted by AI parser. | `BRL-12` | Audit snapshot |
| **27** | `candidates` | `cv_extracted_phone`| `VARCHAR(20)` | YES | — | `NULL` | Secondary phone extracted by AI parser. | `BRL-12` | Audit snapshot |
| **28** | `candidates` | `cv_file_hash` | `CHAR(64)` | YES | Index | `NULL` | SHA-256 binary hash of uploaded CV file. | `BRL-01` | Cryptographic hash |
| **29** | `candidates` | `experience_years`| `INTEGER` | NO | — | `0` | Calculated cumulative domain experience years. | `BRL-03` | None |
| **30** | `candidates` | `parsed_skills` | `TEXT (JSON)` | YES | — | `'[]'` | JSON array of technical competencies extracted from CV. | `BRL-03` | Professional data |
| **31** | `candidates` | `cv_file_url` | `VARCHAR(500)`| NO | — | — | Secure path or object storage URL for original CV. | Security | Sensitive Document (Signed access) |
| **32** | `candidates` | `cv_text` | `TEXT` | YES | — | `NULL` | Raw textual content extracted from PDF/DOCX. | `BRL-03` | Confidential text |
| **33** | `candidates` | `created_at` | `TIMESTAMP` | NO | — | `CURRENT_TIMESTAMP` | Candidate record initialization timestamp. | — | None |
| **34** | `applications` | `id` | `INTEGER` | NO | PK | Autoincrement | Unique job application transaction identifier. | — | None |
| **35** | `applications` | `candidate_id`| `INTEGER` | NO | FK | — | Foreign key references `candidates.id` (Cascade). | — | None |
| **36** | `applications` | `job_id` | `INTEGER` | NO | FK | — | Foreign key references `jobs.id` (Cascade). | — | None |
| **37** | `applications` | `source` | `VARCHAR(50)` | NO | — | `'CAREER_SITE'` | Ingestion channel (`CAREER_SITE`, `LINKEDIN`, etc.). | — | None |
| **38** | `applications` | `current_stage`| `VARCHAR(20)` | NO | Index | `'NEW'` | Kanban stage (`NEW`, `SCREENING`, `INTERVIEW`, `HIRED`, `REJECTED`). | `BRL-06` | None |
| **39** | `applications` | `ai_match_score`| `REAL` | YES | — | `NULL` | Semantic similarity rating (0.0% to 100.0%). | `BRL-09` | None |
| **40** | `applications` | `ai_match_rationale`| `TEXT` | YES | — | `NULL` | Natural language justification for AI match score. | `BRL-09` | None |
| **41** | `applications` | `stage_updated_at`| `TIMESTAMP` | NO | Index | `CURRENT_TIMESTAMP`| Timestamp of last stage transition. | `BRL-05` | None |
| **42** | `applications` | `email_scheduled_at`| `TIMESTAMP`| YES | Index | `NULL` | Scheduled timestamp for delayed rejection email. | `BRL-05` | Automation timestamp |
| **43** | `applications` | `is_email_sent`| `BOOLEAN` | NO | — | `FALSE` | Flag indicating outbound rejection email dispatch. | `BRL-05` | None |
| **44** | `applications` | `is_interview_invite_sent`| `BOOLEAN`| NO | Index | `FALSE` | Automated calendar and email invitation status flag. | N8N | None |
| **45** | `applications` | `is_telegram_notified`| `BOOLEAN`| NO | Index | `FALSE` | Team notification dispatch status flag. | N8N | None |
| **46** | `applications` | `rejection_reason`| `VARCHAR(255)`| YES | — | `NULL` | Mandatory structured rejection reason code. | `BRL-11` | Confidential feedback |
| **47** | `applications` | `contact_mismatch_level`| `VARCHAR(20)`| NO | — | `'NONE'` | Form vs CV discrepancy level (`NONE`, `MINOR`, `CRITICAL`). | `BRL-12` | None |
| **48** | `applications` | `created_at` | `TIMESTAMP` | NO | — | `CURRENT_TIMESTAMP` | Application submission timestamp. | — | None |
| **49** | `evaluations` | `id` | `INTEGER` | NO | PK | Autoincrement | Unique evaluation Scorecard identifier. | — | None |
| **50** | `evaluations` | `application_id`| `INTEGER` | NO | FK | — | Foreign key references `applications.id` (Cascade). | `BRL-06` | None |
| **51** | `evaluations` | `evaluator_id` | `INTEGER` | NO | FK | — | Foreign key references `users.id`. | `BRL-08` | None |
| **52** | `evaluations` | `technical_score`| `INTEGER` | NO | — | — | Technical rating integer (1 to 5, 40% weight). | `BRL-08` | None |
| **53** | `evaluations` | `communication_score`| `INTEGER`| NO | — | — | Communication rating integer (1 to 5, 30% weight). | `BRL-08` | None |
| **54** | `evaluations` | `cultural_fit_score`| `INTEGER`| NO | — | — | Cultural fit rating integer (1 to 5, 30% weight). | `BRL-08` | None |
| **55** | `evaluations` | `overall_score`| `REAL` | YES | — | `NULL` | Calculated weighted average score (1.00 to 5.00). | `BRL-08` | None |
| **56** | `evaluations` | `recommendation`| `VARCHAR(20)` | NO | — | `'HIRE'` | Recommendation (`STRONG_HIRE`, `HIRE`, `NO_HIRE`, etc.). | `BRL-08` | None |
| **57** | `evaluations` | `technical_notes`| `TEXT` | YES | — | `NULL` | In-depth evaluator notes on technical competence. | Confidential | RBAC Isolated |
| **58** | `evaluations` | `created_at` | `TIMESTAMP` | NO | — | `CURRENT_TIMESTAMP` | Scorecard submission timestamp. | — | None |
| **59** | `audit_logs` | `id` | `INTEGER` | NO | PK | Autoincrement | Unique audit log transaction identifier. | — | None |
| **60** | `audit_logs` | `application_id`| `INTEGER` | NO | FK | — | Foreign key references `applications.id` (Cascade). | Audit | None |
| **61** | `audit_logs` | `user_id` | `INTEGER` | YES | FK | `NULL` | Foreign key references `users.id` (Null for system). | Audit | None |
| **62** | `audit_logs` | `from_stage` | `VARCHAR(20)` | YES | — | `NULL` | Origin Kanban stage. | Audit | None |
| **63** | `audit_logs` | `to_stage` | `VARCHAR(20)` | NO | — | — | Destination Kanban stage. | Audit | None |
| **64** | `audit_logs` | `action` | `VARCHAR(50)` | NO | — | — | Action type (`STAGE_CHANGE`, `CV_UPLOAD`, etc.). | Audit | None |
| **65** | `audit_logs` | `reason` | `VARCHAR(255)`| YES | — | `NULL` | Audit reason or rejection justification text. | `BRL-11` | Plain Text Audit |
| **66** | `audit_logs` | `created_at` | `TIMESTAMP` | NO | Index | `CURRENT_TIMESTAMP`| Immutable audit event timestamp. | Audit | None |

---

## 3. PII Security & Data Protection Policies

1. **At-Rest & In-Transit Encryption:**
   - All relational tables are hosted on TLS-encrypted storage volumes. Direct database connections require SSL mode (`sslmode=require`).
2. **Access-Layer Masking (GDPR & Vietnam PDPA Compliance):**
   - Telephone numbers displayed on candidate list views are masked to conceal middle digits (e.g. `+84 *** *** 888`). Full unmasked contact information is accessible only within the authenticated Candidate Drawer view by assigned recruiters.
3. **Secure CV Storage & Expiring Links:**
   - Uploaded resume files are stored outside public web roots. File downloads are routed through an authenticated proxy endpoint (`/api/storage/file`) that validates session tokens before streaming binary data.
