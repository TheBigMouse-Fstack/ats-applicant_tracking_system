# ATS Product Constitution (Immutable Invariants)

> Read-only for AI Coding Agents. Only the human owner may edit these invariants.

1. **Auth & RBAC in DAL:** Every internal API Route and Server Action MUST verify session and role inside server-side code (`src/server/dal/` or `getSessionUser()`), never relying solely on Next.js Middleware.
2. **Zero Unsigned Cookies or Plaintext Passwords:** Session tokens MUST be cryptographically verified; passwords MUST use salted hashing (PBKDF2 / Better Auth).
3. **Human-in-the-Loop Recruitment:** AI NEVER automatically rejects or hires a candidate. AI produces transparent criteria/match insights; humans make every stage transition decision.
4. **PII Protection Before LLM:** New/upgraded AI modules MUST scrub candidate PII (email, phone, national ID, form name) and sanitize untrusted CV boundaries before calling external LLM APIs.
5. **Zero Real Candidate PII in Git or `public/`:** All test fixtures, sample CVs, and eval datasets MUST be 100% synthetic.
6. **6-Stage State Machine Integrity:** Applications follow `NEW ➔ SCREENING ➔ INTERVIEW ➔ OFFER ➔ HIRED / REJECTED`. `HIRED` is terminal.
7. **Scorecard Stage Gate (`BRL-06`):** Moving to `OFFER` or `HIRED` requires ≥1 passing Scorecard (`HIRE` or `STRONG_HIRE`).
8. **Blind Scorecard (`BRL-15`):** Evaluators (`HR`, `HIRING_MANAGER`) cannot read peer evaluations via API or UI until they submit their own.
9. **Mandatory Rejection Reason (`BRL-11`):** Moving to `REJECTED` requires a human-provided reason (≥5 characters).
10. **Requisition Approval (`BRL-17`):** HR-created jobs enter `PENDING_APPROVAL` and require `HIRING_MANAGER` or `ADMIN` approval before becoming `ACTIVE` on the public careers portal.
11. **Zero Technical Codes on End-User UI:** Never display `BRL-*`, `NFR-*`, `RBAC`, or raw enum strings (`INTERVIEW_SCHEDULED_*`) on end-user screens. All screens must be 100% VI/EN bilingual.
12. **Deterministic Verification Gate:** No feature is done until `npx tsc --noEmit`, `node tests/run-tests.js`, and independent QA verification pass with 0 P0/P1 issues.
