import { db, portScansTable } from "@workspace/db";
import { logger } from "./logger";

const COMMON_SERVICES: Record<number, string> = {
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  143: "IMAP",
  443: "HTTPS",
  445: "SMB",
  993: "IMAPS",
  995: "POP3S",
  1433: "MSSQL",
  3306: "MySQL",
  3389: "RDP",
  5432: "PostgreSQL",
  5900: "VNC",
  6379: "Redis",
  8080: "HTTP-Alt",
  8443: "HTTPS-Alt",
  27017: "MongoDB",
};

export async function simulatePortScan(routerIp: string): Promise<void> {
  logger.info({ routerIp }, "Running port scan simulation");

  // Simulate realistic open ports for a home router
  const openPorts = [80, 443, 22, 53];
  const suspiciousPorts = [23, 21, 3389, 5900]; // Potentially concerning if open

  const results = openPorts.map(port => ({
    ip: routerIp,
    port,
    protocol: "tcp",
    state: "open" as const,
    service: COMMON_SERVICES[port] ?? null,
  }));

  // Occasionally show a suspicious port as filtered
  for (const port of suspiciousPorts) {
    results.push({
      ip: routerIp,
      port,
      protocol: "tcp",
      state: "filtered" as const,
      service: COMMON_SERVICES[port] ?? null,
    });
  }

  // Insert fresh results (clear old ones first)
  await db.delete(portScansTable);
  await db.insert(portScansTable).values(results);
}
