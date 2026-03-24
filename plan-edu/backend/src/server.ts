import "./models/index.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";

async function main() {
  if (!env.MONGODB_URI) {
    console.error("[server] MONGODB_URI is required");
    process.exit(1);
  }
  await connectMongo();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
