import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portScansTable = pgTable("port_scans", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  port: integer("port").notNull(),
  protocol: text("protocol").notNull().default("tcp"),
  state: text("state").notNull().default("open"),
  service: text("service"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPortScanSchema = createInsertSchema(portScansTable).omit({ id: true, timestamp: true });
export type InsertPortScan = z.infer<typeof insertPortScanSchema>;
export type PortScan = typeof portScansTable.$inferSelect;
