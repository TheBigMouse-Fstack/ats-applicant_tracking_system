# AGENTS.md — ATS — Applicant Tracking System

> Standard Operating Instructions for AI Agents (Google Antigravity, Gemini, Codex, Claude Code).

## 1. Project Overview & Identity
- **Project Name (Internal System):** ATS — Applicant Tracking System
- **Simulated Company (Public Careers Portal only):** RecoverX (`/`, `/jobs`, `/jobs/tracker`)
- **Primary Objective:** Build an AI-assisted, full-stack recruitment management platform that automates CV intake, 5-core-field extraction, JD match scoring (3-tier Traffic-Light), role-based Operational Dashboard, 5-stage Kanban tracking, inline Scorecard evaluations, and Talent Pool management.
- **Root Directory:** `D:\ATS project`

## 2. Architecture & Tech Stack
- **Fullstack Framework:** Next.js 14+ (App Router) + TypeScript
- **Styling & Components:** Tailwind CSS + Lucide React + Flat Minimalist Enterprise UI (60-30-10 visual calm)
- **Drag-and-Drop Pipeline:** `@hello-pangea/dnd` (5-stage Kanban board)
- **Database & ORM:** Prisma ORM (SQLite for local dev `file:./dev.db`, PostgreSQL for production)
- **AI Engine:** Hybrid AI (Layer 1 local `pdf-parse`/`mammoth` + Heuristic NLP fallback; Layer 2 Google Gemini `@google/genai` `temperature: 0`)

## 3. Ground Truth Documents (2 Dedicated Folders)

### A. `docs/ba/` — Stakeholder & Business-Facing BA Documents (Non-Tech Language)
- `docs/ba/00_BA_Documentation_Index_and_RTM.md` — Master Index, Bi-directional RTM & Doc-Drift Report
- `docs/ba/02_BRD_Updated_Full.md` — Business Requirements Document (SMART Objectives, ROI, AS-IS/TO-BE)
- `docs/ba/03_BPMN_As_Is_and_To_Be.md` — As-Is and To-Be BPMN 2.0 processes
- `docs/ba/04_FDD_and_Use_Case_List.md` — Functional decomposition (`FR-[MOD]-[FEAT]-[SEQ]`) & Use Cases
- `docs/ba/05_Use_Case_Specifications.md` — Alistair Cockburn 12-part Use Case Specifications
- `docs/ba/06_Dynamic_Models_Activity_Sequence_State.md` — Finite State Machine & State Transition Guards
- `docs/ba/08_NonFunctional_and_Permissions.md` — Actor Taxonomy, RBAC Matrix & ISO 25010 Quality Requirements
- `docs/ba/10_Scope_and_System_Comparison.md` — Scope boundary & Benchmark comparison
- `docs/ba/11_UI_UX_Design_and_Form_Validation_Guidelines.md` — Enterprise UI/UX & Friendly End-User Validation
- `docs/ba/14_Scope_Expansion_and_Advanced_Features.md` — Scope expansion log
- `docs/ba/18_Brief_Compliance_and_Value_Added_Analysis.md` — Original Brief Compliance, Benchmark Clone & Hybrid AI Rationale
- `docs/ba/TEST_SCENARIOS_AND_UAT_GUIDE.md` — UAT Guide for Business Stakeholders

### B. `docs/dev-context/` — Technical & Coding Context (For AI Agents, Dev & QA)
- `docs/dev-context/07_Database_Design_ERD.md` — 10-column Data Dictionary (with PII/Masking) & ERD
- `docs/dev-context/09_Technical_Setup_and_Antigravity_Guide.md` — Environment Setup & Screen Registry
- `docs/dev-context/12_Hybrid_AI_Architecture_and_Scoring_Engine.md` — Hybrid AI Architecture, 5-Core-Field Rule & 3-Tier Match Score
- `docs/dev-context/13_System_Architecture_and_Technology_Stack.md` — Next.js Fullstack, Prisma & Security Architecture
- `docs/dev-context/15_API_Specifications_and_Error_Codes.md` — 16 REST API Contracts & System Error Codes
- `docs/dev-context/16_SDD_Prompt_Playbook.md` — Spec-Driven Development Prompt Playbook
- `docs/dev-context/17_Business_Rules_and_Error_Matrix.md` — 3-Clause Business Rules, 7-Column Error Matrix & Gherkin BDD AC

## 4. Specialized Rules & BA Skills Directory
- `.agents/rules/ba-documentation-standards.md`: Universal BA Toolkit 19 Documentation Standards
- `.agents/rules/business-ats.md`: Core Business Rules (`BRL-01` to `BRL-11`, State Machine & RBAC Stage Limits)
- `.agents/rules/nextjs-app-router.md`: Next.js 14 App Router & TypeScript conventions
- `.agents/rules/tailwind-shadcn.md`: UI styling, visual calm, Kanban, and Drawer design
- `.agents/rules/prisma-database.md`: Database schema, Prisma client singleton, and queries
- `.agents/skills/`: 19 installed BA skills + `.agents/ba-templates/`

## 5. Standard Commands
- Install dependencies: `npm install`
- Local dev server: `npm run dev` (Runs at `http://localhost:3000`)
- Type check: `npx tsc --noEmit`
- Automated test suite: `node tests/run-tests.js`
- Database synchronization: `npx prisma db push`
- Seed database: `npx ts-node prisma/seed.ts` (or `node prisma/seed.js`)
