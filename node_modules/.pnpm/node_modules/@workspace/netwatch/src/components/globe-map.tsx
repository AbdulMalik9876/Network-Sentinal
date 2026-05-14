import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import {
  geoOrthographic, geoPath, geoGraticule, geoInterpolate, GeoPermissibleObjects
} from "d3-geo";
import { feature } from "topojson-client";
import { GeoTrafficEvent } from "@workspace/api-client-react";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { X, MapPin, Globe, Clock } from "lucide-react";

type Topology = Parameters<typeof feature>[0];

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const HOME_LONLAT: [number, number] = [-74.006, 40.7128]; // New York

const ARC_COLORS = {
  in:    { stroke: "#00e5c8", dot: "#00e5c8", glow: "rgba(0,229,200,0.6)" },
  out:   { stroke: "#f59e0b", dot: "#f59e0b", glow: "rgba(245,158,11,0.6)" },
  alert: { stroke: "#ef4444", dot: "#ef4444", glow: "rgba(239,68,68,0.7)" },
} as const;
type ArcKind = keyof typeof ARC_COLORS;

function kindOf(e: GeoTrafficEvent): ArcKind {
  if (e.isSuspicious) return "alert";
  return e.direction === "inbound" ? "in" : "out";
}

function dedup(events: GeoTrafficEvent[]): GeoTrafficEvent[] {
  const seen = new Set<string>();
  const result: GeoTrafficEvent[] = [];
  const sorted = [...events].sort((a, b) =>
    a.isSuspicious === b.isSuspicious ? 0 : a.isSuspicious ? -1 : 1
  );
  for (const e of sorted) {
    if (!e.lat || !e.lon) continue;
    const key = `${Math.round(e.lon)},${Math.round(e.lat)},${kindOf(e)}`;
    if (!seen.has(key)) { seen.add(key); result.push(e); }
  }
  return result.slice(0, 35);
}

// Check if a lon/lat point is on the visible hemisphere of the projection
function isVisible(projection: ReturnType<typeof geoOrthographic>, lon: number, lat: number): boolean {
  const p = projection([lon, lat]);
  return p !== null;
}

interface GlobeTooltip { x: number; y: number; event: GeoTrafficEvent }

export function GlobeMap({
  events,
  onSelectEvent,
}: {
  events: GeoTrafficEvent[];
  onSelectEvent?: (e: GeoTrafficEvent) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([20, -25, 0]);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mouse: [number, number]; rot: [number, number, number] } | null>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(rotation);
  const draggingRef = useRef(false);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 500 });
  const [topology, setTopology] = useState<Topology | null>(null);
  const [tooltip, setTooltip] = useState<GlobeTooltip | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GeoTrafficEvent | null>(null);

  // Fetch world atlas
  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(topo => setTopology(topo))
      .catch(() => {});
  }, []);

  // Track svg size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setSvgSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = svgSize.w;
  const H = svgSize.h;
  const SCALE = Math.min(W, H) * 0.43;

  // Auto-rotate
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    draggingRef.current = dragging;
  }, [dragging]);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!draggingRef.current) {
        setRotation(r => [r[0] - dt * 0.012, r[1], r[2]]);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Build projection
  const projection = useMemo(() =>
    geoOrthographic()
      .scale(SCALE)
      .translate([W / 2, H / 2])
      .rotate(rotation)
      .clipAngle(90),
    [rotation, W, H, SCALE]
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  // Graticule
  const graticule = useMemo(() => geoGraticule()(), []);
  const graticulePath = useMemo(() => pathGen(graticule as GeoPermissibleObjects) ?? "", [pathGen, graticule]);

  // Sphere outline
  const spherePath = useMemo(() =>
    pathGen({ type: "Sphere" } as GeoPermissibleObjects) ?? "", [pathGen]);

  // Countries
  const countryFeatures = useMemo(() => {
    if (!topology) return [];
    try {
      const t = topology as unknown as { objects: { countries: object } };
      const f = feature(topology, t.objects.countries as Parameters<typeof feature>[1]);
      return "features" in f ? f.features : [];
    } catch { return []; }
  }, [topology]);

  const countryPaths = useMemo(() =>
    countryFeatures.map(f => ({
      id: String(f.id ?? Math.random()),
      d: pathGen(f as GeoPermissibleObjects) ?? "",
    })),
    [countryFeatures, pathGen]
  );

  // Arcs
  const arcs = useMemo(() => dedup(events), [events]);

  const arcPaths = useMemo(() => {
    return arcs.map(e => {
      if (!e.lat || !e.lon) return null;
      const visible = isVisible(projection, e.lon, e.lat);
      const homeVisible = isVisible(projection, HOME_LONLAT[0], HOME_LONLAT[1]);

      // Great circle interpolation with 60 points
      const interp = geoInterpolate(HOME_LONLAT, [e.lon, e.lat]);
      const line: GeoPermissibleObjects = {
        type: "LineString",
        coordinates: Array.from({ length: 60 }, (_, i) => interp(i / 59)),
      };
      const d = pathGen(line);
      if (!d) return null;

      const kind = kindOf(e);
      const col = ARC_COLORS[kind];
      const destPt = projection([e.lon, e.lat]);
      const homePt = projection(HOME_LONLAT);

      return { e, d, col, destPt, homePt, visible, homeVisible };
    }).filter(Boolean);
  }, [arcs, pathGen, projection]);

  // Home point
  const homePt = useMemo(() => projection(HOME_LONLAT), [projection]);

  // Mouse interaction
  const handleMouseDown = useCallback((ev: React.MouseEvent) => {
    if ((ev.target as Element).closest(".globe-no-drag")) return;
    setDragging(true);
    dragStart.current = { mouse: [ev.clientX, ev.clientY], rot: rotationRef.current };
    ev.preventDefault();
  }, []);

  const handleMouseMove = useCallback((ev: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = ev.clientX - dragStart.current.mouse[0];
    const dy = ev.clientY - dragStart.current.mouse[1];
    const sens = 0.3;
    setRotation([
      dragStart.current.rot[0] + dx * sens,
      dragStart.current.rot[1] - dy * sens,
      dragStart.current.rot[2],
    ]);
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleArcHover = useCallback((ev: React.MouseEvent, e: GeoTrafficEvent | null) => {
    if (!e) { setTooltip(null); return; }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: ev.clientX - rect.left, y: ev.clientY - rect.top, event: e });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at center, #0a1f3a 0%, #040d1a 100%)", cursor: dragging ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Atmosphere glow */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <radialGradient id="atm" cx="50%" cy="50%" r="50%">
            <stop offset="75%" stopColor="#1a6aff" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a6aff" stopOpacity="0.18" />
          </radialGradient>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {spherePath && (
          <path d={spherePath} fill="url(#atm)" stroke="#1a6aff" strokeWidth={2.5} strokeOpacity={0.25} />
        )}
      </svg>

      <svg ref={svgRef} width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {ARC_COLORS && Object.entries(ARC_COLORS).map(([k, c]) => (
            <filter key={k} id={`glow-${k}`}>
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>

        {/* Globe fill */}
        {spherePath && <path d={spherePath} fill="#050e1e" />}

        {/* Graticule */}
        {graticulePath && <path d={graticulePath} fill="none" stroke="#0d2a4a" strokeWidth={0.4} />}

        {/* Countries */}
        {countryPaths.map(({ id, d }) => d ? (
          <path key={id} d={d} fill="#0d2137" stroke="#112e4a" strokeWidth={0.5} />
        ) : null)}

        {/* Arcs */}
        {arcPaths.map((arc, i) => {
          if (!arc) return null;
          const { e, d, col, destPt } = arc;
          const animDur = 1.8 + (i % 5) * 0.35;
          const animDelay = (i * 0.28) % 2;
          return (
            <g key={e.id} style={{ cursor: "pointer" }}
              onMouseMove={ev => handleArcHover(ev, e)}
              onMouseLeave={ev => handleArcHover(ev, null)}
              onClick={() => { setSelectedEvent(e); onSelectEvent?.(e); }}>
              {/* Glow track */}
              <path d={d} fill="none" stroke={col.stroke} strokeWidth={3}
                strokeOpacity={0.15} strokeLinecap="round" />
              {/* Animated dash */}
              <path d={d} fill="none" stroke={col.stroke} strokeWidth={1.5}
                strokeOpacity={0.85} strokeLinecap="round"
                strokeDasharray="8 6"
                style={{
                  animation: `globe-dash ${animDur}s linear infinite`,
                  animationDelay: `-${animDelay}s`,
                  filter: `drop-shadow(0 0 3px ${col.glow})`,
                }} />
              {/* Dot on destination */}
              {destPt && (
                <>
                  <circle cx={destPt[0]} cy={destPt[1]} r={4} fill={col.dot}
                    style={{ filter: `drop-shadow(0 0 5px ${col.glow})` }} />
                  {e.isSuspicious && (
                    <circle cx={destPt[0]} cy={destPt[1]} r={4}
                      fill="none" stroke={col.dot} strokeWidth={1.5}
                      style={{ animation: "globe-pulse 1.6s ease-out infinite" }} />
                  )}
                </>
              )}
              {/* Animated particle */}
              <circle r={2.5} fill={col.dot} opacity={0.9}
                style={{ filter: `drop-shadow(0 0 4px ${col.glow})` }}>
                <animateMotion dur={`${animDur * 1.3}s`} repeatCount="indefinite"
                  begin={`-${animDelay}s`}>
                  <mpath href={`#globe-arc-${e.id}`} />
                </animateMotion>
              </circle>
              <path id={`globe-arc-${e.id}`} d={d} fill="none" stroke="none" />
            </g>
          );
        })}

        {/* Home node */}
        {homePt && (
          <g style={{ cursor: "default" }}>
            <circle cx={homePt[0]} cy={homePt[1]} r={8} fill="#60a5fa"
              style={{ filter: "drop-shadow(0 0 10px rgba(96,165,250,1))" }} />
            <circle cx={homePt[0]} cy={homePt[1]} r={14} fill="none"
              stroke="#60a5fa" strokeWidth={1} strokeOpacity={0.35}
              style={{ animation: "globe-pulse 2s ease-out infinite" }} />
            <circle cx={homePt[0]} cy={homePt[1]} r={3} fill="#fff" opacity={0.95} />
          </g>
        )}

        {/* Sphere border */}
        {spherePath && <path d={spherePath} fill="none" stroke="#1a4a8a" strokeWidth={1} />}
      </svg>

      <style>{`
        @keyframes globe-dash { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
        @keyframes globe-pulse { 0% { r: 4; opacity: 0.9; } 70% { r: 14; opacity: 0; } 100% { r: 14; opacity: 0; } }
      `}</style>

      {/* Drag hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-600 pointer-events-none">
        drag to rotate · click arc for details
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute z-20 pointer-events-none font-mono text-xs rounded border shadow-2xl"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 800) - 240),
            top: Math.max(tooltip.y - 10, 50),
            background: "#0a1628",
            borderColor: ARC_COLORS[kindOf(tooltip.event)].stroke,
            boxShadow: `0 0 16px ${ARC_COLORS[kindOf(tooltip.event)].glow}`,
            width: 220,
          }}>
          <div className="px-3 py-2 border-b flex items-center gap-2"
            style={{ borderColor: ARC_COLORS[kindOf(tooltip.event)].stroke + "40" }}>
            <div className="w-2 h-2 rounded-full"
              style={{ background: ARC_COLORS[kindOf(tooltip.event)].dot }} />
            <span className="text-white font-bold">{tooltip.event.country || "Unknown"}</span>
            {tooltip.event.isSuspicious && <span className="text-red-400 text-[10px]">⚠ SUSPICIOUS</span>}
          </div>
          <div className="px-3 py-2 space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />City</span>
              <span>{tooltip.event.city || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">From</span>
              <span style={{ color: ARC_COLORS[kindOf(tooltip.event)].dot }}>{tooltip.event.srcIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Protocol</span>
              <span>{tooltip.event.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Size</span>
              <span>{formatBytes(tooltip.event.bytes)}</span>
            </div>
          </div>
          <div className="px-3 py-1.5 border-t text-slate-600 text-[10px]"
            style={{ borderColor: ARC_COLORS[kindOf(tooltip.event)].stroke + "30" }}>
            Click for full packet details
          </div>
        </div>
      )}

      {/* Event detail panel */}
      {selectedEvent && (
        <div className="absolute inset-0 z-30 flex items-center justify-center globe-no-drag"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedEvent(null)}>
          <div className="relative w-80 rounded-lg border p-4 shadow-2xl font-mono text-xs"
            style={{
              background: "#0a1628",
              borderColor: ARC_COLORS[kindOf(selectedEvent)].stroke,
              boxShadow: `0 0 24px ${ARC_COLORS[kindOf(selectedEvent)].glow}`,
            }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)}
              className="absolute top-2 right-2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full"
                style={{ background: ARC_COLORS[kindOf(selectedEvent)].dot,
                  boxShadow: `0 0 6px ${ARC_COLORS[kindOf(selectedEvent)].glow}` }} />
              <span className="text-white font-bold text-sm">Packet Detail</span>
              {selectedEvent.isSuspicious
                ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">⚠ SUSPICIOUS</span>
                : <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">CLEAN</span>
              }
            </div>
            <div className="space-y-2 text-slate-300">
              <DetailRow icon={<MapPin className="w-3 h-3 text-cyan-400" />} label="Location"
                value={`${selectedEvent.city || "Unknown"}, ${selectedEvent.country || "Unknown"}`} />
              <DetailRow icon={<Globe className="w-3 h-3 text-slate-400" />} label="Coordinates"
                value={selectedEvent.lat && selectedEvent.lon
                  ? `${selectedEvent.lat.toFixed(3)}°N, ${selectedEvent.lon.toFixed(3)}°E` : "N/A"} />
              <div className="border-t border-white/10 my-2" />
              <DetailRow label="Source IP"    value={`${selectedEvent.srcIp}:${selectedEvent.srcPort}`} mono />
              <DetailRow label="Dest IP"      value={`${selectedEvent.dstIp}:${selectedEvent.dstPort}`} mono />
              <DetailRow label="Protocol"     value={selectedEvent.protocol} mono />
              <DetailRow label="Direction"    value={selectedEvent.direction.toUpperCase()} mono />
              <DetailRow label="Transferred"  value={formatBytes(selectedEvent.bytes)} mono />
              <div className="border-t border-white/10 my-2" />
              <DetailRow icon={<Clock className="w-3 h-3 text-slate-400" />}
                label="Time" value={formatDateTime(selectedEvent.timestamp)} />
              {selectedEvent.isSuspicious && selectedEvent.suspicionReason && (
                <div className="mt-2 p-2 rounded border border-red-500/30 bg-red-500/10 text-red-400">
                  ⚠ {selectedEvent.suspicionReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="flex items-center gap-1 text-slate-500 shrink-0">{icon}{label}</span>
      <span className={`text-right text-slate-200 ${mono ? "font-mono" : ""} break-all`}>{value}</span>
    </div>
  );
}
