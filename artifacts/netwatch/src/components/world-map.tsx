import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { GeoTrafficEvent } from "@workspace/api-client-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMap({ events }: { events: GeoTrafficEvent[] }) {
  // Simple deduplication for dots, prioritizing suspicious
  const points = events
    .filter((e) => e.lon && e.lat)
    .sort((a, b) => (a.isSuspicious === b.isSuspicious ? 0 : a.isSuspicious ? 1 : -1));

  return (
    <div className="w-full h-full bg-card rounded-lg overflow-hidden border border-border">
      <ComposableMap
        projectionConfig={{
          scale: 140,
        }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="hsl(var(--secondary))"
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "hsl(var(--muted))" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        {points.map((event) => {
          if (!event.lon || !event.lat) return null;
          const isSuspicious = event.isSuspicious;
          const size = Math.max(2, Math.min(8, Math.log10(event.bytes || 10)));
          return (
            <Marker key={event.id} coordinates={[event.lon, event.lat]}>
              <circle
                r={size}
                fill={isSuspicious ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                opacity={0.8}
                className={isSuspicious ? "animate-pulse" : ""}
              />
              {isSuspicious && (
                <circle
                  r={size * 2}
                  fill="hsl(var(--destructive))"
                  opacity={0.2}
                  className="animate-ping"
                />
              )}
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}
