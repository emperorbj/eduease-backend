import "./models/index.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";
import { logger } from "./utils/logger.js";

async function main() {
  if (!env.MONGODB_URI) {
    logger.error("[server] MONGODB_URI is required");
    process.exit(1);
  }
  await connectMongo();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`[server] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((e) => {
  logger.error(e instanceof Error ? e : new Error(String(e)));
  process.exit(1);
});
