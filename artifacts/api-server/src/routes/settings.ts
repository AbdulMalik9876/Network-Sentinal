import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { sendAlertEmail } from "../lib/email";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const existing = await db.select().from(settingsTable).limit(1);
  if (existing.length > 0) return existing[0];
  const [settings] = await db.insert(settingsTable).values({}).returning();
  return settings;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  // Don't expose router password
  const { routerPassword: _, ...safe } = settings;
  res.json({ ...safe, routerPassword: undefined });
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await getOrCreateSettings();
  const [updated] = await db
    .update(settingsTable)
    .set(parsed.data)
    .where(eq(settingsTable.id, settings.id))
    .returning();

  const { routerPassword: _, ...safe } = updated;
  res.json({ ...safe, routerPassword: undefined });
});

router.post("/settings/test-email", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  if (!settings.emailAlertsEnabled || !settings.alertEmail) {
    res.json({ success: false, message: "Email alerts are not configured. Please set an email address and enable alerts first." });
    return;
  }

  const testAlert = {
    id: 0,
    type: "test",
    severity: "low" as const,
    message: "This is a test alert from NetWatch. Your email notifications are working correctly.",
    srcIp: "127.0.0.1",
    dstIp: null,
    port: null,
    deviceId: null,
    resolved: false,
    resolvedAt: null,
    emailSent: false,
    timestamp: new Date(),
  };

  const sent = await sendAlertEmail(settings.alertEmail, testAlert);
  if (sent) {
    res.json({ success: true, message: `Test email sent to ${settings.alertEmail}` });
  } else {
    res.json({ success: false, message: "Failed to send test email. Check server logs." });
  }
});

export default router;
