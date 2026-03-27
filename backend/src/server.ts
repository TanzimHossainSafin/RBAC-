import "./load-env.js";
import { APP_ORIGIN, PORT } from "./config.js";
import { initDatabase } from "./db.js";
import { createApp } from "./app.js";

async function start() {
  await initDatabase();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`RBAC API listening on http://localhost:${PORT}`);
    console.log(`Allowed frontend origin: ${APP_ORIGIN}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
