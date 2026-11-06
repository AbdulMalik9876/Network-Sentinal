import { useState } from "react";
import { Alert, useResolveAlert, getListAlertsQueryKey } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/utils";
import { X, ShieldAlert, CheckCircle2, Lightbulb, Info, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const SEVERITY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#ef4444", bg: "#ef444420", label: "CRITICAL" },
  high:     { color: "#f97316", bg: "#f9731620", label: "HIGH" },
  medium:   { color: "#f59e0b", bg: "#f59e0b20", label: "MEDIUM" },
  low:      { color: "#22c55e", bg: "#22c55e20", label: "LOW" },
};

interface AlertAnalysis {
  title: string;
  description: string;
  impact: string;
  indicators: string[];
}

function getAlertAnalysis(alert: Alert): AlertAnalysis {
  const t = alert.type.toLowerCase();
  const port = alert.port;

  if (t.includes("port_scan") || t.includes("port scan")) return {
    title: "Port Scan Detected",
    description: "An automated tool is probing your network to discover open services. This is typically the reconnaissance phase before a targeted attack.",
    impact: "Exposes network topology and running services. May be followed by exploitation attempts against discovered vulnerabilities.",
    indicators: ["Rapid sequential port probing", "Multiple connection failures in short window", `Source: ${alert.srcIp}`, "Automated scanning tool signature"],
  };

  if (t.includes("brute_force") || t.includes("brute force")) return {
    title: "Credential Brute Force Attack",
    description: "An attacker is systematically trying username/password combinations to gain unauthorized access to your systems.",
    impact: "If successful, attacker gains full access to the targeted service and potentially the entire network.",
    indicators: ["Hundreds of failed login attempts", `Port ${port || 22} (${port === 3389 ? "RDP" : "SSH"}) targeted`, `Source IP: ${alert.srcIp}`, "Automated credential stuffing pattern"],
  };

  if (t.includes("suspicious_port") || t.includes("suspicious port")) return {
    title: "Suspicious Port Activity",
    description: `Traffic on port ${port || "unknown"} is associated with malware, C2 frameworks, or unauthorized services.`,
    impact: "May indicate active compromise, malware infection, or data exfiltration attempt.",
    indicators: [
      port === 4444 ? "Port 4444 = Metasploit default C2" : `Port ${port} is flagged as high-risk`,
      `Connection from ${alert.srcIp}`,
      alert.dstIp ? `To internal host ${alert.dstIp}` : "Outbound connection",
    ],
  };

  if (t.includes("high_bandwidth") || t.includes("bandwidth")) return {
    title: "Abnormal Bandwidth Usage",
    description: "A device is transferring an unusually large volume of data, which may indicate data exfiltration or unauthorized downloads.",
    impact: "Potential data breach, policy violation, or compromised device being used for downloads.",
    indicators: [`Source device: ${alert.srcIp}`, "Transfer volume significantly above baseline", "Sustained high-rate transfer"],
  };

  return {
    title: alert.type,
    description: alert.message,
    impact: "Security event requiring investigation.",
    indicators: [alert.srcIp ? `Source IP: ${alert.srcIp}` : "Internal event", "Review logs for context"],
  };
}

function getResolutionSteps(alert: Alert): Array<{ step: string; detail: string; urgent?: boolean }> {
  const t = alert.type.toLowerCase();
  const port = alert.port;

  if (t.includes("port_scan") || t.includes("port scan")) return [
    { step: `Block ${alert.srcIp} at the firewall`, detail: "Add an immediate deny rule. Command: iptables -A INPUT -s " + alert.srcIp + " -j DROP", urgent: true },
    { step: "Enable scan detection rules on IDS/IPS", detail: "Configure your Snort/Suricata rules to alert on >20 port probes within 10 seconds from a single source." },
    { step: "Audit all open ports", detail: "Run: nmap -sV localhost to see what services are externally visible. Close or move anything unnecessary." },
    { step: "Review firewall rules", detail: "Ensure only ports 80, 443, and any required services are open. All others should be DROP, not REJECT." },
    { step: "Monitor for follow-up attacks", detail: "Port scans are usually followed by exploitation. Watch for connection attempts on discovered ports for the next 24h." },
  ];

  if (t.includes("brute_force") || t.includes("brute force")) return [
    { step: `Block ${alert.srcIp} immediately`, detail: "iptables -A INPUT -s " + alert.srcIp + " -j DROP — do this NOW before credentials are compromised.", urgent: true },
    { step: "Check if any login succeeded", detail: "Review auth logs: grep 'Accepted' /var/log/auth.log | grep " + alert.srcIp + ". If yes, treat as compromise." },
    { step: "Enable fail2ban or equivalent", detail: "apt install fail2ban && systemctl enable fail2ban. Configure to ban after 5 failures for 1 hour." },
    { step: "Switch to key-based authentication", detail: port === 3389 ? "Enable NLA for RDP, restrict access to VPN only." : "Disable password auth in /etc/ssh/sshd_config: PasswordAuthentication no" },
    { step: "Rotate credentials on targeted accounts", detail: "Even if attack failed, rotate passwords on all accounts that could have been targeted." },
    { step: "Enable multi-factor authentication", detail: "Enable MFA on the targeted service to make credential theft useless even if passwords are compromised." },
  ];

  if (t.includes("suspicious_port") || t.includes("suspicious port")) return [
    { step: `Isolate ${alert.dstIp || "affected host"} if reachable`, detail: "If a local host is communicating on this port, disconnect it from the network immediately.", urgent: port === 4444 || port === 31337 || port === 6667 },
    { step: `Block port ${port} at the firewall`, detail: `iptables -A INPUT -p tcp --dport ${port} -j DROP && iptables -A OUTPUT -p tcp --dport ${port} -j DROP` },
    { step: "Identify which process uses this port", detail: "On Linux: netstat -tulpn | grep " + port + " — On Windows: netstat -ano | findstr " + port },
    { step: "Run malware scan on affected hosts", detail: "Use ClamAV, Malwarebytes, or your EDR solution. Boot from clean media if system is compromised." },
    { step: "Review outbound firewall rules", detail: "Implement egress filtering — most malware needs to call home. Only allow outbound 80/443 from controlled proxies." },
  ];

  if (t.includes("high_bandwidth") || t.includes("bandwidth")) return [
    { step: "Identify the data transfer destination", detail: `Check where ${alert.srcIp} is sending data. Review DNS logs and connection table.` },
    { step: "Capture and inspect traffic", detail: "Use tcpdump -i eth0 -w capture.pcap host " + alert.srcIp + " — then analyse in Wireshark." },
    { step: "Temporarily throttle or block the device", detail: "Apply bandwidth limits or block the device: iptables -A FORWARD -s " + alert.srcIp + " -m limit --limit 1mb/s -j ACCEPT" },
    { step: "Review what data was transferred", detail: "Check file access logs, browser history, and application logs on the device." },
    { step: "Update DLP policies", detail: "Implement Data Loss Prevention rules to detect and block large file transfers to external destinations." },
  ];

  return [
    { step: "Investigate the source IP", detail: `Look up ${alert.srcIp} on threat intelligence platforms like VirusTotal, AbuseIPDB, or Shodan.` },
    { step: "Review system logs", detail: "Check /var/log/syslog, auth.log, and application logs for related activity around the time of this alert." },
    { step: "Apply appropriate firewall rules", detail: "Block the source IP if confirmed malicious. Update firewall rules to prevent recurrence." },
    { step: "Document and escalate", detail: "Log the incident in your ticketing system. If data was accessed, escalate per your incident response plan." },
  ];
}

interface AlertDetailModalProps {
  alert: Alert;
  onClose: () => void;
}

export function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const [tab, setTab] = useState<"details" | "analysis" | "resolve">("details");
  const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low;
  const analysis = getAlertAnalysis(alert);
  const steps = getResolutionSteps(alert);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const resolveAlert = useResolveAlert();

  const handleResolve = () => {
    resolveAlert.mutate({ id: alert.id }, {
      onSuccess: () => {
        toast({ title: "Alert resolved" });
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden"
        style={{ background: "#0a1628", borderColor: sev.color + "60",
          boxShadow: `0 0 40px ${sev.color}20` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b" style={{ borderColor: sev.color + "30" }}>
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-xs font-black border"
                style={{ background: sev.bg, color: sev.color, borderColor: sev.color + "50" }}>
                {sev.label}
              </span>
              {alert.resolved
                ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 className="w-3 h-3" />Resolved</span>
                : <span className="flex items-center gap-1 text-amber-400 text-xs"><AlertTriangle className="w-3 h-3" />Active</span>}
            </div>
            <h2 className="text-white font-bold text-sm">{alert.type}</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{alert.message}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "#1e3a5f" }}>
          {(["details", "analysis", "resolve"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2.5 text-sm font-medium capitalize transition-colors flex items-center gap-1.5"
              style={{
                color: tab === t ? "#60a5fa" : "#64748b",
                borderBottom: tab === t ? "2px solid #60a5fa" : "2px solid transparent",
              }}>
              {t === "details"  && <><Info className="w-3.5 h-3.5" />Details</>}
              {t === "analysis" && <><ShieldAlert className="w-3.5 h-3.5" />Analysis</>}
              {t === "resolve"  && <><Lightbulb className="w-3.5 h-3.5" />How to Resolve</>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-80">
          {tab === "details" && (
            <div className="space-y-2 text-sm font-mono">
              <ModalRow label="Alert Type" value={alert.type} />
              <ModalRow label="Severity"   value={alert.severity.toUpperCase()} valueStyle={{ color: sev.color }} />
              <ModalRow label="Source IP"  value={alert.srcIp || "N/A"} />
              {alert.dstIp && <ModalRow label="Dest IP" value={alert.dstIp} />}
              {alert.port  && <ModalRow label="Port"    value={String(alert.port)} />}
              <ModalRow label="Status"    value={alert.resolved ? "Resolved" : "Active"} />
              <ModalRow label="Timestamp" value={formatDateTime(alert.timestamp)} />
            </div>
          )}

          {tab === "analysis" && (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg border" style={{ borderColor: sev.color + "40", background: sev.bg }}>
                <p className="font-bold mb-1" style={{ color: sev.color }}>{analysis.title}</p>
                <p className="text-slate-300 text-xs leading-relaxed">{analysis.description}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400 font-bold mb-1">Potential Impact</p>
                <p className="text-slate-300 text-xs leading-relaxed">{analysis.impact}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wide">Indicators</p>
                <div className="space-y-1">
                  {analysis.indicators.map((ind, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sev.color }} />
                      {ind}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "resolve" && (
            <div className="space-y-3">
              {!alert.resolved && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs mb-3">
                  ⚡ This alert is still active. Follow the steps below to remediate.
                </div>
              )}
              {steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 border"
                    style={{
                      background: s.urgent ? "#ef444420" : "#3b82f620",
                      borderColor: s.urgent ? "#ef444440" : "#3b82f640",
                      color: s.urgent ? "#ef4444" : "#60a5fa",
                    }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium mb-0.5">
                      {s.urgent && <span className="text-red-400 mr-1">⚠</span>}
                      {s.step}
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed font-mono">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!alert.resolved && (
          <div className="px-4 py-3 border-t flex justify-end" style={{ borderColor: "#1e3a5f" }}>
            <button onClick={handleResolve} disabled={resolveAlert.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: "#1e3a5f", border: "1px solid #60a5fa40" }}>
              {resolveAlert.isPending ? "Resolving..." : "Mark as Resolved"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-xs text-slate-200" style={valueStyle}>{value}</span>
    </div>
  );
}
