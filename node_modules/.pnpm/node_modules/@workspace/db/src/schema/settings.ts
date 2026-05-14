import { pgTable, text, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  emailAlertsEnabled: boolean("email_alerts_enabled").notNull().default(false),
  alertEmail: text("alert_email"),
  routerIp: text("router_ip"),
  routerUser: text("router_user"),
  routerPassword: text("router_password"),
  scanInterval: integer("scan_interval").notNull().default(60),
  suspicionThreshold: integer("suspicion_threshold").notNull().default(100),
  portScanDetection: boolean("port_scan_detection").notNull().default(true),
  bruteForceDetection: boolean("brute_force_detection").notNull().default(true),
  highBandwidthThresholdMb: integer("high_bandwidth_threshold_mb").notNull().default(500),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
