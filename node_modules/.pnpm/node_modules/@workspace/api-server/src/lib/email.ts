import { logger } from "./logger";

interface AlertRecord {
  id: number;
  type: string;
  severity: string;
  message: string;
  srcIp: string;
  dstIp: string | null;
  port: number | null;
  timestamp: Date;
}

export async function sendAlertEmail(to: string, alert: AlertRecord): Promise<boolean> {
  // Email sending via nodemailer or a service would go here.
  // For now we log it — the user can wire up SMTP in settings.
  logger.info({ to, alertId: alert.id, severity: alert.severity }, "Alert email triggered");

  // If SMTP_HOST is configured, send a real email
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn("SMTP not configured — email not sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.");
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: smtpUser, pass: smtpPass },
    });

    const severityEmoji: Record<string, string> = {
      critical: "🚨",
      high: "⚠️",
      medium: "🔔",
      low: "ℹ️",
    };

    await transporter.sendMail({
      from: smtpUser,
      to,
      subject: `${severityEmoji[alert.severity] ?? "🔔"} NetWatch Alert: ${alert.type} [${alert.severity.toUpperCase()}]`,
      html: `
        <div style="font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 24px; border-radius: 8px;">
          <h2 style="color: #f87171; margin: 0 0 16px;">NetWatch Security Alert</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px 8px; color: #94a3b8;">Severity:</td><td style="padding: 4px 8px; color: #f87171; font-weight: bold;">${alert.severity.toUpperCase()}</td></tr>
            <tr><td style="padding: 4px 8px; color: #94a3b8;">Type:</td><td style="padding: 4px 8px;">${alert.type}</td></tr>
            <tr><td style="padding: 4px 8px; color: #94a3b8;">Message:</td><td style="padding: 4px 8px;">${alert.message}</td></tr>
            <tr><td style="padding: 4px 8px; color: #94a3b8;">Source IP:</td><td style="padding: 4px 8px; color: #60a5fa;">${alert.srcIp}</td></tr>
            ${alert.dstIp ? `<tr><td style="padding: 4px 8px; color: #94a3b8;">Destination IP:</td><td style="padding: 4px 8px; color: #60a5fa;">${alert.dstIp}</td></tr>` : ""}
            ${alert.port ? `<tr><td style="padding: 4px 8px; color: #94a3b8;">Port:</td><td style="padding: 4px 8px;">${alert.port}</td></tr>` : ""}
            <tr><td style="padding: 4px 8px; color: #94a3b8;">Time:</td><td style="padding: 4px 8px;">${alert.timestamp.toISOString()}</td></tr>
          </table>
          <p style="margin: 16px 0 0; color: #64748b; font-size: 12px;">NetWatch Network Security Monitor</p>
        </div>
      `,
    });

    logger.info({ to, alertId: alert.id }, "Alert email sent successfully");
    return true;
  } catch (err) {
    logger.error({ err, to, alertId: alert.id }, "Failed to send alert email");
    return false;
  }
}
