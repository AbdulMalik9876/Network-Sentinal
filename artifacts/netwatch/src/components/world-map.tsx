import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoEqualEarth } from "d3-geo";
import { useMemo, useEffect, useRef } from "react";
import { GeoTrafficEvent } from "@workspace/api-client-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;

// Home node location — "your network"
const HOME: [number, number] = [-74.006, 40.7128]; // New York

const projection = geoEqualEarth()
  .scale(153)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

function project(lon: number, lat: number): [number, number] | null {
  const p = projection([lon, lat]);
  return p ? [p[0], p[1]] : null;
}

function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Control point lifts the arc upward relative to the chord
  const lift = dist * 0.35;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  // Perpendicular direction (rotate 90°)
  const px = -dy / dist;
  const py = dx / dist;
  const cx = mx + px * lift;
  const cy = my + py * lift;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function arcLength(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy) * 1.3; // approx bezier length
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

// Deduplicate events — keep one per unique rounded location + direction
function dedup(events: GeoTrafficEvent[]): GeoTrafficEvent[] {
  const seen = new Set<string>();
  const result: GeoTrafficEvent[] = [];
  // Sort alerts first so they get kept over normal
  const sorted = [...events].sort((a, b) => {
    if (a.isSuspicious && !b.isSuspicious) return -1;
    if (!a.isSuspicious && b.isSuspicious) return 1;
    return 0;
  });
  for (const e of sorted) {
    if (!e.lat || !e.lon) continue;
    const key = `${Math.round(e.lon)},${Math.round(e.lat)},${colorFor(e)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(e);
    }
  }
  return result.slice(0, 40);
}

const CSS = `
@keyframes nw-dash {
  from { stroke-dashoffset: 200; }
  to   { stroke-dashoffset: 0; }
}
@keyframes nw-pulse-ring {
  0%   { r: 4; opacity: 0.8; }
  70%  { r: 10; opacity: 0; }
  100% { r: 10; opacity: 0; }
}
@keyframes nw-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
`;

interface ArcProps {
  event: GeoTrafficEvent;
  homeXY: [number, number];
  idx: number;
}

function Arc({ event, homeXY, idx }: ArcProps) {
  if (!event.lat || !event.lon) return null;
  const dest = project(event.lon, event.lat);
  if (!dest) return null;

  const [hx, hy] = homeXY;
  const [dx, dy] = dest;
  const path = arcPath(hx, hy, dx, dy);
  const len = arcLength(hx, hy, dx, dy);
  const col = colorFor(event);
  const { stroke, dot, glow } = COLORS[col];
  const dashLen = 10;
  const gapLen = 8;
  const dur = 1.2 + (idx % 5) * 0.3; // stagger speeds

  const motionId = `pkt-${event.id}`;

  return (
    <g>
      {/* Glow trail */}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeOpacity={0.15}
        strokeDasharray={`${dashLen} ${gapLen}`}
      />
      {/* Animated dashed arc */}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeOpacity={0.75}
        strokeDasharray={`${dashLen} ${gapLen}`}
        strokeLinecap="round"
        style={{
          animation: `nw-dash ${dur}s linear infinite`,
          filter: `drop-shadow(0 0 3px ${glow})`,
        }}
      />
      {/* Packet dot moving along arc */}
      <circle r={2.5} fill={dot} opacity={0.9}>
        <animateMotion
          dur={`${dur * 1.4}s`}
          repeatCount="indefinite"
          begin={`${(idx * 0.3) % 2}s`}
        >
          <mpath href={`#arc-path-${event.id}`} />
        </animateMotion>
      </circle>
      {/* Hidden path for animateMotion reference */}
      <path id={`arc-path-${event.id}`} d={path} fill="none" stroke="none" />
      {/* Destination dot */}
      <circle cx={dx} cy={dy} r={3.5} fill={dot} opacity={0.9}
        style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
      />
      {/* Pulse ring on alert */}
      {event.isSuspicious && (
        <circle cx={dx} cy={dy} fill="none" stroke={dot} strokeWidth={1.2}
          style={{ animation: "nw-pulse-ring 1.6s ease-out infinite" }}
        />
      )}
    </g>
  );
}

export function WorldMap({ events }: { events: GeoTrafficEvent[] }) {
  const homeXY = useMemo(() => {
    const p = project(HOME[0], HOME[1]);
    return p ?? ([480, 250] as [number, number]);
  }, []);

  const arcs = useMemo(() => dedup(events), [events]);

  const inCount  = arcs.filter(e => !e.isSuspicious && e.direction === "inbound").length;
  const outCount = arcs.filter(e => !e.isSuspicious && e.direction !== "inbound").length;
  const alertCount = arcs.filter(e => e.isSuspicious).length;

  return (
    <div className="relative w-full h-full rounded-b-lg overflow-hidden"
         style={{ background: "#060f1e" }}>
      <style>{CSS}</style>

      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2"
           style={{ background: "rgba(6,15,30,0.85)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Live World Map</span>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#00e5c8" }} />
            <span className="text-slate-300">IN <span className="text-slate-500">{inCount}</span></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
            <span className="text-slate-300">OUT <span className="text-slate-500">{outCount}</span></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            <span className="text-slate-300">ALERT <span className="text-slate-500">{alertCount}</span></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#60a5fa" }} />
            <span className="text-slate-300">HOME</span>
          </span>
          <span className="flex items-center gap-1.5" style={{ animation: "nw-blink 1.4s ease-in-out infinite" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
            <span className="text-green-400 font-semibold">LIVE</span>
          </span>
        </div>
      </div>

      {/* Map */}
      <ComposableMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        style={{ width: "100%", height: "100%" }}
        projectionConfig={{ scale: 153 }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0d2137"
                stroke="#112e4a"
                strokeWidth={0.4}
                style={{
                  default: { outline: "none" },
                  hover:   { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Draw arcs */}
        {arcs.map((event, idx) => (
          <Arc key={event.id} event={event} homeXY={homeXY} idx={idx} />
        ))}

        {/* Home node */}
        <circle
          cx={homeXY[0]} cy={homeXY[1]} r={6}
          fill="#60a5fa"
          style={{ filter: "drop-shadow(0 0 6px rgba(96,165,250,0.9))" }}
        />
        <circle
          cx={homeXY[0]} cy={homeXY[1]} r={10}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={1.2}
          strokeOpacity={0.4}
        />
        <circle
          cx={homeXY[0]} cy={homeXY[1]} r={3}
          fill="#fff"
          opacity={0.9}
        />
      </ComposableMap>
    </div>
  );
}
