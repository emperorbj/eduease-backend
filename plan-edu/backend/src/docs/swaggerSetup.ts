import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { getOpenApiSpec } from "./openapiSpec.js";

export function setupSwagger(app: Express): void {
  const spec = getOpenApiSpec();
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
  app.get("/openapi.json", (_req, res) => {
    res.json(spec);
  });
}
