# Backend & API Development Plan

This document outlines how to build the **Express.js** backend for the school academic platform: modules, API surface, role-based access (including **Principal** and **Headteacher** viewing **all students per class** with performance), integrations (**MongoDB**, **Supabase Storage**), and **packages to install**. It deliberately avoids **BullMQ** and **Redis**; use synchronous or **in-process** work, **database-backed** status, or **scheduled jobs** (e.g. `node-cron` on a single worker) only if you outgrow that.

---

## 1. Goals & constraints

| Goal | Approach |
|------|----------|
| Single source of truth for scores & aggregates | Store canonical results in MongoDB; compute aggregates in one place (service layer or aggregation pipelines). |
| Submission → aggregation → approval chain | Status fields on term/class/subject scope + middleware that enforces transitions. |
| Principal & Headteacher see **all classes**, **all students**, performance | RBAC: roles `PRINCIPAL`, `HEADTEACHER` bypass class scoping; dedicated read endpoints with filters (`sessionId`, `termId`, `classId`, pagination). |
| File storage | **Supabase Storage** (materials, CSV uploads temp, generated PDFs). |
| No Redis / BullMQ | No job queue; PDF generation can run **on request** (with timeout limits) or via a **simple cron** + flag in DB for “report generation in progress”. |

---

## 2. Assessment weights & grading (canonical)

These rules are the **single source of truth** for subject totals, letter grades, remarks, and pass/fail at subject level. Implement in one shared module (e.g. `grading.ts`) used by score submission, aggregation, and report cards.

### 2.1 Continuous assessment and exam weights

| Component | Max marks | Notes |
|-----------|-----------|--------|
| **Test 1** (CA) | 15 | First continuous assessment |
| **Test 2** (CA) | 15 | Second continuous assessment |
| **Exam** | 70 | Terminal exam |
| **Total** | **100** | Sum = percentage score for the subject (0–100) |

**Formula:** `totalPercent = test1 + test2 + exam` (each component capped at its max; validate on input).

Field names in API/DB can be `ca1`, `ca2`, `exam` or `test1`, `test2`, `exam`—keep consistent everywhere.

### 2.2 Grade bands (from percentage)

Percentage is **inclusive** on both ends of each band below. Use **integer percentage** after rounding unless you define otherwise (recommended: round `totalPercent` to **nearest integer** before mapping to grade, and document that once).

| Score (%) | Grade | Remark |
|-----------|-------|--------|
| 75 – 100 | A1 | Excellent |
| 70 – 74 | B2 | Very Good |
| 65 – 69 | B3 | Good |
| 60 – 64 | C4 | Credit |
| 55 – 59 | C5 | Credit |
| 50 – 54 | C6 | Credit |
| 45 – 49 | D7 | Pass |
| 40 – 44 | E8 | Pass |
| 0 – 39 | F9 | Fail |

### 2.3 Pass mark

- **Minimum pass for a subject (platform default):** grade **C6 or better** → **`totalPercent` ≥ 50** (C6 is the lowest “credit” band in this scale).
- **Below 50%** → D7, E8, or F9 → **`subjectPassed: false`** for aggregation and promotion, even though the **remark** column still says “Pass” for D7 and E8 (that label matches common WAEC-style wording; it does **not** override the C6 pass rule for your school workflow).
- **Promotion / principal rules** can still require “credit in English + Math” etc. later; this section only fixes the **default subject pass** threshold.

### 2.4 Implementation notes

- Store **raw component scores** and computed **`totalPercent`**, **`grade`**, **`remark`** on each subject result row so report cards do not re-derive differently than the API.
- **Boundary edge case:** if you ever allow decimal totals, define whether **74.5** rounds to 75 (A1) or truncates—**integer rounding rule** removes ambiguity.
- CSV import columns should align with **test1, test2, exam** (or your chosen names) and max validation **15, 15, 70**.

---

## 3. Recommended runtime layout

```
backend/
├── src/
│   ├── config/           # env, mongo, supabase clients
│   ├── middleware/       # auth, rbac, rate-limit, error handler, upload
│   ├── modules/          # one folder per domain (see §6)
│   ├── utils/            # jwt, pagination, logger
│   ├── app.ts            # express app + global middleware
│   └── server.ts         # listen()
├── uploads/              # local temp only if needed; prefer memory + stream to Supabase
├── package.json
└── .env.example
```

Use **TypeScript** for maintainability (optional but strongly recommended).

---

## 4. Packages to install

### 4.1 Production dependencies

```bash
npm install express mongoose dotenv
npm install jsonwebtoken bcryptjs
npm install zod
npm install helmet express-rate-limit cors cookie-parser
npm install multer csv-parser
npm install @supabase/supabase-js
npm install nodemailer
npm install puppeteer
```

**Notes:**

- **`bcryptjs`** — pure JS; use **`bcrypt`** if you prefer native bindings (faster, needs build tools on Windows).
- **`puppeteer`** — large Chromium download; for production you may use **`puppeteer-core`** + external Chrome, or swap to **PDFKit** / **@react-pdf/renderer** server-side later.
- **`csv-parser`** — streaming CSV parse for bulk scores.

### 4.2 Optional (as you grow)

```bash
npm install morgan                 # HTTP request logging (dev/staging)
npm install winston                # structured logging
npm install node-cron              # scheduled tasks without Redis
npm install express-validator      # alternative to Zod (pick one style)
```

### 4.3 Dev dependencies (TypeScript)

```bash
npm install -D typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs @types/multer @types/cors @types/cookie-parser
npm install -D tsx                 # or ts-node-dev / nodemon
npm install -D eslint @eslint/js typescript-eslint
```

### 4.4 Testing (when you add tests)

```bash
npm install -D vitest supertest @types/supertest
```

---

## 5. Environment variables (`.env.example`)

Document at least:

| Variable | Purpose |
|----------|---------|
| `PORT` | API port |
| `NODE_ENV` | `development` \| `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | signing access (and refresh if used) tokens |
| `JWT_EXPIRES_IN` | e.g. `15m` / `7d` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** — full storage access; never expose to client |
| `SUPABASE_ANON_KEY` | only if backend proxies something that needs anon semantics |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Nodemailer |
| `CORS_ORIGIN` | Next.js app URL(s) |
| `MAX_UPLOAD_MB` | align with multer limits |

**Security:** use Supabase **service role** only on the server; frontend uses **anon** + RLS if you ever query Supabase directly from Next.js. For this plan, **file ops go through Express** using the service role.

---

## 6. Domain modules & API shape

Each module typically contains: `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts` (Zod), optional `*.model.ts` if you split from a central `models/` folder.

### 6.1 Auth (`/api/v1/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Optional: admin-only user creation, or invite flow |
| POST | `/login` | Returns JWT; include `role`, `schoolId`, scoped ids (`teacherId`, `classTeacherOfClassId`, etc.) in token payload **or** load user on each request from DB |
| POST | `/refresh` | Optional: refresh token rotation (store refresh token hash in MongoDB) |
| POST | `/logout` | Invalidate refresh token if used |
| GET | `/me` | Current user + permissions summary |

**Install:** already covered (`jsonwebtoken`, `bcryptjs`, `zod`).

---

### 6.2 School setup — Admin (`/api/v1/admin/...` or nested under `/schools`)

Protect with role `ADMIN` or `SUPER_ADMIN`.

| Area | Example endpoints |
|------|-------------------|
| Sessions | `POST/GET/PATCH /sessions` |
| Terms | `POST/GET/PATCH /sessions/:sessionId/terms` |
| Classes & arms | `POST/GET/PATCH /classes`, `/classes/:id/arms` |
| Subjects | `POST/GET/PATCH /subjects` |
| Users / teachers | `POST/GET/PATCH /users`, assign roles |
| Assignments | `POST /assignments/teacher-subject` (teacher ↔ class ↔ subject) |
| Class teacher | `PATCH /classes/:id/class-teacher` |

---

### 6.3 Students (`/api/v1/students`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/students` | List with filters: `classId`, `armId`, `sessionId`, search |
| POST | `/students` | Enroll |
| GET | `/students/:id` | Profile |
| PATCH | `/students/:id` | Update |
| POST | `/students/bulk` or `/imports/students` | CSV import (multer + csv-parser) |

**RBAC:**  
- Subject teacher: students only in **assigned** class+subject context (for score sheets).  
- Class teacher: students in **their** class.  
- **Headteacher & Principal:** **all students** in the school (same endpoints, no class restriction; optional `classId` filter).

---

### 6.4 Assessments & scores — Subject teacher (`/api/v1/...`)

Model assessments per **term**, **class/arm**, **subject**, **teacher**. Component fields follow **§2** (test1 15, test2 15, exam 70).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teaching-contexts` | Assigned class/subject/term combos for logged-in teacher |
| GET | `/score-sheets` | Query params: `classId`, `subjectId`, `termId` — list students + test1, test2, exam (and computed total/grade after save) |
| PUT | `/score-sheets` | Body: array of student score updates (validated with Zod) |
| POST | `/score-sheets/import` | CSV upload (multer → parse → validate → bulk write) |
| POST | `/submissions` | **Submit results** for a scope (locks editing per your rules) |
| GET | `/submissions/status` | For class teacher: “3/10 subjects submitted” |

**Rules in service layer:**  
- On submit: set `submittedAt`, `locked: true` for that subject-class-term.  
- Recalculation: **total, grade, subject aggregate** in one pipeline or single `recalculateSubjectResults()` function.

---

### 6.5 Aggregation & report cards — Class teacher (`/api/v1/class-results`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/class-results/:classId/:termId/status` | Which subjects submitted / pending |
| POST | `/class-results/:classId/:termId/aggregate` | Trigger recompute (or auto-run when last subject submits) |
| GET | `/class-results/:classId/:termId/students` | Per-student: totals, average, position |
| PATCH | `/class-results/:classId/:termId/comments` | Class teacher comment fields |
| POST | `/class-results/:classId/:termId/report-cards/generate` | Build PDFs → upload to Supabase → store file URLs in MongoDB |

---

### 6.6 Headteacher — oversight & comments (`/api/v1/headteacher`)

**Requirement:** view **all students in each class** with **performance**.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/headteacher/overview` | Query: `sessionId`, `termId` — school-wide summary, pass rates, class comparison (aggregations) |
| GET | `/headteacher/classes` | List classes with roll count + avg performance |
| GET | `/headteacher/classes/:classId/students` | **All students** in class + key metrics (avg, position, subject breakdown) |
| GET | `/headteacher/students/:studentId/performance` | Drill-down: history across terms |
| PATCH | `/headteacher/students/:studentId/comments` | Headteacher comment |
| POST | `/headteacher/classes/:classId/approve` | Approve class results for the term |

Implement by reusing the same **read services** as class teacher but **without** `classId` restriction when `role === HEADTEACHER`, and always scope by `schoolId` from the user record.

---

### 6.7 Principal — analytics & promotions (`/api/v1/principal`)

Same visibility as headteacher for **read** paths; add promotion workflow.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/principal/overview` | School KPIs, trends, class vs class |
| GET | `/principal/classes/:classId/students` | Same as headteacher — full class roster + performance |
| GET | `/principal/promotions/preview` | Query: `termId` — suggest promote/repeat using **§2.3** subject pass (≥50% / C6+) plus any extra school rules |
| POST | `/principal/promotions/approve` | Persist decisions |
| POST | `/principal/terms/:termId/lock` | Final lock — no further edits |

---

### 6.8 Learning materials (MVP scope)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/materials` | Metadata in MongoDB; file to Supabase Storage |
| GET | `/materials` | By class/subject |

**Supabase:** upload via `@supabase/supabase-js` using `service_role`; store `bucket`, `path`, `publicUrl` (if public bucket) or signed URL generation endpoint.

---

### 6.9 Notifications (`/api/v1/notifications` or internal only)

| Trigger | Mechanism |
|---------|-----------|
| Result released | After principal lock → `nodemailer.sendMail` |
| Low performance alert | On aggregation or scheduled pass with `node-cron` |

No Redis: record `notifications` collection or `email_logs` for idempotency (avoid duplicate sends).

---

### 6.10 Health & ops

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `ok` + mongo ping |
| GET | `/ready` | Optional: deeper checks |

---

## 7. RBAC middleware (conceptual)

1. **`authenticate`** — verify JWT, attach `req.user` (`id`, `role`, `schoolId`, …).  
2. **`requireRoles(...roles)`** — allow only listed roles.  
3. **`scopeStudents`** — for **GET** lists:  
   - `PRINCIPAL`, `HEADTEACHER`, `ADMIN` → filter by `schoolId` only.  
   - `CLASS_TEACHER` → filter by assigned `classId`.  
   - `SUBJECT_TEACHER` → filter by enrollments matching assigned `(classId, subjectId)` when viewing score sheets.

Principal and headteacher both use the **same underlying query** for “students in class + performance”; only **write** endpoints (comments, approve, lock) differ by role.

---

## 8. MongoDB modeling hints (collections)

Define indexes early for list + dashboard queries:

- `students`: `{ schoolId: 1, classId: 1, armId: 1 }`, text index on name if needed  
- `scores` or `subject_results`: `{ schoolId, termId, classId, subjectId, studentId }` unique compound  
- `class_term_aggregates`: `{ classId, termId }` unique  
- `users`: `{ email: 1 }` unique  

Use **aggregation pipelines** for principal/headteacher dashboards (averages, top/bottom N, pass counts).

---

## 9. Supabase Storage usage

| Content | Bucket (example) | Access |
|---------|------------------|--------|
| Learning materials | `materials` | Private; signed URLs from API |
| Report cards PDF | `report-cards` | Private; parent/student download via signed URL |
| CSV imports | `imports-temp` | Lifecycle: delete after processing |

**Flow:** Express receives file (multer `memoryStorage`) → upload buffer to Supabase → save metadata in MongoDB.

---

## 10. Security checklist

- **helmet**, **cors** (strict origin), **express-rate-limit** (especially `/login`, `/import`).  
- **Input validation:** Zod on every write + query params.  
- **Passwords:** bcrypt cost factor appropriate for production.  
- **JWT:** short-lived access token; refresh in httpOnly cookie if same-site with Next.js.  
- **Audit log** (optional collection): who approved/locked/changed scores.

---

## 11. Implementation phases (backend)

1. **Phase 1 — Foundation:** Express + Mongo + auth + user roles + school structure CRUD.  
2. **Phase 2 — Academic core:** Students, enrollments, score sheets, submit/lock, subject aggregates.  
3. **Phase 3 — Class results:** Aggregation, positions, class teacher comments, PDF + Supabase.  
4. **Phase 4 — Leadership:** Headteacher + Principal read APIs (all classes/students), comments, approve, promotion preview, term lock.  
5. **Phase 5 — Extras:** Materials upload, email notifications, CSV bulk import hardening.

---

## 12. Frontend integration note (Next.js)

The frontend stack (TanStack Query, Zod forms) calls this API with `Authorization: Bearer <token>`. Keep API versioned (`/api/v1`) so you can evolve without breaking the App Router client.

---

## 13. Quick copy-paste: full install one-liner

```bash
npm install express mongoose dotenv jsonwebtoken bcryptjs zod helmet express-rate-limit cors cookie-parser multer csv-parser @supabase/supabase-js nodemailer puppeteer
npm install -D typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs @types/multer @types/cors @types/cookie-parser tsx
```

---

*This plan aligns with: Express + MongoDB + Supabase Storage + JWT auth, no Redis/BullMQ, and explicit Principal/Headteacher visibility across all classes and students for performance monitoring.*
