# AGENTS.md — ATS (Applicant Tracking System)

> Single Source of Truth for AI Coding Agents. Keep under 100 lines.

## 1. Identity & Tech Stack
- **Internal System:** ATS — Applicant Tracking System *(Public Careers Portal: RecoverX — `/`, `/jobs`, `/jobs/tracker`)*
- **Stack:** Next.js 14.2.x (App Router, React 18) + TypeScript + Tailwind CSS + Prisma ORM (Neon PostgreSQL)
- **AI Engine:** Hybrid Layer 1 (`pdf-parse` + `mammoth` + Heuristic) & Layer 2 (Google Gemini `temperature: 0`, unified **60% Skills + 40% Experience**).
- **Pipeline:** 6 stages (`NEW ➔ SCREENING ➔ INTERVIEW ➔ OFFER ➔ HIRED / REJECTED`) via `@hello-pangea/dnd`.

## 2. Core Business Rules (Immutable)
- **Auth & Security:** Every internal API route MUST call `getSessionUser()` + role check. NEVER accept unsigned cookies, plaintext passwords, or fallback unauthenticated users.
- **PII & AI Safety:** NEVER send raw unredacted PII to LLMs in new AI modules; NEVER store real candidate CVs in `public/` or Git; NEVER auto-reject candidates by AI (Human-in-the-Loop only).
- **RBAC Stage Limits:** `HR` manages `NEW ↔ SCREENING` + 5-core-field edits + `OFFER ➔ HIRED/REJECTED`; `HIRING_MANAGER` manages `SCREENING ➔ INTERVIEW ➔ OFFER ➔ HIRED`; `ADMIN` has full access.
- **Stage Gates:** `BRL-06` requires ≥1 passing Scorecard (`HIRE` / `STRONG_HIRE`) before `OFFER` and `HIRED`; `BRL-11` requires rejection reason (≥5 chars); `BRL-15` enforces Blind Scorecard at API layer; `BRL-16` Knock-out Questions (soft flag); `BRL-17` Requisition Approval (`DRAFT ➔ PENDING_APPROVAL ➔ ACTIVE ➔ CLOSED`).
- **UI/UX (ELCA Swiss Minimalist):** Crimson `#D92027` accent, neutral surfaces, colored text over bordered pills, zero decorative icons on headings/labels, zero raw technical enums (`BRL-*`, `INTERVIEW_SCHEDULED_*`) on end-user UI, 100% VI/EN bilingual.

## 3. Single Source of Truth (Context Boundaries)
- **Active Feature Specs:** `specs/constitution.md` & `specs/active/<feature-id>/` (`spec.md`, `sprint-contract.json`).
- **Living Docs:** `docs/ba/` (Stakeholder) & `docs/dev-context/` (Technical). Ignore `docs/master/`, `docs/specs/`, `docs/exports/`.
- **Core Workspace Skills (8):** `srs`, `brd`, `erd`, `state`, `api-design`, `doc-drift`, `gap`, `unslop`.

## 4. Mandatory Verification Gate (Before Reporting Done)
1. `npx tsc --noEmit` (0 errors)
2. `node tests/run-tests.js` (100% pass)
3. Deploy live updates via `npx vercel deploy --prod -y` (GitHub push alone does not trigger prod).
