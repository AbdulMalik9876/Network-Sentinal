import { db, trafficEventsTable, alertsTable, devicesTable, settingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

// Common IPs with geo data for realistic simulation
const REMOTE_HOSTS = [
  { ip: "8.8.8.8", country: "United States", city: "Mountain View", lat: 37.386, lon: -122.084 },
  { ip: "1.1.1.1", country: "Australia", city: "Sydney", lat: -33.869, lon: 151.209 },
  { ip: "185.220.101.1", country: "Germany", city: "Frankfurt", lat: 50.110, lon: 8.682 },
  { ip: "104.16.249.249", country: "United States", city: "San Francisco", lat: 37.774, lon: -122.419 },
  { ip: "52.26.24.209", country: "United States", city: "Seattle", lat: 47.606, lon: -122.332 },
  { ip: "77.247.181.165", country: "Netherlands", city: "Amsterdam", lat: 52.374, lon: 4.890 },
  { ip: "45.33.32.156", country: "United States", city: "Dallas", lat: 32.779, lon: -96.808 },
  { ip: "91.108.4.1", country: "Singapore", city: "Singapore", lat: 1.352, lon: 103.820 },
  { ip: "93.184.216.34", country: "United Kingdom", city: "London", lat: 51.507, lon: -0.128 },
  { ip: "195.154.200.229", country: "France", city: "Paris", lat: 48.857, lon: 2.353 },
  { ip: "103.86.96.100", country: "Japan", city: "Tokyo", lat: 35.689, lon: 139.692 },
  { ip: "222.186.190.1", country: "China", city: "Shanghai", lat: 31.228, lon: 121.474 },
  { ip: "41.63.64.0", country: "Nigeria", city: "Lagos", lat: 6.452, lon: 3.395 },
  { ip: "190.93.244.1", country: "Brazil", city: "São Paulo", lat: -23.549, lon: -46.637 },
  { ip: "5.39.1.1", country: "Russia", city: "Moscow", lat: 55.755, lon: 37.617 },
];

const LOCAL_DEVICES = [
  { ip: "192.168.1.2", mac: "AA:BB:CC:11:22:33", label: "Laptop", vendor: "Apple" },
  { ip: "192.168.1.3", mac: "AA:BB:CC:44:55:66", label: "Smartphone", vendor: "Samsung" },
  { ip: "192.168.1.4", mac: "AA:BB:CC:77:88:99", label: "Smart TV", vendor: "LG" },
  { ip: "192.168.1.5", mac: "AA:BB:CC:AA:BB:CC", label: "Desktop PC", vendor: "Dell" },
  { ip: "192.168.1.6", mac: "AA:BB:CC:DD:EE:FF", label: "NAS Drive", vendor: "Synology" },
];

const PROTOCOLS = ["TCP", "UDP", "HTTPS", "HTTP", "DNS", "SSH", "FTP"];
const SUSPICIOUS_PORTS = [22, 23, 3389, 445, 4444, 6667, 31337, 8080];

export async function seedInitialData(): Promise<void> {
  // Seed devices
  for (const dev of LOCAL_DEVICES) {
    try {
      await db.insert(devicesTable).values({
        ...dev,
        totalBytes: Math.floor(Math.random() * 500_000_000),
        downloadBytes: Math.floor(Math.random() * 400_000_000),
        uploadBytes: Math.floor(Math.random() * 100_000_000),
      }).onConflictDoNothing();
    } catch (_e) {
      // Already exists
    }
  }

  // Seed settings if not exists
  const existingSettings = await db.select().from(settingsTable).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(settingsTable).values({
      emailAlertsEnabled: false,
      scanInterval: 60,
      suspicionThreshold: 100,
      portScanDetection: true,
      bruteForceDetection: true,
      highBandwidthThresholdMb: 500,
    });
  }

  // Seed historical traffic (last 24h)
  const existingTraffic = await db.select().from(trafficEventsTable).limit(1);
  if (existingTraffic.length === 0) {
    const now = Date.now();
    const events = [];
    for (let i = 0; i < 200; i++) {
      const remote = REMOTE_HOSTS[Math.floor(Math.random() * REMOTE_HOSTS.length)];
      const device = LOCAL_DEVICES[Math.floor(Math.random() * LOCAL_DEVICES.length)];
      const protocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
      const direction = Math.random() > 0.4 ? "inbound" : "outbound";
      const port = Math.random() > 0.85
        ? SUSPICIOUS_PORTS[Math.floor(Math.random() * SUSPICIOUS_PORTS.length)]
        : [80, 443, 53, 8080][Math.floor(Math.random() * 4)];
      const isSuspicious = SUSPICIOUS_PORTS.includes(port) && Math.random() > 0.7;
      events.push({
        srcIp: direction === "inbound" ? remote.ip : device.ip,
        dstIp: direction === "inbound" ? device.ip : remote.ip,
        srcPort: Math.floor(Math.random() * 65535),
        dstPort: port,
        protocol,
        bytes: Math.floor(Math.random() * 1_500_000) + 500,
        direction,
        country: remote.country,
        city: remote.city,
        lat: remote.lat,
        lon: remote.lon,
        isSuspicious,
        suspicionReason: isSuspicious ? `Suspicious port ${port} access detected` : null,
        timestamp: new Date(now - Math.random() * 24 * 60 * 60 * 1000),
      });
    }
    await db.insert(trafficEventsTable).values(events);

    // Seed some alerts
    const alertSeeds = [
      { type: "port_scan", severity: "high" as const, message: "Port scan detected from 5.39.1.1 - 47 ports probed in 2 seconds", srcIp: "5.39.1.1" },
      { type: "brute_force", severity: "critical" as const, message: "SSH brute force attack from 222.186.190.1 - 143 failed attempts", srcIp: "222.186.190.1", dstIp: "192.168.1.5", port: 22 },
      { type: "suspicious_port", severity: "medium" as const, message: "Unusual outbound connection to port 4444 (potential C2 traffic)", srcIp: "192.168.1.3", dstIp: "103.86.96.100", port: 4444 },
      { type: "high_bandwidth", severity: "low" as const, message: "Smart TV transferred 2.3 GB in last hour", srcIp: "192.168.1.4" },
    ];
    await db.insert(alertsTable).values(alertSeeds);
  }
}

export async function generateRealtimeTraffic(): Promise<void> {
  const remote = REMOTE_HOSTS[Math.floor(Math.random() * REMOTE_HOSTS.length)];
  const device = LOCAL_DEVICES[Math.floor(Math.random() * LOCAL_DEVICES.length)];
  const protocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
  const direction = Math.random() > 0.4 ? "inbound" : "outbound";
  const port = Math.random() > 0.9
    ? SUSPICIOUS_PORTS[Math.floor(Math.random() * SUSPICIOUS_PORTS.length)]
    : [80, 443, 53, 8080][Math.floor(Math.random() * 4)];
  const isSuspicious = SUSPICIOUS_PORTS.includes(port) && Math.random() > 0.6;

  try {
    const [event] = await db.insert(trafficEventsTable).values({
      srcIp: direction === "inbound" ? remote.ip : device.ip,
      dstIp: direction === "inbound" ? device.ip : remote.ip,
      srcPort: Math.floor(Math.random() * 65535),
      dstPort: port,
      protocol,
      bytes: Math.floor(Math.random() * 500_000) + 500,
      direction,
      country: remote.country,
      city: remote.city,
      lat: remote.lat,
      lon: remote.lon,
      isSuspicious,
      suspicionReason: isSuspicious ? `Suspicious port ${port} access detected` : null,
    }).returning();

    // Update device bandwidth
    const byteCount = event.bytes;
    if (direction === "inbound") {
      await db
        .update(devicesTable)
        .set({
          totalBytes: sql`total_bytes + ${byteCount}`,
          downloadBytes: sql`download_bytes + ${byteCount}`,
          lastSeen: new Date(),
        })
        .where(eq(devicesTable.ip, device.ip));
    } else {
      await db
        .update(devicesTable)
        .set({
          totalBytes: sql`total_bytes + ${byteCount}`,
          uploadBytes: sql`upload_bytes + ${byteCount}`,
          lastSeen: new Date(),
        })
        .where(eq(devicesTable.ip, device.ip));
    }

    // Possibly create an alert for suspicious traffic
    if (isSuspicious) {
      const [settings] = await db.select().from(settingsTable).limit(1);
      if (settings?.portScanDetection) {
        const inserted = await db.insert(alertsTable).values({
          type: "suspicious_port",
          severity: port === 4444 || port === 31337 || port === 6667 ? "critical" : "high",
          message: `Suspicious connection to port ${port} (${protocol}) from ${direction === "inbound" ? remote.ip : device.ip}`,
          srcIp: direction === "inbound" ? remote.ip : device.ip,
          dstIp: direction === "inbound" ? device.ip : remote.ip,
          port,
        }).returning();

        if (settings?.emailAlertsEnabled && settings?.alertEmail) {
          const { sendAlertEmail } = await import("./email");
          const sent = await sendAlertEmail(settings.alertEmail, inserted[0]);
          if (sent) {
            await db.update(alertsTable).set({ emailSent: true }).where(eq(alertsTable.id, inserted[0].id));
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Error generating realtime traffic");
  }
}
