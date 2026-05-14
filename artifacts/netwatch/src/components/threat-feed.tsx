import { useEffect, useRef, useState } from "react";
import { useListAlerts, getListAlertsQueryKey, Alert } from "@workspace/api-client-react";
import { AlertDetailModal } from "@/components/alert-detail-modal";
import { formatDateTime } from "@/lib/utils";
import { X, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { usePause } from "@/lib/pause";

// ── Types ──────────────────────────────────────────────────────────────────
interface LiveNotif {
  id: string;
  alert: Alert;
  expiresAt: number;
  visible: boolean;
}

// ── Severity helpers ───────────────────────────────────────────────────────
const SEV: Record<string, { color: string; bg: string; border: string; Icon: React.FC<{ className?: string }> }> = {
  critical: { color: "#ef4444", bg: "#ef444415", border: "#ef444440", Icon: ShieldAlert },
  high:     { color: "#f97316", bg: "#f9731615", border: "#f9731640", Icon: AlertTriangle },
  medium:   { color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b40", Icon: AlertTriangle },
  low:      { color: "#22c55e", bg: "#22c55e15", border: "#22c55e40", Icon: Info },
};
function sev(s: string) { return SEV[s] ?? SEV.low; }

// ── Sliding toast notification ─────────────────────────────────────────────
function ToastNotif({ notif, onClose, onView }: { notif: LiveNotif; onClose: () => void; onView: () => void }) {
  const s = sev(notif.alert.severity);
  const SevIcon = s.Icon;
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="pointer-events-auto w-80 rounded-lg border shadow-2xl overflow-hidden font-mono text-xs transition-all duration-300"
      style={{
        background: "#0a1628",
        borderColor: s.border,
        boxShadow: `0 0 24px ${s.color}30`,
        transform: entering ? "translateX(120%)" : "translateX(0)",
        opacity: entering ? 0 : 1,
      }}>
      {/* Severity bar */}
      <div className="h-1 w-full" style={{ background: s.color }} />

      <div className="p-3">
        <div className="flex items-start gap-2">
          <SevIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: s.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-bold text-white truncate">{notif.alert.type}</span>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-black"
                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                {notif.alert.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed line-clamp-2">{notif.alert.message}</p>
            {notif.alert.srcIp && (
              <p className="text-slate-600 mt-0.5">from {notif.alert.srcIp}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: "#1e3a5f" }}>
          <span className="text-slate-600">{new Date(notif.alert.timestamp).toLocaleTimeString()}</span>
          <button onClick={onView}
            className="text-xs font-medium transition-colors hover:text-white"
            style={{ color: s.color }}>
            View Details →
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <AutoDismissBar color={s.color} duration={8000} onExpire={onClose} />
    </div>
  );
}

function AutoDismissBar({ color, duration, onExpire }: { color: string; duration: number; onExpire: () => void }) {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setWidth(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration, onExpire]);

  return (
    <div className="h-0.5 w-full" style={{ background: "#1e3a5f" }}>
      <div className="h-full transition-none" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

// ── Toast stack (top-right overlay) ───────────────────────────────────────
export function ThreatToastStack() {
  const { paused } = usePause();
  const [notifs, setNotifs] = useState<LiveNotif[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const seenIds = useRef(new Set<number>());
  const initialised = useRef(false);

  const { data: alerts } = useListAlerts(
    { resolved: false },
    { query: { queryKey: getListAlertsQueryKey({ resolved: false }), refetchInterval: paused ? false : 3000 } }
  );

  useEffect(() => {
    if (!alerts) return;

    if (!initialised.current) {
      // On first load, mark all existing alerts as seen (don't toast them)
      alerts.forEach(a => seenIds.current.add(a.id));
      initialised.current = true;
      return;
    }

    const newAlerts = alerts.filter(a => !seenIds.current.has(a.id));
    if (newAlerts.length === 0) return;

    newAlerts.forEach(a => seenIds.current.add(a.id));

    setNotifs(prev => [
      ...newAlerts.map(a => ({
        id: `${a.id}-${Date.now()}`,
        alert: a,
        expiresAt: Date.now() + 8000,
        visible: true,
      })),
      ...prev,
    ].slice(0, 5)); // max 5 toasts
  }, [alerts]);

  const dismiss = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));

  if (notifs.length === 0 && !selected) return null;

  return (
    <>
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifs.map(n => (
          <ToastNotif
            key={n.id}
            notif={n}
            onClose={() => dismiss(n.id)}
            onView={() => { setSelected(n.alert); dismiss(n.id); }}
          />
        ))}
      </div>

      {selected && <AlertDetailModal alert={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ── Persistent panel (shown inside dashboard card) ────────────────────────
export function ThreatFeedPanel() {
  const { paused } = usePause();
  const [selected, setSelected] = useState<Alert | null>(null);

  const { data: alerts, isLoading } = useListAlerts(
    { resolved: false },
    { query: { queryKey: getListAlertsQueryKey({ resolved: false, _feed: true } as any), refetchInterval: paused ? false : 3000 } }
  );

  const recent = (alerts ?? []).slice(0, 8);

  return (
    <>
      <div className="space-y-0 divide-y divide-border rounded-md border border-border overflow-hidden">
        {isLoading && (
          <div className="py-6 text-center text-muted-foreground text-sm">Loading threats…</div>
        )}

        {!isLoading && recent.length === 0 && (
          <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <span className="text-sm">No active threats — all clear</span>
          </div>
        )}

        {recent.map((alert) => {
          const s = sev(alert.severity);
          const SevIcon = s.Icon;
          return (
            <button
              key={alert.id}
              onClick={() => setSelected(alert)}
              className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3 group">

              {/* Severity dot + icon */}
              <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <SevIcon className="w-4 h-4" style={{ color: s.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{alert.type}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase"
                    style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.message}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-mono">
                  {alert.srcIp && <span>{alert.srcIp}</span>}
                  <span>{formatDateTime(alert.timestamp)}</span>
                </div>
              </div>

              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors self-center shrink-0">
                →
              </span>
            </button>
          );
        })}
      </div>

      {selected && <AlertDetailModal alert={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
