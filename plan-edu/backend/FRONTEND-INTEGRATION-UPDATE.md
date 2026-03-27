# Frontend Integration Update (Backward-Compatible)

This note covers **new APIs only** so existing integration keeps working.

## 1) Bulk report cards for full class table (NEW)

- **Endpoint:** `GET /api/v1/class-results/:classId/:termId/report-cards`
- **Who can use:** `CLASS_TEACHER`, `HEADTEACHER`, `PRINCIPAL`, `ADMIN`, `SUPER_ADMIN`
- **Purpose:** load **all students + all subjects** in one payload for the “view all reports at once” table.
- **Payload includes:** per student subject rows with `test1`, `test2`, `exam`, `totalPercent`, `grade`, `subjectPosition`; plus overall position and comments.

### Example response

```json
{
  "classId": "67...",
  "termId": "67...",
  "generatedAt": "2026-03-27T09:00:00.000Z",
  "subjectsMeta": [
    { "subjectId": "67a", "subjectCode": "ENG", "subjectName": "English Language" },
    { "subjectId": "67b", "subjectCode": "MTH", "subjectName": "Mathematics" }
  ],
  "students": [
    {
      "studentId": "67...",
      "firstName": "Jane",
      "lastName": "Doe",
      "admissionNumber": "ADM001",
      "gender": "FEMALE",
      "department": "SCIENCE",
      "aggregate": {
        "totalScore": 512,
        "average": 64,
        "subjectCount": 8,
        "passedSubjects": 7,
        "overallPosition": 3
      },
      "comments": {
        "classTeacherComment": "Good effort this term.",
        "headteacherComment": "Keep improving."
      },
      "subjects": [
        {
          "studentId": "67...",
          "subjectId": "67b",
          "subjectName": "Mathematics",
          "subjectCode": "MTH",
          "test1": 13,
          "test2": 14,
          "exam": 55,
          "totalPercent": 82,
          "grade": "A1",
          "remark": "Excellent",
          "subjectPassed": true,
          "subjectPosition": 2
        }
      ]
    }
  ]
}
```

### FE mapping tip for a wide table

1. Use `subjectsMeta` as the canonical ordered subject columns.
2. For each student row, convert `subjects[]` to a map by `subjectId`.
3. Render each subject cell using that map (`test1`, `test2`, `exam`, `totalPercent`, `grade`, `subjectPosition`).

---

## 2) Subject position per class + subject + term

- **Endpoint:** `GET /api/v1/class-results/:classId/:termId/subjects/:subjectId/positions`
- **Who can use:** `CLASS_TEACHER`, `HEADTEACHER`, `PRINCIPAL`, `ADMIN`, `SUPER_ADMIN`
- **Purpose:** rank all students in a class for a single subject.
- **Ranking policy:** tie-aware (same score => same position, e.g. `1,2,2,4`).

### Example response

```json
{
  "subject": { "id": "67...", "name": "Mathematics", "code": "MTH" },
  "rankings": [
    {
      "studentId": "67...",
      "firstName": "Jane",
      "lastName": "Doe",
      "admissionNumber": "ADM001",
      "totalPercent": 88,
      "grade": "A1",
      "remark": "Excellent",
      "subjectPassed": true,
      "position": 1
    }
  ]
}
```

---

## 3) Report card data endpoint (JSON)

- **Endpoint:** `GET /api/v1/class-results/:classId/:termId/report-cards/:studentId`
- **Who can use:** same roles as above (class teacher is class-scoped)
- **Purpose:** one payload for report-card screen/print.
- **Includes:** student bio, overall stats, overall class position, subject rows, subject positions, class-teacher comment, headteacher comment.

### Example response

```json
{
  "classId": "67...",
  "termId": "67...",
  "generatedAt": "2026-03-27T09:00:00.000Z",
  "student": {
    "studentId": "67...",
    "firstName": "Jane",
    "lastName": "Doe",
    "admissionNumber": "ADM001",
    "gender": "FEMALE"
  },
  "aggregate": {
    "totalScore": 512,
    "average": 64,
    "subjectCount": 8,
    "passedSubjects": 7,
    "overallPosition": 3
  },
  "comments": {
    "classTeacherComment": "Good effort this term.",
    "headteacherComment": "Keep improving."
  },
  "subjects": [
    {
      "subjectId": "67...",
      "subjectName": "Mathematics",
      "subjectCode": "MTH",
      "test1": 13,
      "test2": 14,
      "exam": 55,
      "totalPercent": 82,
      "grade": "A1",
      "remark": "Excellent",
      "subjectPassed": true,
      "subjectPosition": 2
    }
  ]
}
```

---

## 4) Report card PDF endpoint

- **Endpoint:** `GET /api/v1/class-results/:classId/:termId/report-cards/:studentId/pdf`
- **Response:** `application/pdf` binary (download file)
- **Filename pattern:** `report-card-<admissionNumber>-<termId>.pdf`

### Frontend usage

- For browser direct download:
  - call endpoint with `Authorization` header
  - use `blob` response type
  - create object URL and trigger download

---

## 5) Existing endpoints unchanged

- `GET /api/v1/class-results/:classId/:termId/students` still works.
- `PATCH /api/v1/class-results/:classId/:termId/comments` still works.
- New endpoints are additive, so current pages should not break.

---

## 5) Recommended FE flow (end of term)

1. Trigger or confirm aggregate: `POST /class-results/:classId/:termId/aggregate`
2. Load all report rows at once: `GET /class-results/:classId/:termId/report-cards`
3. Optional lightweight summary table still available: `GET /class-results/:classId/:termId/students`
4. On student click, open detailed report-card page using:
   - `GET /class-results/:classId/:termId/report-cards/:studentId`
5. For export button:
   - `GET /class-results/:classId/:termId/report-cards/:studentId/pdf`
