import { db, trafficEventsTable, alertsTable, devicesTable, settingsTable, portScansTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

// Demo data: a believable home network (all made up, no real people or traffic).

type Service = {
  name: string; ip: string; port: number; protocol: string;
  country: string; city: string; lat: number; lon: number;
  minKb: number; maxKb: number; upload?: boolean;
};

const SG = { country: "Singapore", city: "Singapore", lat: 1.352, lon: 103.82 };
const SERVICES: Record<string, Service> = {
  YouTube:        { name: "YouTube",         ip: "142.250.199.14",  port: 443,  protocol: "HTTPS", ...SG, minKb: 300, maxKb: 12_000 },
  Netflix:        { name: "Netflix",         ip: "45.57.90.1",      port: 443,  protocol: "HTTPS", ...SG, minKb: 1_000, maxKb: 25_000 },
  Facebook:       { name: "Facebook",        ip: "157.240.15.35",   port: 443,  protocol: "HTTPS", ...SG, minKb: 200, maxKb: 6_000 },
  Instagram:      { name: "Instagram",       ip: "157.240.15.174",  port: 443,  protocol: "HTTPS", ...SG, minKb: 200, maxKb: 6_000 },
  WhatsApp:       { name: "WhatsApp",        ip: "157.240.15.60",   port: 443,  protocol: "HTTPS", ...SG, minKb: 20, maxKb: 3_000, upload: true },
  "WhatsApp Call":{ name: "WhatsApp Call",   ip: "157.240.15.61",   port: 3478, protocol: "UDP",   ...SG, minKb: 500, maxKb: 8_000, upload: true },
  TikTok:         { name: "TikTok",          ip: "23.62.226.88",    port: 443,  protocol: "HTTPS", ...SG, minKb: 300, maxKb: 8_000 },
  Snapchat:       { name: "Snapchat",        ip: "34.120.64.79",    port: 443,  protocol: "HTTPS", country: "United States", city: "Kansas City", lat: 39.1, lon: -94.58, minKb: 200, maxKb: 5_000, upload: true },
  "X (Twitter)":  { name: "X (Twitter)",     ip: "104.244.42.1",    port: 443,  protocol: "HTTPS", country: "United States", city: "San Francisco", lat: 37.774, lon: -122.419, minKb: 100, maxKb: 3_000 },
  Google:         { name: "Google Search",   ip: "142.250.196.68",  port: 443,  protocol: "HTTPS", ...SG, minKb: 30, maxKb: 600 },
  Gmail:          { name: "Gmail",           ip: "142.250.4.17",    port: 443,  protocol: "HTTPS", ...SG, minKb: 20, maxKb: 2_000 },
  Wikipedia:      { name: "Wikipedia",       ip: "103.102.166.224", port: 443,  protocol: "HTTPS", ...SG, minKb: 50, maxKb: 900 },
  ChatGPT:        { name: "ChatGPT",         ip: "104.18.32.47",    port: 443,  protocol: "HTTPS", country: "United States", city: "San Francisco", lat: 37.774, lon: -122.419, minKb: 20, maxKb: 800 },
  GitHub:         { name: "GitHub",          ip: "140.82.121.4",    port: 443,  protocol: "HTTPS", country: "Germany", city: "Frankfurt", lat: 50.11, lon: 8.682, minKb: 50, maxKb: 15_000 },
  Daraz:          { name: "Daraz",           ip: "47.246.24.233",   port: 443,  protocol: "HTTPS", ...SG, minKb: 200, maxKb: 4_000 },
  Amazon:         { name: "Amazon",          ip: "54.239.28.85",    port: 443,  protocol: "HTTPS", country: "United States", city: "Ashburn", lat: 39.044, lon: -77.487, minKb: 200, maxKb: 4_000 },
  Spotify:        { name: "Spotify",         ip: "35.186.224.25",   port: 443,  protocol: "HTTPS", country: "United States", city: "Council Bluffs", lat: 41.26, lon: -95.86, minKb: 1_000, maxKb: 8_000 },
  Zoom:           { name: "Zoom",            ip: "170.114.52.2",    port: 8801, protocol: "UDP",   country: "United States", city: "San Jose", lat: 37.338, lon: -121.886, minKb: 500, maxKb: 10_000, upload: true },
  "Microsoft 365":{ name: "Microsoft 365",   ip: "52.113.194.132",  port: 443,  protocol: "HTTPS", country: "Netherlands", city: "Amsterdam", lat: 52.374, lon: 4.89, minKb: 50, maxKb: 5_000 },
  "Windows Update":{ name: "Windows Update", ip: "13.107.4.50",     port: 443,  protocol: "HTTPS", country: "United States", city: "Redmond", lat: 47.674, lon: -122.121, minKb: 2_000, maxKb: 40_000 },
  Steam:          { name: "Steam",           ip: "155.133.248.34",  port: 443,  protocol: "HTTPS", country: "Germany", city: "Frankfurt", lat: 50.11, lon: 8.682, minKb: 5_000, maxKb: 60_000 },
  "PUBG Mobile":  { name: "PUBG Mobile",     ip: "43.155.66.12",    port: 17500, protocol: "UDP",  ...SG, minKb: 100, maxKb: 2_000, upload: true },
  iCloud:         { name: "iCloud",          ip: "17.248.185.10",   port: 443,  protocol: "HTTPS", country: "United States", city: "Cupertino", lat: 37.323, lon: -122.032, minKb: 100, maxKb: 8_000, upload: true },
  "Google DNS":   { name: "Google DNS",      ip: "8.8.8.8",         port: 53,   protocol: "DNS",   country: "United States", city: "Mountain View", lat: 37.386, lon: -122.084, minKb: 0.1, maxKb: 0.5 },
  "Hik-Connect":  { name: "Hik-Connect",     ip: "47.88.59.64",     port: 443,  protocol: "HTTPS", ...SG, minKb: 500, maxKb: 6_000, upload: true },
  "Backblaze B2": { name: "Backblaze B2",    ip: "45.11.36.1",      port: 443,  protocol: "HTTPS", country: "Netherlands", city: "Amsterdam", lat: 52.374, lon: 4.89, minKb: 5_000, maxKb: 50_000, upload: true },
};

// Known-bad hosts used for attacks and alerts
const ATTACKERS = [
  { ip: "5.39.1.1",       country: "Russia",        city: "Moscow",    lat: 55.755,  lon: 37.617 },
  { ip: "222.186.190.1",  country: "China",         city: "Shanghai",  lat: 31.228,  lon: 121.474 },
  { ip: "185.220.101.1",  country: "Germany",       city: "Frankfurt", lat: 50.11,   lon: 8.682 },
  { ip: "45.33.32.156",   country: "United States", city: "Dallas",    lat: 32.779,  lon: -96.808 },
  { ip: "41.63.64.0",     country: "Nigeria",       city: "Lagos",     lat: 6.452,   lon: 3.395 },
  { ip: "190.93.244.1",   country: "Brazil",        city: "São Paulo", lat: -23.549, lon: -46.637 },
  { ip: "103.86.96.100",  country: "Japan",         city: "Tokyo",     lat: 35.689,  lon: 139.692 },
];

// Each device lists the services it uses, weighted by how often.
const DEVICES = [
  { ip: "192.168.1.2",  mac: "3C:22:FB:1A:2B:01", label: "MacBook Pro",     vendor: "Apple",     uses: { YouTube: 3, Google: 5, Gmail: 3, ChatGPT: 4, GitHub: 3, "Microsoft 365": 3, Zoom: 2, Wikipedia: 2, Spotify: 2, iCloud: 1, "Google DNS": 1 } },
  { ip: "192.168.1.3",  mac: "A8:5B:78:3C:4D:02", label: "iPhone 15",       vendor: "Apple",     uses: { Instagram: 6, WhatsApp: 6, "WhatsApp Call": 2, TikTok: 4, Snapchat: 3, YouTube: 3, Spotify: 2, iCloud: 1, "Google DNS": 1 } },
  { ip: "192.168.1.4",  mac: "64:1C:AE:5E:6F:03", label: "Galaxy S23",      vendor: "Samsung",   uses: { Facebook: 6, WhatsApp: 7, "WhatsApp Call": 3, YouTube: 4, TikTok: 3, Daraz: 2, "PUBG Mobile": 3, "X (Twitter)": 2, "Google DNS": 1 } },
  { ip: "192.168.1.5",  mac: "A8:23:FE:7A:8B:04", label: "Living Room TV",  vendor: "LG",        uses: { Netflix: 6, YouTube: 7, Spotify: 1, "Google DNS": 1 } },
  { ip: "192.168.1.6",  mac: "04:D9:F5:9C:0D:05", label: "Gaming PC",       vendor: "ASUS",      uses: { Steam: 3, YouTube: 4, "Windows Update": 1, Google: 3, "X (Twitter)": 2, Amazon: 1, "Google DNS": 1 } },
  { ip: "192.168.1.7",  mac: "F0:B3:EC:1E:2F:06", label: "iPad",            vendor: "Apple",     uses: { YouTube: 6, Netflix: 2, Wikipedia: 2, Google: 2, iCloud: 1, "Google DNS": 1 } },
  { ip: "192.168.1.8",  mac: "00:11:32:3A:4B:07", label: "NAS Drive",       vendor: "Synology",  uses: { "Backblaze B2": 2, "Google DNS": 1 } },
  { ip: "192.168.1.9",  mac: "BC:AD:28:5C:6D:08", label: "Security Camera", vendor: "Hikvision", uses: { "Hik-Connect": 5, "Google DNS": 1 } },
  { ip: "192.168.1.10", mac: "68:54:FD:7E:8F:09", label: "Echo Dot",        vendor: "Amazon",    uses: { Amazon: 3, Spotify: 4, "Google DNS": 1 } },
] as const;

const ROUTER_IP = "192.168.1.1";
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min));

function weighted(uses: Record<string, number>): Service {
  const entries = Object.entries(uses);
  let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [name, w] of entries) if ((r -= w) <= 0) return SERVICES[name];
  return SERVICES[entries[0][0]];
}

// Pakistan time (UTC+5): quiet at night, busy at lunch and in the evening.
function activity(d: Date): number {
  const h = (d.getUTCHours() + 5) % 24;
  if (h >= 1 && h < 7) return 0.1;
  if (h >= 19 && h <= 23) return 1.5;
  if (h >= 12 && h < 15) return 1.0;
  return 0.6;
}

// How busy each device is (phones and laptops most, camera/NAS least).
const DEVICE_WEIGHT: Record<string, number> = { "iPhone 15": 6, "Galaxy S23": 6, "MacBook Pro": 5, "Living Room TV": 3, "Gaming PC": 3, iPad: 2, "Echo Dot": 1, "NAS Drive": 0.5, "Security Camera": 1 };

function pickDevice() {
  let r = Math.random() * Object.values(DEVICE_WEIGHT).reduce((a, b) => a + b, 0);
  for (const d of DEVICES) if ((r -= DEVICE_WEIGHT[d.label]) <= 0) return d;
  return DEVICES[0];
}

function normalEvent(at: Date) {
  const device = pickDevice();
  const svc = weighted(device.uses);
  const upload = svc.upload ? Math.random() < 0.5 : Math.random() < 0.15;
  return {
    device,
    row: {
      srcIp: upload ? device.ip : svc.ip,
      dstIp: upload ? svc.ip : device.ip,
      srcPort: upload ? rnd(49152, 65535) : svc.port,
      dstPort: upload ? svc.port : rnd(49152, 65535),
      protocol: svc.protocol,
      bytes: Math.max(64, Math.floor((svc.minKb + Math.random() * (svc.maxKb - svc.minKb)) * 1024)),
      direction: upload ? "outbound" : "inbound",
      service: svc.name,
      country: svc.country, city: svc.city, lat: svc.lat, lon: svc.lon,
      isSuspicious: false,
      suspicionReason: null as string | null,
      timestamp: at,
    },
  };
}

const ATTACK_PORTS: Record<number, string> = { 22: "SSH", 23: "Telnet", 445: "SMB", 3389: "RDP", 5900: "VNC", 8080: "HTTP-Alt" };

function attackEvent(at: Date) {
  const a = pick(ATTACKERS);
  const target = pick(DEVICES);
  const port = Number(pick(Object.keys(ATTACK_PORTS)));
  return {
    srcIp: a.ip, dstIp: target.ip, srcPort: rnd(1024, 65535), dstPort: port,
    protocol: "TCP", bytes: rnd(60, 4000), direction: "inbound",
    service: ATTACK_PORTS[port], country: a.country, city: a.city, lat: a.lat, lon: a.lon,
    isSuspicious: true,
    suspicionReason: `Inbound ${ATTACK_PORTS[port]} (port ${port}) probe from ${a.city}, ${a.country}`,
    timestamp: at,
  };
}

// Every alert type the dashboard explains, at different severities.
function demoAlerts(now: number) {
  const ago = (h: number) => new Date(now - h * 3600_000);
  const [mac, iphone, s23, tv, pc, , nas, cam] = DEVICES;
  const [ru, cn, tor, us, ng, br, jp] = ATTACKERS;
  const rows = [
    { h: 0.4, type: "port_scan", severity: "high", message: `Port scan detected from ${ru.ip} (${ru.city}) — 1,024 ports probed on the router in 3 seconds`, srcIp: ru.ip, dstIp: ROUTER_IP },
    { h: 1.2, type: "brute_force", severity: "critical", message: `SSH brute force on ${nas.label} from ${cn.ip} (${cn.city}) — 312 failed logins in 10 minutes`, srcIp: cn.ip, dstIp: nas.ip, port: 22 },
    { h: 2.5, type: "suspicious_port", severity: "critical", message: `${cam.label} opened an outbound connection to port 4444 (common malware C2 port) at ${jp.ip}`, srcIp: cam.ip, dstIp: jp.ip, port: 4444 },
    { h: 3.1, type: "high_bandwidth", severity: "medium", message: `${tv.label} downloaded 4.2 GB in the last hour (Netflix 4K)`, srcIp: tv.ip },
    { h: 5.0, type: "suspicious_port", severity: "high", message: `Telnet (port 23) login attempt on ${cam.label} from ${br.ip} (${br.city})`, srcIp: br.ip, dstIp: cam.ip, port: 23 },
    { h: 6.5, type: "brute_force", severity: "high", message: `RDP brute force on ${pc.label} from ${tor.ip} (Tor exit node) — 87 failed logins`, srcIp: tor.ip, dstIp: pc.ip, port: 3389 },
    { h: 7.8, type: "port_scan", severity: "medium", message: `Slow port scan from ${us.ip} (${us.city}) — 64 ports over 20 minutes`, srcIp: us.ip, dstIp: ROUTER_IP },
    { h: 9.0, type: "high_bandwidth", severity: "low", message: `${pc.label} downloaded 18.7 GB from Steam (game update)`, srcIp: pc.ip },
    { h: 12, type: "suspicious_port", severity: "medium", message: `${s23.label} connected to IRC port 6667 at ${ng.ip} (${ng.city})`, srcIp: s23.ip, dstIp: ng.ip, port: 6667 },
    { h: 15, type: "high_bandwidth", severity: "medium", message: `${nas.label} uploaded 9.3 GB to Backblaze B2 (scheduled backup)`, srcIp: nas.ip },
    { h: 19, type: "port_scan", severity: "high", message: `Port scan detected from ${cn.ip} (${cn.city}) — 512 ports probed on ${cam.label}`, srcIp: cn.ip, dstIp: cam.ip },
    { h: 22, type: "brute_force", severity: "critical", message: `SMB login attempts on ${nas.label} from ${ru.ip} (${ru.city}) — 1,140 failures`, srcIp: ru.ip, dstIp: nas.ip, port: 445 },
    { h: 27, type: "suspicious_port", severity: "low", message: `Unusual outbound connection from ${mac.label} to port 8080 at ${us.ip}`, srcIp: mac.ip, dstIp: us.ip, port: 8080 },
    { h: 31, type: "high_bandwidth", severity: "low", message: `${iphone.label} uploaded 2.1 GB to iCloud (photo backup)`, srcIp: iphone.ip },
    { h: 36, type: "port_scan", severity: "medium", message: `Port scan detected from ${jp.ip} (${jp.city}) — 200 ports probed on the router`, srcIp: jp.ip, dstIp: ROUTER_IP },
    { h: 40, type: "brute_force", severity: "high", message: `VNC password guessing on ${pc.label} from ${br.ip} (${br.city}) — 54 attempts`, srcIp: br.ip, dstIp: pc.ip, port: 5900 },
    { h: 44, type: "suspicious_port", severity: "critical", message: `${cam.label} contacted ${jp.ip} on port 31337 (backdoor port)`, srcIp: cam.ip, dstIp: jp.ip, port: 31337 },
    { h: 47, type: "high_bandwidth", severity: "medium", message: `${pc.label} downloaded 6.8 GB of Windows updates`, srcIp: pc.ip },
  ];
  // Older alerts are already handled; the last ~8 hours are still open.
  return rows.map(({ h, ...r }) => ({ ...r, timestamp: ago(h), resolved: h > 8, resolvedAt: h > 8 ? ago(h - 0.5) : null }));
}

function demoPortScans(now: number) {
  const at = new Date(now - 30 * 60_000);
  const p = (ip: string, port: number, service: string, state = "open") => ({ ip, port, protocol: "tcp", state, service, timestamp: at });
  const [, , , tv, pc, , nas, cam] = DEVICES;
  return [
    p(ROUTER_IP, 53, "DNS"), p(ROUTER_IP, 80, "HTTP"), p(ROUTER_IP, 443, "HTTPS"), p(ROUTER_IP, 22, "SSH", "filtered"),
    p(nas.ip, 22, "SSH"), p(nas.ip, 445, "SMB"), p(nas.ip, 5000, "Synology DSM"),
    p(cam.ip, 23, "Telnet"), p(cam.ip, 554, "RTSP"), p(cam.ip, 80, "HTTP"),
    p(pc.ip, 3389, "RDP", "filtered"), p(tv.ip, 8008, "Chromecast"),
  ];
}

type TrafficRow = typeof trafficEventsTable.$inferInsert;

/** Traffic for a time window: ~45 events/hour at peak, ~0.35 attacks/hour. */
function eventsBetween(from: number, to: number): TrafficRow[] {
  const events: TrafficRow[] = [];
  for (let t = from; t < to; t += 60_000) {
    const at = () => new Date(Math.min(to, t + Math.random() * 60_000));
    if (Math.random() < (45 * activity(new Date(t))) / 60) events.push(normalEvent(at()).row);
    if (Math.random() < 0.35 / 60) events.push(attackEvent(at()));
  }
  return events;
}

/** Fill an empty database with `hours` of realistic history. */
export async function seedDemoData(hours = 48): Promise<void> {
  const now = Date.now();
  const events = eventsBetween(now - hours * 3600_000, now);

  const totals = new Map<string, { down: number; up: number }>();
  for (const e of events) {
    const local = e.direction === "inbound" ? e.dstIp : e.srcIp;
    const t = totals.get(local) ?? { down: 0, up: 0 };
    if (e.direction === "inbound") t.down += e.bytes ?? 0; else t.up += e.bytes ?? 0;
    totals.set(local, t);
  }
  await db.insert(devicesTable).values(DEVICES.map(({ uses: _uses, ...d }) => {
    const t = totals.get(d.ip) ?? { down: 0, up: 0 };
    return {
      ...d, downloadBytes: t.down, uploadBytes: t.up, totalBytes: t.down + t.up,
      firstSeen: new Date(now - hours * 3600_000), lastSeen: new Date(now - rnd(0, 600_000)),
      isOnline: d.label !== "iPad",
    };
  })).onConflictDoNothing();

  for (let i = 0; i < events.length; i += 500) await db.insert(trafficEventsTable).values(events.slice(i, i + 500));
  await db.insert(alertsTable).values(demoAlerts(now));
  await db.insert(portScansTable).values(demoPortScans(now));
  logger.info({ events: events.length }, "Demo data seeded");
}

export async function seedInitialData(): Promise<void> {
  const [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) {
    await db.insert(settingsTable).values({
      emailAlertsEnabled: false, routerIp: ROUTER_IP, scanInterval: 60, suspicionThreshold: 100,
      portScanDetection: true, bruteForceDetection: true, highBandwidthThresholdMb: 500,
    });
  }
  const existing = await db.select({ id: trafficEventsTable.id }).from(trafficEventsTable).limit(1);
  if (existing.length === 0) await seedDemoData();
}

/** Wipe all demo tables and seed fresh history. */
export async function resetDemoData(): Promise<void> {
  await db.execute(sql`TRUNCATE traffic_events, alerts, port_scans, devices RESTART IDENTITY`);
  await seedInitialData();
}

/**
 * Fill the gap since the newest traffic row (at most 48h), so the data stays
 * "live" without a background timer. Safe to call on every request: it only
 * runs when the newest row is over a minute old, and one caller at a time.
 */
export async function catchUp(): Promise<void> {
  await seedInitialData();
  const [{ last }] = await db.select({ last: sql<string | null>`max(timestamp)` }).from(trafficEventsTable);
  const now = Date.now();
  const lastMs = last ? new Date(last).getTime() : now;
  if (now - lastMs < 60_000) return;
  const events = eventsBetween(Math.max(lastMs, now - 48 * 3600_000), now);
  if (events.length === 0) return;

  const newAlerts = await db.transaction(async (tx) => {
    const [{ ok }] = (await tx.execute(sql`select pg_try_advisory_xact_lock(4711) as ok`)).rows as { ok: boolean }[];
    if (!ok) return [];
    for (let i = 0; i < events.length; i += 500) await tx.insert(trafficEventsTable).values(events.slice(i, i + 500));

    const totals = new Map<string, { down: number; up: number; last: Date }>();
    for (const e of events) {
      if (e.isSuspicious) continue;
      const ip = e.direction === "inbound" ? e.dstIp : e.srcIp;
      const t = totals.get(ip) ?? { down: 0, up: 0, last: e.timestamp as Date };
      if (e.direction === "inbound") t.down += e.bytes ?? 0; else t.up += e.bytes ?? 0;
      if ((e.timestamp as Date) > t.last) t.last = e.timestamp as Date;
      totals.set(ip, t);
    }
    for (const [ip, t] of totals) {
      await tx.update(devicesTable).set({
        downloadBytes: sql`download_bytes + ${t.down}`, uploadBytes: sql`upload_bytes + ${t.up}`,
        totalBytes: sql`total_bytes + ${t.down + t.up}`, lastSeen: t.last, isOnline: true,
      }).where(eq(devicesTable.ip, ip));
    }

    const [settings] = await tx.select().from(settingsTable).limit(1);
    const attacks = events.filter((e) => e.isSuspicious && Math.random() < 0.4);
    if (!settings?.portScanDetection || attacks.length === 0) return [];
    return tx.insert(alertsTable).values(attacks.map((e) => ({
      type: "suspicious_port",
      severity: e.dstPort === 23 || e.dstPort === 445 ? "critical" : "high",
      message: `${e.service} (port ${e.dstPort}) probe from ${e.city}, ${e.country} [${e.srcIp}]`,
      srcIp: e.srcIp, dstIp: e.dstIp, port: e.dstPort, timestamp: e.timestamp,
    }))).returning();
  });

  const [settings] = await db.select().from(settingsTable).limit(1);
  if (settings?.emailAlertsEnabled && settings.alertEmail) {
    const { sendAlertEmail } = await import("./email");
    for (const alert of newAlerts.slice(-3)) {
      if (await sendAlertEmail(settings.alertEmail, alert)) {
        await db.update(alertsTable).set({ emailSent: true }).where(eq(alertsTable.id, alert.id));
      }
    }
  }
  logger.info({ events: events.length, alerts: newAlerts.length }, "Caught up demo traffic");
}
