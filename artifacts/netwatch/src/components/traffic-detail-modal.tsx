import { useState } from "react";
import { GeoTrafficEvent } from "@workspace/api-client-react";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { X, MapPin, Globe, Clock, Wifi, ShieldAlert, CheckCircle, Lightbulb, Info } from "lucide-react";

const PORTS_INFO: Record<number, { name: string; risk: string; desc: string }> = {
  22:    { name: "SSH",         risk: "High",     desc: "Secure Shell remote access. Often targeted for brute-force attacks." },
  23:    { name: "Telnet",      risk: "Critical", desc: "Unencrypted remote access — all data including credentials sent in plain text." },
  80:    { name: "HTTP",        risk: "Low",       desc: "Standard web traffic. Unencrypted — data can be intercepted." },
  443:   { name: "HTTPS",       risk: "Low",       desc: "Encrypted web traffic. Generally safe." },
  445:   { name: "SMB",         risk: "Critical", desc: "Windows file sharing. Exploited by WannaCry, NotPetya ransomware." },
  3389:  { name: "RDP",         risk: "High",     desc: "Windows Remote Desktop. Common target for ransomware operators." },
  4444:  { name: "Metasploit",  risk: "Critical", desc: "Default port for Metasploit C2 callbacks. Indicates active exploitation." },
  6667:  { name: "IRC",         risk: "Critical", desc: "Internet Relay Chat — classic botnet command-and-control channel." },
  8080:  { name: "HTTP-Alt",    risk: "Medium",   desc: "Alternative HTTP port often used by proxies or rogue web servers." },
  31337: { name: "Back Orifice", risk: "Critical", desc: "Historic malware backdoor port. Any traffic here is extremely suspicious." },
  53:    { name: "DNS",         risk: "Low",       desc: "Domain name resolution. Occasionally used for data exfiltration via DNS tunneling." },
};

const RISK_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#f59e0b",
  Low:      "#22c55e",
};

function getResolutionSteps(event: GeoTrafficEvent): Array<{ step: string; detail: string }> {
  if (!event.isSuspicious) return [];
  const port = event.dstPort;
  const portInfo = PORTS_INFO[port];

  const baseSteps: Array<{ step: string; detail: string }> = [
    {
      step: `Block source IP ${event.srcIp} at the firewall`,
      detail: `Add a deny rule for ${event.srcIp}/32 on your perimeter firewall immediately. Use iptables, UFW, or your cloud security group.`,
    },
    {
      step: "Review all logs from this IP",
      detail: `Search your access logs for ${event.srcIp} to find how long this has been going on and what else was accessed.`,
    },
  ];

  if (port === 22) return [
    ...baseSteps,
    { step: "Disable password-based SSH authentication", detail: "Edit /etc/ssh/sshd_config: set PasswordAuthentication no, then restart sshd. Use key-based auth only." },
    { step: "Enable SSH rate limiting", detail: "Use fail2ban to auto-ban IPs with >5 failed attempts. Install: apt install fail2ban, then configure jail.local." },
    { step: "Move SSH to a non-standard port", detail: "Change Port 22 to something like 2222 in sshd_config. This reduces automated scanning significantly." },
  ];

  if (port === 3389) return [
    ...baseSteps,
    { step: "Enable Network Level Authentication (NLA)", detail: "In System Properties → Remote → require NLA. This stops unauthenticated RDP probes." },
    { step: "Restrict RDP to VPN only", detail: "Block port 3389 on the public firewall. Access RDP only through an encrypted VPN tunnel." },
    { step: "Enable account lockout policy", detail: "In Group Policy: Computer Configuration → Windows Settings → Account Policies → set lockout at 5 attempts." },
  ];

  if (port === 445) return [
    ...baseSteps,
    { step: "Block SMB at the network perimeter", detail: "Block TCP/UDP 445 on your border firewall — SMB should never be exposed to the internet." },
    { step: "Apply latest Windows patches", detail: "Ensure MS17-010 (EternalBlue) and related patches are applied. Run Windows Update immediately." },
    { step: "Disable SMBv1", detail: "In PowerShell (Admin): Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force" },
  ];

  if (port === 4444 || port === 31337 || port === 6667) return [
    { step: "⚠ URGENT: Isolate affected host immediately", detail: `The destination ${event.dstIp} may be compromised. Disconnect it from the network NOW to prevent lateral movement.` },
    { step: "Run malware scan on affected host", detail: "Boot from a clean recovery environment. Scan with ClamAV, Malwarebytes, or your EDR solution." },
    { step: "Preserve forensic evidence", detail: "Take a memory dump and disk image before remediation. Use tools like Volatility and dd." },
    { step: "Block the external C2 IP", detail: `Block ${event.direction === "outbound" ? event.dstIp : event.srcIp} at the firewall and update threat intelligence feeds.` },
    { step: "Rotate all credentials", detail: "Assume all credentials on the compromised host are exposed. Rotate passwords, API keys, and certificates." },
  ];

  return [
    ...baseSteps,
    { step: `Close port ${port} if not required`, detail: `If ${portInfo?.name || `port ${port}`} is not needed, disable the service and block it at the firewall.` },
    { step: "Monitor for continued activity", detail: "Set up alerts for any further connections from this IP or on this port." },
  ];
}

interface TrafficDetailModalProps {
  event: GeoTrafficEvent;
  onClose: () => void;
}

export function TrafficDetailModal({ event, onClose }: TrafficDetailModalProps) {
  const [tab, setTab] = useState<"details" | "analysis" | "resolve">("details");
  const portInfo = PORTS_INFO[event.dstPort];
  const riskLevel = portInfo?.risk ?? (event.isSuspicious ? "High" : "Low");
  const riskColor = RISK_COLORS[riskLevel] ?? "#22c55e";
  const steps = getResolutionSteps(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden"
        style={{ background: "#0a1628", borderColor: event.isSuspicious ? "#ef4444" : "#1e3a5f",
          boxShadow: event.isSuspicious ? "0 0 40px rgba(239,68,68,0.25)" : "0 0 40px rgba(0,0,0,0.5)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b" style={{ borderColor: "#1e3a5f" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {event.isSuspicious
                ? <ShieldAlert className="w-4 h-4 text-red-400" />
                : <CheckCircle className="w-4 h-4 text-emerald-400" />}
              <span className="font-bold text-white text-base font-mono">
                {event.protocol} {event.direction.toUpperCase()} · Port {event.dstPort}
                {portInfo ? ` (${portInfo.name})` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {event.isSuspicious && (
                <span className="px-2 py-0.5 rounded text-xs font-bold border"
                  style={{ background: `${riskColor}20`, color: riskColor, borderColor: `${riskColor}40` }}>
                  {riskLevel} Risk
                </span>
              )}
              <span className="text-slate-500 text-xs font-mono">
                {event.srcIp}:{event.srcPort} → {event.dstIp}:{event.dstPort}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "#1e3a5f" }}>
          {(["details", "analysis", "resolve"] as const).filter(t => t !== "resolve" || event.isSuspicious).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2.5 text-sm font-medium capitalize transition-colors"
              style={{
                color: tab === t ? "#60a5fa" : "#64748b",
                borderBottom: tab === t ? "2px solid #60a5fa" : "2px solid transparent",
              }}>
              {t === "details" && <><Info className="w-3.5 h-3.5 inline mr-1.5" />Details</>}
              {t === "analysis" && <><ShieldAlert className="w-3.5 h-3.5 inline mr-1.5" />Analysis</>}
              {t === "resolve" && <><Lightbulb className="w-3.5 h-3.5 inline mr-1.5" />How to Resolve</>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96">
          {tab === "details" && (
            <div className="space-y-3 text-sm font-mono">
              <Section title="Location">
                <Row icon={<MapPin className="w-3.5 h-3.5" />} label="City / Country"
                  value={`${event.city || "Unknown"}, ${event.country || "Unknown"}`} />
                <Row icon={<Globe className="w-3.5 h-3.5" />} label="Coordinates"
                  value={event.lat && event.lon ? `${event.lat.toFixed(4)}°N, ${event.lon.toFixed(4)}°E` : "N/A"} />
              </Section>
              <Section title="Network">
                <Row label="Source"      value={`${event.srcIp}:${event.srcPort}`} />
                <Row label="Destination" value={`${event.dstIp}:${event.dstPort}`} />
                <Row label="Protocol"    value={event.protocol} />
                <Row label="Direction"   value={event.direction.toUpperCase()} />
                <Row label="Data Size"   value={formatBytes(event.bytes)} />
              </Section>
              <Section title="Timing">
                <Row icon={<Clock className="w-3.5 h-3.5" />} label="Timestamp"
                  value={formatDateTime(event.timestamp)} />
              </Section>
              {event.suspicionReason && (
                <div className="mt-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                  <p className="text-red-400 text-xs font-bold mb-1">⚠ Suspicion Reason</p>
                  <p className="text-red-300 text-xs">{event.suspicionReason}</p>
                </div>
              )}
            </div>
          )}

          {tab === "analysis" && (
            <div className="space-y-3 text-sm">
              {portInfo ? (
                <>
                  <div className="p-3 rounded-lg border" style={{ borderColor: `${riskColor}40`, background: `${riskColor}10` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold" style={{ color: riskColor }}>{portInfo.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${riskColor}20`, color: riskColor }}>
                        {riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">{portInfo.desc}</p>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-xs">No specific port intelligence available for port {event.dstPort}.</p>
              )}
              <Section title="Traffic Pattern">
                <Row label="Protocol"   value={event.protocol} />
                <Row label="Direction"  value={event.direction} />
                <Row label="Volume"     value={formatBytes(event.bytes)} />
                <Row label="Port"       value={`${event.dstPort} ${portInfo ? `(${portInfo.name})` : ""}`} />
              </Section>
              {event.isSuspicious && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <p className="text-amber-400 text-xs font-bold mb-1">Threat Assessment</p>
                  <p className="text-amber-300 text-xs">
                    This traffic pattern matches known attack vectors. The source IP {event.srcIp} from {event.country} 
                    is communicating on a port commonly associated with {portInfo?.name || "suspicious activity"}.
                    Immediate investigation is recommended.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "resolve" && steps.length > 0 && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs mb-3">
                Follow these steps to investigate and remediate this security event:
              </p>
              {steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40
                    text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium mb-0.5">{s.step}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-slate-500 text-xs uppercase tracking-wider mb-1.5">{title}</p>
      <div className="space-y-1.5 bg-white/5 rounded-lg p-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 text-slate-500 text-xs shrink-0">{icon}{label}</span>
      <span className="text-slate-200 text-xs text-right break-all">{value}</span>
    </div>
  );
}
