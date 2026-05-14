import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, portScansTable, settingsTable } from "@workspace/db";
import { simulatePortScan } from "../lib/portscan";

const router: IRouter = Router();

router.get("/ports/scan", async (_req, res): Promise<void> => {
  // Check if there's a router IP configured, otherwise use simulated results
  const [settings] = await db.select().from(settingsTable).limit(1);

  if (settings?.routerIp) {
    // Trigger a fresh scan (simulated but based on router IP)
    await simulatePortScan(settings.routerIp);
  }

  const results = await db
    .select()
    .from(portScansTable)
    .orderBy(desc(portScansTable.timestamp))
    .limit(50);

  res.json(results.map(r => ({
    ...r,
    timestamp: r.timestamp.toISOString(),
  })));
});

export default router;
