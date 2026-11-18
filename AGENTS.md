# AGENTS.md — ReCoverX Career (ATS)

> Standard Operating Instructions for AI Agents (Google Antigravity, Gemini, Codex, Claude Code).

## 1. Project Overview & Identity
- **Project Name:** ReCoverX Career — Applicant Tracking System (ATS)
- **Primary Objective:** Build an AI-driven, full-stack recruitment management platform that automates CV intake, AI parsing, matching against Job Descriptions (JDs), Kanban tracking, and candidate scorecard evaluations.
- **Root Directory:** `D:\ATS project`

## 2. Architecture & Tech Stack
- **Fullstack Framework:** Next.js 14+ (App Router) + TypeScript
- **Styling & Components:** Tailwind CSS + Lucide React + shadcn/ui component patterns
- **Drag-and-Drop Pipeline:** `@hello-pangea/dnd` (5-stage Kanban board)
- **Database & ORM:** Prisma ORM (SQLite for local dev `file:./dev.db`, PostgreSQL for production)
- **AI Engine:** Google Gemini API (`@google/genai`) for CV parsing & candidate match scoring
- **File Parsing:** `pdf-parse` for CV text extraction

## 3. Ground Truth Documents (Universal BA Standard)
When generating code, schema, API endpoints, or UI layouts, AI agents MUST strictly reference documents in `docs/` (all governed by `Universal_BA_Toolkit` standards):
- `docs/00_BA_Documentation_Index_and_RTM.md` — Master BA Index, Bi-directional RTM & Doc-Drift Report
- `docs/02_BRD_Updated_Full.md` — Business Requirements Document (SMART Objectives, ROI, AS-IS/TO-BE)
- `docs/03_BPMN_As_Is_and_To_Be.md` — As-Is and To-Be BPMN 2.0 processes (Human-in-the-loop)
- `docs/04_FDD_and_Use_Case_List.md` — Functional decomposition (`FR-[MOD]-[FEAT]-[SEQ]`) & Use Cases
- `docs/05_Use_Case_Specifications.md` — Alistair Cockburn 12-part Use Case Specifications
- `docs/06_Dynamic_Models_Activity_Sequence_State.md` — Finite State Machine & State Transition Guards
- `docs/07_Database_Design_ERD.md` — 10-column Data Dictionary (with PII/Masking) & ERD
- `docs/08_NonFunctional_and_Permissions.md` — 4-tier Actor Taxonomy, RBAC Matrix & ISO 25010 NFRs
- `docs/10_Scope_and_System_Comparison.md` — Scope boundary (In/Out-of-Scope) & Benchmark comparison
- `docs/12_Hybrid_AI_Architecture_and_Scoring_Engine.md` — Hybrid AI Architecture & 5-Core-Field Extraction Rule
- `docs/15_API_Specifications_and_Error_Codes.md` — REST API Contracts & System Error Codes
- `docs/16_SDD_Prompt_Playbook.md` — Spec-Driven Development Prompt Playbook
- `docs/17_Business_Rules_and_Error_Matrix.md` — 3-Clause Business Rules (`WHEN/THEN/UNLESS`), 7-Column Error Matrix & Gherkin BDD AC

## 4. Specialized Rules & BA Skills Directory
AI agents must consult modular rules located in `.agents/rules/` and BA skills in `.agents/skills/`:
- `.agents/rules/ba-documentation-standards.md`: Universal BA Toolkit 19 Documentation Standards (YAML Frontmatter, SemVer, Cockburn UC, Gherkin BDD, 10-col Data Dictionary, RTM, Anti-Ambiguity)
- `.agents/rules/business-ats.md`: Core Business Rules (`BRL-01` to `BRL-11`, State Machine & RBAC Stage Limits)
- `.agents/rules/nextjs-app-router.md`: Next.js 14 App Router & TypeScript conventions
- `.agents/rules/tailwind-shadcn.md`: UI styling, layouts, Kanban, and Drawer design
- `.agents/rules/prisma-database.md`: Database schema, Prisma client singleton, and queries
- `.agents/skills/`: 19 installed BA skills (`brd`, `srs`, `usecase`, `bpmn`, `state`, `erd`, `api-doc`, `doc-drift`, `ac`, `test-cases`, `cr`, etc.) + `.agents/ba-templates/`

## 5. Standard Commands
- Install dependencies: `npm install`
- Local dev server: `npm run dev` (Runs at `http://localhost:3000`)
- Database synchronization: `npx prisma db push`
- Database Studio viewer: `npx prisma studio`
- Seed database: `npx ts-node prisma/seed.ts` (or `node prisma/seed.js`)
