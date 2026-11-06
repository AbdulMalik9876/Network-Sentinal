import { Router, type IRouter } from "express";
import { desc, eq, sql, and } from "drizzle-orm";
import { db, alertsTable, settingsTable } from "@workspace/db";
import {
  ListAlertsQueryParams,
  CreateAlertBody,
  ResolveAlertParams,
} from "@workspace/api-zod";
import { sendAlertEmail } from "../lib/email";

const router: IRouter = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const params = ListAlertsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { limit = 50, offset = 0, severity, resolved } = params.data;
  const conditions = [];
  if (severity) conditions.push(eq(alertsTable.severity, severity));
  if (resolved !== undefined) conditions.push(eq(alertsTable.resolved, resolved));

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(alertsTable.timestamp))
    .limit(limit)
    .offset(offset);

  res.json(alerts.map(a => ({
    ...a,
    timestamp: a.timestamp.toISOString(),
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
  })));
});

router.post("/alerts", async (req, res): Promise<void> => {
  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [alert] = await db
    .insert(alertsTable)
    .values(parsed.data)
    .returning();

  // Try to send email if configured
  const [settings] = await db.select().from(settingsTable).limit(1);
  if (settings?.emailAlertsEnabled && settings?.alertEmail) {
    const sent = await sendAlertEmail(settings.alertEmail, alert);
    if (sent) {
      await db.update(alertsTable).set({ emailSent: true }).where(eq(alertsTable.id, alert.id));
      alert.emailSent = true;
    }
  }

  res.status(201).json({
    ...alert,
    timestamp: alert.timestamp.toISOString(),
    resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
  });
});

router.patch("/alerts/:id/resolve", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ResolveAlertParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.json({
    ...alert,
    timestamp: alert.timestamp.toISOString(),
    resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
  });
});

router.get("/alerts/summary", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      unresolved: sql<number>`sum(case when resolved = false then 1 else 0 end)::int`,
      low: sql<number>`sum(case when severity = 'low' then 1 else 0 end)::int`,
      medium: sql<number>`sum(case when severity = 'medium' then 1 else 0 end)::int`,
      high: sql<number>`sum(case when severity = 'high' then 1 else 0 end)::int`,
      critical: sql<number>`sum(case when severity = 'critical' then 1 else 0 end)::int`,
    })
    .from(alertsTable);

  res.json({
    total: totals.total ?? 0,
    unresolved: totals.unresolved ?? 0,
    bySeverity: {
      low: totals.low ?? 0,
      medium: totals.medium ?? 0,
      high: totals.high ?? 0,
      critical: totals.critical ?? 0,
    },
  });
});

export default router;
