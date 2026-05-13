import { Link, useLocation } from "wouter";
import { Activity, AlertTriangle, Shield, HardDrive, Network, Settings, History } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/traffic", label: "Traffic Feed", icon: Network },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/devices", label: "Devices", icon: HardDrive },
  { href: "/ports", label: "Port Monitor", icon: Shield },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-sidebar h-full flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Shield className="w-6 h-6 text-primary mr-3" />
        <span className="font-bold text-lg tracking-tight">NETWATCH</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <span
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className={cn("w-4 h-4 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border text-xs text-muted-foreground font-mono">
        v0.1.0-alpha
      </div>
    </aside>
  );
}
