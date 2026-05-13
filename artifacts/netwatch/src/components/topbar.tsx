import { useEffect, useState } from "react";
import { useTheme, type Theme } from "@/lib/theme";
import { usePause } from "@/lib/pause";
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

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: "dark",      label: "Dark",    color: "#00d4e8" },
  { id: "light",     label: "Light",   color: "#0ea5e9" },
  { id: "green",     label: "Matrix",  color: "#22c55e" },
  { id: "redpurple", label: "Crimson", color: "#e040fb" },
];

export function TopBar() {
  const uptime = useUptime();
  const { theme, setTheme } = useTheme();
  const { paused, toggle } = usePause();

  return (
    <div
      className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-border font-mono text-xs"
      style={{ background: "hsl(var(--topbar-bg))", color: "hsl(var(--topbar-fg))" }}
    >
      {/* Left */}
      <div className="flex items-center">
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
        {paused && (
          <>
            <Sep />
            <span className="text-warning font-semibold animate-pulse">⏸ PAUSED</span>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme dots */}
        <div className="flex items-center gap-1.5 border border-border rounded px-2 py-0.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTheme(t.id)}
              className="relative group"
            >
              <span
                className="block w-3.5 h-3.5 rounded-full border transition-all duration-150"
                style={{
                  background: t.color,
                  borderColor: theme === t.id ? "white" : "transparent",
                  transform: theme === t.id ? "scale(1.3)" : "scale(1)",
                  boxShadow: theme === t.id ? `0 0 6px ${t.color}` : "none",
                }}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border text-foreground px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* LIVE / PAUSED indicator */}
        <div className={`flex items-center gap-1 border border-border rounded px-2 py-0.5 ${paused ? "opacity-50" : ""}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${paused ? "bg-warning" : "bg-success animate-pulse"}`} />
          <span className={paused ? "text-warning" : "text-success font-semibold"}>
            {paused ? "PAUSED" : "LIVE"}
          </span>
        </div>

        {/* Connected */}
        <div className="flex items-center gap-1 border border-border rounded px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-success">connected</span>
        </div>

        {/* Pause/Resume */}
        <button
          onClick={toggle}
          className="flex items-center gap-1 border border-border rounded px-2 py-0.5 hover:bg-muted transition-colors"
          style={{ color: paused ? "hsl(var(--warning))" : "hsl(var(--topbar-fg))" }}
          title={paused ? "Resume live updates" : "Pause live updates"}
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
