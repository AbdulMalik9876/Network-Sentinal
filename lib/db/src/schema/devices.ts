import { pgTable, text, serial, timestamp, bigint, boolean } from "drizzle-orm/pg-core";
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
  totalBytes: bigint("total_bytes", { mode: "number" }).notNull().default(0),
  downloadBytes: bigint("download_bytes", { mode: "number" }).notNull().default(0),
  uploadBytes: bigint("upload_bytes", { mode: "number" }).notNull().default(0),
  isBlocked: boolean("is_blocked").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(true),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, firstSeen: true, lastSeen: true, totalBytes: true, downloadBytes: true, uploadBytes: true, isBlocked: true, isOnline: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
