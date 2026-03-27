import { env } from "../config/env.js";

const bearer = [{ bearerAuth: [] }];

export function getOpenApiSpec() {
  const serverUrl = env.API_PUBLIC_URL ?? `http://localhost:${env.PORT}`;

  return {
    openapi: "3.0.3",
    info: {
      title: "Plan Edu API",
      version: "0.1.0",
      description:
        "School academic platform API. Use **Authorize** with `Bearer <token>` from `/api/v1/auth/login` or bootstrap `/api/v1/auth/register`.",
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: "Root", description: "Service info" },
      { name: "Health", description: "Liveness and MongoDB state" },
      { name: "Auth", description: "Authentication" },
      { name: "Admin", description: "School setup (ADMIN / SUPER_ADMIN)" },
      { name: "Students", description: "Student records" },
      { name: "Assessments", description: "Scores and submissions" },
      { name: "Class results", description: "Aggregation and comments" },
      { name: "Headteacher", description: "Oversight" },
      { name: "Principal", description: "Analytics, promotions, term lock" },
      { name: "Materials", description: "Learning materials (Supabase storage)" },
      { name: "Notifications", description: "Email notifications" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" }, details: {} },
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["Root"],
          summary: "API info",
          responses: { "200": { description: "OK" } },
        },
      },
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/health": {
        get: {
          tags: ["Health"],
          summary: "Versioned health",
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register (bootstrap first user) or admin creates user",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Shape depends on bootstrap vs admin; see controllers",
                },
              },
            },
          },
          responses: { "201": { description: "Created" }, "400": { description: "Validation error" } },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "JWT token" }, "401": { description: "Invalid credentials" } },
        },
      },
      "/api/v1/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Current user",
          security: bearer,
          responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
        },
      },
      "/api/v1/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List users in current school",
          security: bearer,
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/admin/users/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Get one user by id (same school)",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
        patch: {
          tags: ["Admin"],
          summary: "Update user by id",
          description:
            "For **class teachers**, set `classTeacherClassId` to the class they lead (or `null`). " +
            "RBAC uses this field to scope listings and class-results. Prefer keeping this aligned with `classTeacherUserId` on the class document (`PATCH /admin/classes/{id}`).",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", format: "email" },
                    firstName: { type: "string", minLength: 1, maxLength: 100 },
                    lastName: { type: "string", minLength: 1, maxLength: 100 },
                    role: { type: "string", description: "See USER_ROLES in codebase" },
                    classTeacherClassId: {
                      type: "string",
                      nullable: true,
                      description:
                        "Class this user leads as class teacher; drives CLASS_TEACHER API scope",
                      pattern: "^[a-f\\d]{24}$",
                    },
                    isActive: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "OK" } },
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete user by id",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "204": { description: "No content" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/admin/sessions": {
        get: {
          tags: ["Admin"],
          summary: "List sessions",
          security: bearer,
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Create session",
          security: bearer,
          responses: { "201": { description: "Created" } },
        },
      },
      "/api/v1/admin/sessions/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Update session",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete session",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "204": { description: "No content" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/admin/terms": {
        get: {
          tags: ["Admin"],
          summary: "List terms",
          security: bearer,
          parameters: [{ name: "sessionId", in: "query", schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Create term",
          security: bearer,
          responses: { "201": { description: "Created" } },
        },
      },
      "/api/v1/admin/terms/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Update term",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/admin/classes": {
        get: {
          tags: ["Admin"],
          summary: "List classes",
          security: bearer,
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Create class",
          security: bearer,
          responses: { "201": { description: "Created" } },
        },
      },
      "/api/v1/admin/classes/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Update class",
          description:
            "Assign or change the **class teacher** by setting `classTeacherUserId` to a user id, or `null` to clear. " +
            "This is the runtime equivalent of a dedicated `PATCH /classes/:id/class-teacher` route. " +
            "The user should have role `CLASS_TEACHER`; you can also set `classTeacherClassId` on the user via `PATCH /admin/users/{id}` so their token scope matches (keep both in sync if you use both fields).",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", minLength: 1, maxLength: 64 },
                    arm: { type: "string", minLength: 1, maxLength: 32 },
                    classTeacherUserId: {
                      type: "string",
                      nullable: true,
                      description: "MongoDB ObjectId of the class teacher user, or null to remove",
                      pattern: "^[a-f\\d]{24}$",
                    },
                    isActive: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "OK" },
            "404": { description: "Class not found" },
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete class",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "204": { description: "No content" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/admin/subjects": {
        get: {
          tags: ["Admin"],
          summary: "List subjects",
          security: bearer,
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Create subject",
          security: bearer,
          responses: { "201": { description: "Created" } },
        },
      },
      "/api/v1/admin/subjects/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Update subject",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete subject",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "204": { description: "No content" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/admin/assignments/class-coverage": {
        get: {
          tags: ["Admin"],
          summary:
            "Subject teachers assigned vs unassigned for a class (optional term filter; active assignments only)",
          security: bearer,
          parameters: [
            { name: "classId", in: "query", required: true, schema: { type: "string" } },
            { name: "termId", in: "query", required: false, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" }, "404": { description: "Class not found" } },
        },
      },
      "/api/v1/admin/assignments/teacher-subject": {
        post: {
          tags: ["Admin"],
          summary: "Assign teacher to class/subject/term",
          security: bearer,
          responses: { "201": { description: "Created" } },
        },
      },
      "/api/v1/admin/assignments/teacher-subject/unassign": {
        post: {
          tags: ["Admin"],
          summary: "Unassign teacher from class/subject/term (marks inactive)",
          security: bearer,
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/students": {
        get: {
          tags: ["Students"],
          summary: "List students",
          security: bearer,
          parameters: [
            { name: "classId", in: "query", schema: { type: "string" } },
            { name: "q", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Students"],
          summary: "Create student",
          security: bearer,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["firstName", "lastName", "gender", "admissionNumber", "classId"],
                  properties: {
                    firstName: { type: "string", minLength: 1, maxLength: 64 },
                    lastName: { type: "string", minLength: 1, maxLength: 64 },
                    gender: { type: "string", enum: ["MALE", "FEMALE"] },
                    department: {
                      type: "string",
                      enum: ["SCIENCE", "ARTS", "COMMERCIAL"],
                      nullable: true,
                      description:
                        "Optional for SS1-SS3 tracking. Omit for lower classes.",
                    },
                    admissionNumber: { type: "string", minLength: 1, maxLength: 32 },
                    classId: { type: "string", pattern: "^[a-f\\d]{24}$" },
                    loginEmail: { type: "string", format: "email" },
                    loginPassword: { type: "string", minLength: 8, maxLength: 128 },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" } },
        },
      },
      "/api/v1/students/me/results": {
        get: {
          tags: ["Students"],
          summary: "Get the authenticated student's own results for a term",
          security: bearer,
          parameters: [{ name: "termId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "403": { description: "Forbidden" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/students/{id}": {
        get: {
          tags: ["Students"],
          summary: "Get student",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
        patch: {
          tags: ["Students"],
          summary: "Update student",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    firstName: { type: "string", minLength: 1, maxLength: 64 },
                    lastName: { type: "string", minLength: 1, maxLength: 64 },
                    gender: { type: "string", enum: ["MALE", "FEMALE"] },
                    department: {
                      type: "string",
                      enum: ["SCIENCE", "ARTS", "COMMERCIAL"],
                      nullable: true,
                    },
                    admissionNumber: { type: "string", minLength: 1, maxLength: 32 },
                    classId: { type: "string", pattern: "^[a-f\\d]{24}$" },
                    isActive: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "OK" } },
        },
        delete: {
          tags: ["Students"],
          summary: "Delete student (ADMIN / SUPER_ADMIN)",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "204": { description: "No content" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/teaching-contexts": {
        get: {
          tags: ["Assessments"],
          summary: "Teaching assignments for subject/class teacher",
          security: bearer,
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/score-sheets": {
        get: {
          tags: ["Assessments"],
          summary: "Get score sheet (subject or class teacher with assignment)",
          security: bearer,
          parameters: [
            { name: "classId", in: "query", required: true, schema: { type: "string" } },
            { name: "subjectId", in: "query", required: true, schema: { type: "string" } },
            { name: "termId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
        put: {
          tags: ["Assessments"],
          summary: "Bulk update scores (subject or class teacher with assignment)",
          security: bearer,
          responses: { "200": { description: "OK" }, "409": { description: "Locked term or sheet" } },
        },
      },
      "/api/v1/student-counts": {
        get: {
          tags: ["Assessments"],
          summary: "Student totals for teacher assignments",
          security: bearer,
          parameters: [
            { name: "subjectId", in: "query", required: true, schema: { type: "string" } },
            { name: "termId", in: "query", required: true, schema: { type: "string" } },
            { name: "classId", in: "query", required: false, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "OK" },
            "403": { description: "No assignment or forbidden" },
          },
        },
      },
      "/api/v1/submissions": {
        post: {
          tags: ["Assessments"],
          summary: "Submit / lock subject results (subject or class teacher with assignment)",
          security: bearer,
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/submissions/status": {
        get: {
          tags: ["Assessments"],
          summary: "Submission status per subject (class teacher)",
          security: bearer,
          parameters: [
            { name: "classId", in: "query", required: true, schema: { type: "string" } },
            { name: "termId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/class-results/{classId}/{termId}/status": {
        get: {
          tags: ["Class results"],
          summary: "Subject submission status for class/term",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/class-results/{classId}/{termId}/aggregate": {
        post: {
          tags: ["Class results"],
          summary: "Recompute class aggregate",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" }, "409": { description: "Term locked" } },
        },
      },
      "/api/v1/class-results/{classId}/{termId}/students": {
        get: {
          tags: ["Class results"],
          summary: "Per-student class results",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/class-results/{classId}/{termId}/comments": {
        patch: {
          tags: ["Class results"],
          summary: "Update class teacher / headteacher comments",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" }, "409": { description: "Term locked" } },
        },
      },
      "/api/v1/class-results/{classId}/{termId}/subjects/{subjectId}/positions": {
        get: {
          tags: ["Class results"],
          summary: "Subject ranking for class/term",
          description:
            "Returns student positions for a single subject in the selected class and term. Ranking is tie-aware.",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "path", required: true, schema: { type: "string" } },
            { name: "subjectId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/class-results/{classId}/{termId}/report-cards/{studentId}": {
        get: {
          tags: ["Class results"],
          summary: "Student report card data",
          description:
            "Returns full end-of-term report card payload for one student, including subject rows, subject positions, overall position, class teacher and headteacher comments.",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "path", required: true, schema: { type: "string" } },
            { name: "studentId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/class-results/{classId}/{termId}/report-cards": {
        get: {
          tags: ["Class results"],
          summary: "Bulk report cards for whole class",
          description:
            "Returns all students in the class with full subject rows in one payload (test1, test2, exam, total, grade, subject position, overall position, comments).",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" }, "404": { description: "Aggregate not found" } },
        },
      },
      "/api/v1/class-results/{classId}/{termId}/report-cards/{studentId}/pdf": {
        get: {
          tags: ["Class results"],
          summary: "Download student report card PDF",
          description:
            "Generates a PDF report card from stored aggregates/comments and subject results for the selected student.",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "path", required: true, schema: { type: "string" } },
            { name: "studentId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "PDF binary" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/headteacher/overview": {
        get: {
          tags: ["Headteacher"],
          summary: "School overview",
          security: bearer,
          parameters: [{ name: "termId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/headteacher/classes": {
        get: {
          tags: ["Headteacher"],
          summary: "Classes overview",
          security: bearer,
          parameters: [{ name: "termId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/headteacher/classes/{classId}/students": {
        get: {
          tags: ["Headteacher"],
          summary: "Students in class with metrics",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/headteacher/students/{studentId}/performance": {
        get: {
          tags: ["Headteacher"],
          summary: "Student performance history",
          security: bearer,
          parameters: [
            { name: "studentId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/principal/overview": {
        get: {
          tags: ["Principal"],
          summary: "School KPIs",
          security: bearer,
          parameters: [{ name: "termId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/principal/classes/{classId}/students": {
        get: {
          tags: ["Principal"],
          summary: "Class students + performance",
          security: bearer,
          parameters: [
            { name: "classId", in: "path", required: true, schema: { type: "string" } },
            { name: "termId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/principal/promotions/preview": {
        get: {
          tags: ["Principal"],
          summary: "Promotion suggestions",
          security: bearer,
          parameters: [{ name: "termId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/principal/promotions/approve": {
        post: {
          tags: ["Principal"],
          summary: "Approve promotions",
          security: bearer,
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/principal/terms/{termId}/lock": {
        post: {
          tags: ["Principal"],
          summary: "Lock term (blocks further score/aggregate edits)",
          security: bearer,
          parameters: [{ name: "termId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/materials": {
        get: {
          tags: ["Materials"],
          summary: "List materials",
          security: bearer,
          parameters: [
            { name: "classId", in: "query", schema: { type: "string" } },
            { name: "subjectId", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
        post: {
          tags: ["Materials"],
          summary: "Upload material (multipart)",
          security: bearer,
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file", "title", "classId", "subjectId"],
                  properties: {
                    file: { type: "string", format: "binary" },
                    title: { type: "string" },
                    classId: { type: "string" },
                    subjectId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" } },
        },
      },
      "/api/v1/materials/{id}/signed-url": {
        get: {
          tags: ["Materials"],
          summary: "Get temporary signed download URL",
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/notifications/results-released": {
        post: {
          tags: ["Notifications"],
          summary: "Email: results released",
          security: bearer,
          responses: { "200": { description: "Sent" } },
        },
      },
      "/api/v1/notifications/low-performance-alert": {
        post: {
          tags: ["Notifications"],
          summary: "Email: low performance alert",
          security: bearer,
          responses: { "200": { description: "Sent" } },
        },
      },
    },
  };
}
