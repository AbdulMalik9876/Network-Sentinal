import express from "express";
import app from "./app";
import { logger } from "./lib/logger";
import { catchUp } from "./lib/simulator";

// Vercel serverless entry: no timers between requests, so top up the demo
// traffic for the time that passed before answering.
const handler = express();
handler.use(async (_req, _res, next) => {
  try {
    await catchUp();
  } catch (err) {
    logger.error({ err }, "Demo traffic catch-up failed");
  }
  next();
});
handler.use(app);

export default handler;
