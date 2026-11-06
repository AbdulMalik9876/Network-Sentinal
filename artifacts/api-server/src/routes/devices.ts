import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, devicesTable } from "@workspace/db";
import { CreateDeviceBody, UpdateDeviceBody, UpdateDeviceParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/devices", async (_req, res): Promise<void> => {
  const devices = await db
    .select()
    .from(devicesTable)
    .orderBy(devicesTable.totalBytes);

  res.json(devices.map(d => ({
    ...d,
    firstSeen: d.firstSeen.toISOString(),
    lastSeen: d.lastSeen.toISOString(),
  })));
});

router.post("/devices", async (req, res): Promise<void> => {
  const parsed = CreateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Upsert by IP
  const existing = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.ip, parsed.data.ip))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(devicesTable)
      .set({ lastSeen: new Date(), isOnline: true, label: parsed.data.label })
      .where(eq(devicesTable.ip, parsed.data.ip))
      .returning();
    res.status(201).json({
      ...updated,
      firstSeen: updated.firstSeen.toISOString(),
      lastSeen: updated.lastSeen.toISOString(),
    });
    return;
  }

  const [device] = await db
    .insert(devicesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({
    ...device,
    firstSeen: device.firstSeen.toISOString(),
    lastSeen: device.lastSeen.toISOString(),
  });
});

router.patch("/devices/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateDeviceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [device] = await db
    .update(devicesTable)
    .set(parsed.data)
    .where(eq(devicesTable.id, params.data.id))
    .returning();

  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }

  res.json({
    ...device,
    firstSeen: device.firstSeen.toISOString(),
    lastSeen: device.lastSeen.toISOString(),
  });
});

export default router;
