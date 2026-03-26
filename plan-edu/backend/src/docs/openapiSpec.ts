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
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
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
          security: bearer,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
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
          summary: "Teaching assignments for subject teacher",
          security: bearer,
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/score-sheets": {
        get: {
          tags: ["Assessments"],
          summary: "Get score sheet",
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
          summary: "Bulk update scores",
          security: bearer,
          responses: { "200": { description: "OK" }, "409": { description: "Locked term or sheet" } },
        },
      },
      "/api/v1/student-counts": {
        get: {
          tags: ["Assessments"],
          summary: "Student totals for subject teacher assignments",
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
          summary: "Submit / lock subject results",
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
