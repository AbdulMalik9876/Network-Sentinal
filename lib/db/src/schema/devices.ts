import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull().unique(),
  mac: text("mac"),
  label: text("label").notNull(),
  vendor: text("vendor"),
  firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  totalBytes: integer("total_bytes").notNull().default(0),
  downloadBytes: integer("download_bytes").notNull().default(0),
  uploadBytes: integer("upload_bytes").notNull().default(0),
  isBlocked: boolean("is_blocked").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(true),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, firstSeen: true, lastSeen: true, totalBytes: true, downloadBytes: true, uploadBytes: true, isBlocked: true, isOnline: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
