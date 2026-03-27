# Frontend Permissions Update (Dual-Duty Teachers)

This document explains the safe frontend changes after backend permission updates for users who can be both class teachers and subject teachers by assignment.

## What changed in backend

- Assessment endpoints now allow `CLASS_TEACHER` **if** the user has active teaching assignments.
- `/api/v1/auth/me` now returns additional permission flags:
  - `permissions.hasTeachingAssignments` (boolean)
  - `permissions.activeTeachingAssignments` (number)
  - `permissions.canUseAssessments` (boolean)

## Endpoints affected

These endpoints now accept both `SUBJECT_TEACHER` and `CLASS_TEACHER` (assignment-driven):

- `GET /api/v1/teaching-contexts`
- `GET /api/v1/score-sheets`
- `PUT /api/v1/score-sheets`
- `POST /api/v1/submissions`
- `GET /api/v1/student-counts`

No URL changes were made.

---

## Frontend migration steps

### 1) Update menu guards

Use `/api/v1/auth/me` permission flags instead of role-only checks:

- Show assessment menu when `permissions.canUseAssessments === true`.
- Keep class-result menu logic based on existing class-teacher/leadership checks.

### 2) Keep existing pages and API calls

- Do not change route paths or request payloads.
- Existing assessment pages continue to work, now with broader access for dual-duty users.

### 3) Handle empty assignment state

For users where `canUseAssessments === true` but no data returned, show:

- "No active teaching assignment for this term/class."

This avoids confusing blank screens.

---

## Backward compatibility

- Existing `SUBJECT_TEACHER` behavior remains unchanged.
- Existing `CLASS_TEACHER` report/result flows remain unchanged.
- No breaking response contract changes; only additive fields on `/auth/me`.

---

## Suggested frontend pseudo-logic

```ts
const me = await api.get("/api/v1/auth/me");

const canUseAssessments = me.permissions?.canUseAssessments === true;
const canUseClassResults =
  me.user?.role === "CLASS_TEACHER" ||
  me.user?.role === "HEADTEACHER" ||
  me.user?.role === "PRINCIPAL" ||
  me.user?.role === "ADMIN" ||
  me.user?.role === "SUPER_ADMIN";
```

Use `canUseAssessments` for assessment navigation and route guards.
