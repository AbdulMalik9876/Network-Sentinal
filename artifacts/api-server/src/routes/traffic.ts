import { Router, type IRouter } from "express";
import { desc, eq, gte, sql, and } from "drizzle-orm";
import { db, trafficEventsTable } from "@workspace/db";
import {
  ListTrafficQueryParams,
  CreateTrafficEventBody,
  GetTrafficGeoQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/traffic", async (req, res): Promise<void> => {
  const params = ListTrafficQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { limit = 100, offset = 0, protocol, deviceId, since } = params.data;

  const conditions = [];
  if (protocol) conditions.push(eq(trafficEventsTable.protocol, protocol));
  if (deviceId) conditions.push(eq(trafficEventsTable.deviceId, parseInt(deviceId)));
  if (since) conditions.push(gte(trafficEventsTable.timestamp, new Date(since)));

  const events = await db
    .select()
    .from(trafficEventsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(trafficEventsTable.timestamp))
    .limit(limit)
    .offset(offset);

  res.json(events.map(e => ({
    ...e,
    timestamp: e.timestamp.toISOString(),
  })));
});

router.post("/traffic", async (req, res): Promise<void> => {
  const parsed = CreateTrafficEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db
    .insert(trafficEventsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({
    ...event,
    timestamp: event.timestamp.toISOString(),
  });
});

router.get("/traffic/summary", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalEvents: sql<number>`count(*)::int`,
      totalBytes: sql<number>`sum(bytes)::int`,
      inboundBytes: sql<number>`sum(case when direction = 'inbound' then bytes else 0 end)::int`,
      outboundBytes: sql<number>`sum(case when direction = 'outbound' then bytes else 0 end)::int`,
      suspiciousCount: sql<number>`sum(case when is_suspicious then 1 else 0 end)::int`,
    })
    .from(trafficEventsTable);

  const topProtocols = await db
    .select({
      protocol: trafficEventsTable.protocol,
      count: sql<number>`count(*)::int`,
      bytes: sql<number>`sum(bytes)::int`,
    })
    .from(trafficEventsTable)
    .groupBy(trafficEventsTable.protocol)
    .orderBy(desc(sql`sum(bytes)`))
    .limit(5);

  const topCountries = await db
    .select({
      country: trafficEventsTable.country,
      count: sql<number>`count(*)::int`,
      bytes: sql<number>`sum(bytes)::int`,
    })
    .from(trafficEventsTable)
    .where(sql`country is not null`)
    .groupBy(trafficEventsTable.country)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const recentActivity = await db
    .select({
      hour: sql<string>`to_char(date_trunc('hour', timestamp), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
      count: sql<number>`count(*)::int`,
      bytes: sql<number>`sum(bytes)::int`,
    })
    .from(trafficEventsTable)
    .where(gte(trafficEventsTable.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)))
    .groupBy(sql`date_trunc('hour', timestamp)`)
    .orderBy(sql`date_trunc('hour', timestamp)`);

  res.json({
    totalEvents: totals.totalEvents ?? 0,
    totalBytes: totals.totalBytes ?? 0,
    inboundBytes: totals.inboundBytes ?? 0,
    outboundBytes: totals.outboundBytes ?? 0,
    suspiciousCount: totals.suspiciousCount ?? 0,
    topProtocols,
    topCountries: topCountries.map(c => ({ ...c, country: c.country ?? "Unknown" })),
    recentActivity,
  });
});

router.get("/traffic/geo", async (req, res): Promise<void> => {
  const params = GetTrafficGeoQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 200) : 200;

  const events = await db
    .select({
      id: trafficEventsTable.id,
      srcIp: trafficEventsTable.srcIp,
      dstIp: trafficEventsTable.dstIp,
      protocol: trafficEventsTable.protocol,
      bytes: trafficEventsTable.bytes,
      direction: trafficEventsTable.direction,
      country: trafficEventsTable.country,
      city: trafficEventsTable.city,
      lat: trafficEventsTable.lat,
      lon: trafficEventsTable.lon,
      isSuspicious: trafficEventsTable.isSuspicious,
      timestamp: trafficEventsTable.timestamp,
    })
    .from(trafficEventsTable)
    .where(sql`lat is not null and lon is not null`)
    .orderBy(desc(trafficEventsTable.timestamp))
    .limit(limit);

  res.json(events.map(e => ({
    ...e,
    timestamp: e.timestamp.toISOString(),
  })));
});

export default router;
