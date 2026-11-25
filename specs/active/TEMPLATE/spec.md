# Feature Spec: [FEAT-ID] [Feature Title]

- **Status:** Draft | Approved | Implemented | Verified
- **Owner:** Business Analyst / Product Owner
- **Target Layer:** `src/server/dal/` | `src/server/ai/` | `src/server/workflows/` | `src/app/`

## 1. Objective & Out-of-Scope
- **Goal:** (1–2 sentences describing the business outcome)
- **Out-of-Scope:** (Explicit list of what MUST NOT be built in this slice)

## 2. Data Contract (Prisma + Zod)
- **Prisma Schema Changes:** (Exact fields, types, defaults, indexes)
- **Zod Input/Output Schemas:** (Exact field constraints)

## 3. Business Rules & RBAC
- **Rules (`BRL-XX`):**
- **RBAC Matrix:** (`ADMIN`, `HR`, `HIRING_MANAGER`, `Unauthenticated -> 401`)

## 4. State Machine & Edge Cases
- Valid transitions, empty states, duplicate submits, race conditions, failure fallbacks.

## 5. Error Matrix (VI & EN)
| HTTP | Code | End-User Message (VI) | End-User Message (EN) |
| :---: | :--- | :--- | :--- |

## 6. AI & Security Guardrails
- PII redaction, prompt injection defense, idempotency key, audit logging.

## 7. Acceptance Criteria (Gherkin)
```gherkin
Scenario: Happy path
  Given ...
  When ...
  Then ...
```
