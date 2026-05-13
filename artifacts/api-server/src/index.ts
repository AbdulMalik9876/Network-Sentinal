import app from "./app";
import { logger } from "./lib/logger";
import { seedInitialData, generateRealtimeTraffic } from "./lib/simulator";

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

  // Seed initial data
  try {
    await seedInitialData();
    logger.info("Initial data seeded");
  } catch (err) {
    logger.error({ err }, "Error seeding initial data");
  }

  // Generate simulated realtime traffic every 5 seconds
  setInterval(async () => {
    try {
      await generateRealtimeTraffic();
    } catch (err) {
      logger.error({ err }, "Error generating realtime traffic");
    }
  }, 5000);
});
