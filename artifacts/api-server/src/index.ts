import app from "./app";
import { logger } from "./lib/logger";
import { catchUp, resetDemoData } from "./lib/simulator";

// `npm run reset-demo`: wipe the tables, fill them with 48h of demo data, exit.
if (process.argv.includes("--reset-demo")) {
  await resetDemoData();
  logger.info("Demo data reset");
  process.exit(0);
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seed if empty, then keep demo traffic flowing (same logic Vercel runs per request).
  const tick = () => catchUp().catch((err) => logger.error({ err }, "Demo traffic catch-up failed"));
  await tick();
  setInterval(tick, 30_000);
});
