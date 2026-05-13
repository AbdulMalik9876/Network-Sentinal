import { useEffect, useState } from "react";
import { useTheme, type Theme } from "@/lib/theme";
import { Pause, Play } from "lucide-react";

function useUptime() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const THEMES: { id: Theme; label: string; color: string; bg: string }[] = [
  { id: "dark",      label: "Dark",       color: "#00d4e8", bg: "#0a0f1a" },
  { id: "light",     label: "Light",      color: "#0369a1", bg: "#f0f4f8" },
  { id: "green",     label: "Matrix",     color: "#22c55e", bg: "#020d05" },
  { id: "redpurple", label: "Crimson",    color: "#e040fb", bg: "#100515" },
];

interface TopBarProps {
  paused: boolean;
  onPause: () => void;
}

export function TopBar({ paused, onPause }: TopBarProps) {
  const uptime = useUptime();
  const { theme, setTheme } = useTheme();
  const [connected, setConnected] = useState(true);

  // Simulate occasional brief disconnects
  useEffect(() => {
    const t = setInterval(() => setConnected(true), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-border font-mono text-xs"
      style={{ background: "hsl(var(--topbar-bg))", color: "hsl(var(--topbar-fg))" }}
    >
      {/* Left */}
      <div className="flex items-center gap-0">
        <span className="text-primary font-semibold tracking-wider">NetWatch</span>
        <Sep />
        <span className="text-muted-foreground">by NW</span>
        <Sep />
        <span>
          IF <span className="text-primary">eth0</span>{" "}
          <span className="text-success">(live)</span>
        </span>
        <Sep />
        <span>
          HOST <span className="text-foreground">NetWatch-Server</span>
        </span>
        <Sep />
        <span>
          UP <span className="text-foreground tabular-nums">{uptime}</span>
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme dots */}
        <div className="flex items-center gap-1.5 mr-2 border border-border rounded px-2 py-0.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTheme(t.id)}
              className="relative group"
            >
              <span
                className="block w-3.5 h-3.5 rounded-full border transition-transform"
                style={{
                  background: t.color,
                  borderColor: theme === t.id ? "white" : "transparent",
                  transform: theme === t.id ? "scale(1.25)" : "scale(1)",
                  boxShadow: theme === t.id ? `0 0 6px ${t.color}` : "none",
                }}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border text-foreground px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* LIVE indicator */}
        <div className="flex items-center gap-1 border border-border rounded px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-success font-semibold">LIVE</span>
        </div>

        {/* Connected */}
        <div className="flex items-center gap-1 border border-border rounded px-2 py-0.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success" : "bg-destructive"}`}
          />
          <span className={connected ? "text-success" : "text-destructive"}>
            {connected ? "connected" : "offline"}
          </span>
        </div>

        {/* Pause/Play */}
        <button
          onClick={onPause}
          className="flex items-center gap-1 border border-border rounded px-2 py-0.5 hover:bg-muted transition-colors"
          style={{ color: "hsl(var(--topbar-fg))" }}
        >
          {paused ? (
            <><Play className="w-3 h-3" /><span>Resume</span></>
          ) : (
            <><Pause className="w-3 h-3" /><span>Pause</span></>
          )}
        </button>
      </div>
    </div>
  );
}

function Sep() {
  return <span className="mx-2 text-border select-none">|</span>;
}
