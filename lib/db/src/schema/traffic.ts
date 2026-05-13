import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trafficEventsTable = pgTable("traffic_events", {
  id: serial("id").primaryKey(),
  srcIp: text("src_ip").notNull(),
  dstIp: text("dst_ip").notNull(),
  srcPort: integer("src_port").notNull(),
  dstPort: integer("dst_port").notNull(),
  protocol: text("protocol").notNull(),
  bytes: integer("bytes").notNull().default(0),
  direction: text("direction").notNull().default("outbound"),
  country: text("country"),
  city: text("city"),
  lat: real("lat"),
  lon: real("lon"),
  deviceId: integer("device_id"),
  isSuspicious: boolean("is_suspicious").notNull().default(false),
  suspicionReason: text("suspicion_reason"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrafficEventSchema = createInsertSchema(trafficEventsTable).omit({ id: true, timestamp: true });
export type InsertTrafficEvent = z.infer<typeof insertTrafficEventSchema>;
export type TrafficEvent = typeof trafficEventsTable.$inferSelect;
