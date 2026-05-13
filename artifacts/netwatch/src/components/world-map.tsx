import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoEqualEarth } from "d3-geo";
import { useMemo, useState, useCallback, useRef } from "react";
import { GeoTrafficEvent } from "@workspace/api-client-react";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { X, ShieldAlert, ArrowDownToLine, ArrowUpToLine, MapPin, Globe, Clock, Wifi } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;
const HOME: [number, number] = [-74.006, 40.7128];
const HOME_LABEL = "New York (Home)";

const projection = geoEqualEarth().scale(153).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

function project(lon: number, lat: number): [number, number] | null {
  const p = projection([lon, lat]);
  return p ? [p[0], p[1]] : null;
}

function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const lift = dist * 0.35;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const px = -dy / dist;
  const py = dx / dist;
  return `M ${x1} ${y1} Q ${mx + px * lift} ${my + py * lift} ${x2} ${y2}`;
}

type ArcColor = "in" | "out" | "alert";

function colorFor(e: GeoTrafficEvent): ArcColor {
  if (e.isSuspicious) return "alert";
  if (e.direction === "inbound") return "in";
  return "out";
}

const COLORS: Record<ArcColor, { stroke: string; dot: string; glow: string }> = {
  in:    { stroke: "#00e5c8", dot: "#00e5c8", glow: "rgba(0,229,200,0.5)" },
  out:   { stroke: "#f59e0b", dot: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
  alert: { stroke: "#ef4444", dot: "#ef4444", glow: "rgba(239,68,68,0.6)" },
};

function dedup(events: GeoTrafficEvent[]): GeoTrafficEvent[] {
  const seen = new Set<string>();
  const result: GeoTrafficEvent[] = [];
  const sorted = [...events].sort((a, b) =>
    a.isSuspicious === b.isSuspicious ? 0 : a.isSuspicious ? -1 : 1
  );
  for (const e of sorted) {
    if (!e.lat || !e.lon) continue;
    const key = `${Math.round(e.lon)},${Math.round(e.lat)},${colorFor(e)}`;
    if (!seen.has(key)) { seen.add(key); result.push(e); }
  }
  return result.slice(0, 40);
}

const CSS = `
@keyframes nw-dash { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
@keyframes nw-pulse-ring { 0% { r: 4; opacity: 0.8; } 70% { r: 10; opacity: 0; } 100% { r: 10; opacity: 0; } }
@keyframes nw-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes nw-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;

interface Tooltip {
  x: number; y: number;
  event: GeoTrafficEvent;
}

interface ArcProps {
  event: GeoTrafficEvent;
  homeXY: [number, number];
  idx: number;
  selected: boolean;
  onHover: (e: GeoTrafficEvent | null, x?: number, y?: number) => void;
  onClick: (e: GeoTrafficEvent) => void;
}

function Arc({ event, homeXY, idx, selected, onHover, onClick }: ArcProps) {
  if (!event.lat || !event.lon) return null;
  const dest = project(event.lon, event.lat);
  if (!dest) return null;
  const [hx, hy] = homeXY;
  const [dx, dy] = dest;
  const path = arcPath(hx, hy, dx, dy);
  const col = colorFor(event);
  const { stroke, dot, glow } = COLORS[col];
  const dur = 1.2 + (idx % 5) * 0.3;
  const opacity = selected ? 1 : 0.75;
  const width = selected ? 2.5 : 1.5;

  return (
    <g style={{ cursor: "pointer" }}
      onMouseMove={(ev) => onHover(event, ev.clientX, ev.clientY)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(event)}
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={6} strokeOpacity={0}
        style={{ cursor: "pointer" }} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={width * 2} strokeOpacity={0.1}
        strokeDasharray="10 8" />
      <path d={path} fill="none" stroke={stroke} strokeWidth={width} strokeOpacity={opacity}
        strokeDasharray="10 8" strokeLinecap="round"
        style={{ animation: `nw-dash ${dur}s linear infinite`, filter: `drop-shadow(0 0 3px ${glow})` }}
      />
      <circle r={2.5} fill={dot} opacity={0.9}>
        <animateMotion dur={`${dur * 1.4}s`} repeatCount="indefinite" begin={`${(idx * 0.3) % 2}s`}>
          <mpath href={`#arc-path-${event.id}`} />
        </animateMotion>
      </circle>
      <path id={`arc-path-${event.id}`} d={path} fill="none" stroke="none" />
      <circle cx={dx} cy={dy} r={selected ? 6 : 4} fill={dot} opacity={0.95}
        style={{ filter: `drop-shadow(0 0 ${selected ? 8 : 4}px ${glow})` }}
      />
      {event.isSuspicious && (
        <circle cx={dx} cy={dy} fill="none" stroke={dot} strokeWidth={1.5}
          style={{ animation: "nw-pulse-ring 1.6s ease-out infinite" }}
        />
      )}
    </g>
  );
}

function SeverityBadge({ suspicious }: { suspicious?: boolean }) {
  return suspicious
    ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">⚠ SUSPICIOUS</span>
    : <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">CLEAN</span>;
}

interface EventDetailProps {
  event: GeoTrafficEvent;
  onClose: () => void;
}

function EventDetail({ event, onClose }: EventDetailProps) {
  const col = COLORS[colorFor(event)];
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}>
      <div className="relative w-80 rounded-lg border p-4 shadow-2xl font-mono text-xs"
        style={{ background: "#0a1628", borderColor: col.stroke, boxShadow: `0 0 24px ${col.glow}` }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot, boxShadow: `0 0 6px ${col.glow}` }} />
          <span className="text-white font-bold text-sm">Packet Detail</span>
          <SeverityBadge suspicious={event.isSuspicious} />
        </div>
        <div className="space-y-2 text-slate-300">
          <Row icon={<MapPin className="w-3 h-3 text-cyan-400" />} label="Location"
            value={`${event.city || "Unknown"}, ${event.country || "Unknown"}`} />
          <Row icon={<Globe className="w-3 h-3 text-slate-400" />} label="Coordinates"
            value={event.lat && event.lon ? `${event.lat.toFixed(3)}° N, ${event.lon.toFixed(3)}° E` : "N/A"} />
          <div className="border-t border-white/10 my-2" />
          <Row label="Source IP"    value={`${event.srcIp}:${event.srcPort}`} mono />
          <Row label="Dest IP"      value={`${event.dstIp}:${event.dstPort}`} mono />
          <Row label="Protocol"     value={event.protocol} mono />
          <Row label="Direction"    value={event.direction.toUpperCase()} mono />
          <Row label="Transferred"  value={formatBytes(event.bytes)} mono />
          <div className="border-t border-white/10 my-2" />
          <Row icon={<Clock className="w-3 h-3 text-slate-400" />} label="Time"
            value={formatDateTime(event.timestamp)} />
          {event.isSuspicious && event.suspicionReason && (
            <div className="mt-2 p-2 rounded border border-red-500/30 bg-red-500/10 text-red-400">
              ⚠ {event.suspicionReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="flex items-center gap-1 text-slate-500 shrink-0">{icon}{label}</span>
      <span className={`text-right text-slate-200 ${mono ? "font-mono" : ""} break-all`}>{value}</span>
    </div>
  );
}

interface CountryPanelProps {
  country: string;
  events: GeoTrafficEvent[];
  onClose: () => void;
  onSelectEvent: (e: GeoTrafficEvent) => void;
}

function CountryPanel({ country, events, onClose, onSelectEvent }: CountryPanelProps) {
  const suspicious = events.filter(e => e.isSuspicious);
  const clean = events.filter(e => !e.isSuspicious);
  const totalBytes = events.reduce((s, e) => s + e.bytes, 0);
  const sample = events[0];
  const city = sample?.city || "";

  return (
    <div className="absolute top-10 right-0 bottom-0 w-72 z-20 flex flex-col font-mono text-xs overflow-hidden"
      style={{ background: "#08131f", borderLeft: "1px solid rgba(255,255,255,0.08)",
        animation: "nw-slide-in 0.2s ease-out" }}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
        <div>
          <div className="text-white font-bold text-sm">{country}</div>
          {city && <div className="text-slate-500">{city}</div>}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-3 gap-px border-b border-white/10">
        <Stat label="Events" value={events.length} color="#60a5fa" />
        <Stat label="Alerts" value={suspicious.length} color="#ef4444" />
        <Stat label="Volume" value={formatBytes(totalBytes)} color="#00e5c8" small />
      </div>

      <div className="flex-1 overflow-y-auto">
        {suspicious.length > 0 && (
          <Section title="⚠ Suspicious Traffic" count={suspicious.length} color="#ef4444">
            {suspicious.map(e => <EventRow key={e.id} event={e} onClick={() => onSelectEvent(e)} />)}
          </Section>
        )}
        <Section title="Traffic Events" count={clean.length} color="#60a5fa">
          {clean.slice(0, 30).map(e => <EventRow key={e.id} event={e} onClick={() => onSelectEvent(e)} />)}
          {clean.length > 30 && (
            <div className="px-3 py-2 text-slate-600 text-center">+{clean.length - 30} more</div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value, color, small }: { label: string; value: number | string; color: string; small?: boolean }) {
  return (
    <div className="px-3 py-2 text-center">
      <div className={`font-bold ${small ? "text-sm" : "text-lg"}`} style={{ color }}>{value}</div>
      <div className="text-slate-600 text-[10px]">{label}</div>
    </div>
  );
}

function Section({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 py-1.5 flex items-center gap-2 sticky top-0" style={{ background: "#08131f" }}>
        <span style={{ color }} className="font-bold">{title}</span>
        <span className="text-slate-600">({count})</span>
      </div>
      {children}
    </div>
  );
}

function EventRow({ event, onClick }: { event: GeoTrafficEvent; onClick: () => void }) {
  const col = COLORS[colorFor(event)];
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-mono" style={{ color: col.dot }}>{event.protocol}</span>
        <span className="text-slate-400">{formatBytes(event.bytes)}</span>
      </div>
      <div className="flex items-center gap-1 text-slate-500">
        <span>{event.direction === "inbound" ? "←" : "→"}</span>
        <span className="truncate">{event.srcIp}</span>
        <span>→</span>
        <span className="truncate">{event.dstIp}:{event.dstPort}</span>
      </div>
      <div className="text-slate-600 mt-0.5">{new Date(event.timestamp).toLocaleTimeString()}</div>
    </button>
  );
}

export function WorldMap({ events }: { events: GeoTrafficEvent[] }) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GeoTrafficEvent | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const homeXY = useMemo(() => project(HOME[0], HOME[1]) ?? [480, 250] as [number, number], []);
  const arcs = useMemo(() => dedup(events), [events]);

  const byCountry = useMemo(() => {
    const map = new Map<string, GeoTrafficEvent[]>();
    for (const e of events) {
      if (!e.country) continue;
      if (!map.has(e.country)) map.set(e.country, []);
      map.get(e.country)!.push(e);
    }
    return map;
  }, [events]);

  const inCount    = arcs.filter(e => !e.isSuspicious && e.direction === "inbound").length;
  const outCount   = arcs.filter(e => !e.isSuspicious && e.direction !== "inbound").length;
  const alertCount = arcs.filter(e => e.isSuspicious).length;

  const handleArcHover = useCallback((e: GeoTrafficEvent | null, x?: number, y?: number) => {
    if (!e || x === undefined || y === undefined) { setTooltip(null); return; }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: x - rect.left, y: y - rect.top, event: e });
  }, []);

  const handleArcClick = useCallback((e: GeoTrafficEvent) => {
    if (e.country) setSelectedCountry(e.country);
  }, []);

  const handleGeoClick = useCallback((geoName: string) => {
    if (byCountry.has(geoName)) setSelectedCountry(geoName);
  }, [byCountry]);

  const countryEvents = selectedCountry ? (byCountry.get(selectedCountry) ?? []) : [];

  const tooltipEvent = tooltip?.event;
  const ttCol = tooltipEvent ? COLORS[colorFor(tooltipEvent)] : null;

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-b-lg overflow-hidden select-none"
      style={{ background: "#060f1e" }}>
      <style>{CSS}</style>

      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2"
        style={{ background: "rgba(6,15,30,0.9)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Live World Map</span>
        <div className="flex items-center gap-4 text-xs font-mono">
          {[
            { label: "IN",    count: inCount,    color: "#00e5c8" },
            { label: "OUT",   count: outCount,   color: "#f59e0b" },
            { label: "ALERT", count: alertCount, color: "#ef4444" },
          ].map(({ label, count, color }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-slate-300">{label} <span className="text-slate-500">{count}</span></span>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#60a5fa" }} />
            <span className="text-slate-300">HOME</span>
          </span>
          <span className="flex items-center gap-1.5 text-green-400 font-semibold"
            style={{ animation: "nw-blink 1.4s ease-in-out infinite" }}>
            <span className="w-2 h-2 rounded-full bg-green-400" />LIVE
          </span>
          <span className="text-slate-600">· click country or arc for details</span>
        </div>
      </div>

      {/* Map */}
      <ComposableMap width={MAP_WIDTH} height={MAP_HEIGHT}
        style={{ width: "100%", height: "100%" }}
        projectionConfig={{ scale: 153 }}>

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name: string = geo.properties.name;
              const hasTraffic = byCountry.has(name);
              const isHovered = hoveredCountry === name;
              const isSelected = selectedCountry === name;
              const hasSuspicious = hasTraffic && (byCountry.get(name)?.some(e => e.isSuspicious) ?? false);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isSelected ? "#1a3a5c" : isHovered && hasTraffic ? "#122b44" : hasSuspicious ? "#1f1018" : "#0d2137"}
                  stroke={isSelected ? "#60a5fa" : hasSuspicious ? "#ef444422" : "#112e4a"}
                  strokeWidth={isSelected ? 0.8 : 0.4}
                  style={{
                    default: { outline: "none", cursor: hasTraffic ? "pointer" : "default" },
                    hover:   { outline: "none", cursor: hasTraffic ? "pointer" : "default",
                               fill: hasTraffic ? "#122b44" : undefined },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={() => hasTraffic && setHoveredCountry(name)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => handleGeoClick(name)}
                />
              );
            })
          }
        </Geographies>

        {arcs.map((event, idx) => (
          <Arc key={event.id} event={event} homeXY={homeXY as [number,number]} idx={idx}
            selected={selectedCountry === event.country}
            onHover={handleArcHover}
            onClick={handleArcClick}
          />
        ))}

        {/* Home node */}
        <g style={{ cursor: "default" }}>
          <circle cx={homeXY[0]} cy={homeXY[1]} r={7} fill="#60a5fa"
            style={{ filter: "drop-shadow(0 0 8px rgba(96,165,250,0.9))" }} />
          <circle cx={homeXY[0]} cy={homeXY[1]} r={12} fill="none"
            stroke="#60a5fa" strokeWidth={1} strokeOpacity={0.3} />
          <circle cx={homeXY[0]} cy={homeXY[1]} r={3} fill="#fff" opacity={0.9} />
        </g>
      </ComposableMap>

      {/* Floating tooltip */}
      {tooltip && ttCol && (
        <div className="absolute z-20 pointer-events-none font-mono text-xs rounded border shadow-2xl"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 800) - 240),
            top: Math.max(tooltip.y - 10, 50),
            background: "#0a1628", borderColor: ttCol.stroke,
            boxShadow: `0 0 16px ${ttCol.glow}`, width: 220,
          }}>
          <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: ttCol.stroke + "40" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: ttCol.dot }} />
            <span className="text-white font-bold">{tooltip.event.country || "Unknown"}</span>
            {tooltip.event.isSuspicious && <span className="text-red-400 text-[10px]">⚠ SUSPICIOUS</span>}
          </div>
          <div className="px-3 py-2 space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />City</span>
              <span>{tooltip.event.city || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Coords</span>
              <span className="text-[10px]">{tooltip.event.lat?.toFixed(2)}°, {tooltip.event.lon?.toFixed(2)}°</span>
            </div>
            <div className="border-t border-white/10 my-1" />
            <div className="flex justify-between">
              <span className="text-slate-500">From</span>
              <span style={{ color: ttCol.dot }}>{tooltip.event.srcIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">To</span>
              <span>{tooltip.event.dstIp}:{tooltip.event.dstPort}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Protocol</span>
              <span>{tooltip.event.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Size</span>
              <span>{formatBytes(tooltip.event.bytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Direction</span>
              <span className="uppercase">{tooltip.event.direction}</span>
            </div>
          </div>
          <div className="px-3 py-1.5 border-t text-slate-600 text-[10px]" style={{ borderColor: ttCol.stroke + "30" }}>
            Click to see all traffic from {tooltip.event.country}
          </div>
        </div>
      )}

      {/* Country detail panel */}
      {selectedCountry && countryEvents.length > 0 && (
        <CountryPanel
          country={selectedCountry}
          events={countryEvents}
          onClose={() => setSelectedCountry(null)}
          onSelectEvent={setSelectedEvent}
        />
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
