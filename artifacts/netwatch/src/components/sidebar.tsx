import { Link, useLocation } from "wouter";
import { Activity, AlertTriangle, Shield, HardDrive, Network, Settings, History, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/",        label: "Dashboard",    icon: Activity },
  { href: "/traffic", label: "Traffic Feed", icon: Network },
  { href: "/alerts",  label: "Alerts",       icon: AlertTriangle },
  { href: "/devices", label: "Devices",      icon: HardDrive },
  { href: "/ports",   label: "Port Monitor", icon: Shield },
  { href: "/history", label: "History",      icon: History },
  { href: "/settings",label: "Settings",     icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="relative border-r border-border bg-sidebar h-full flex flex-col transition-all duration-200"
      style={{ width: collapsed ? 56 : 256 }}
    >
      {/* Logo / Brand */}
      <div className="h-16 flex items-center border-b border-border overflow-hidden px-3 shrink-0">
        <Shield className="w-6 h-6 text-primary shrink-0" />
        <span
          className="font-bold text-lg tracking-tight ml-3 whitespace-nowrap transition-all duration-200 overflow-hidden"
          style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 180 }}>
          NETWATCH
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <span
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm font-medium transition-colors h-10",
                  collapsed ? "justify-center px-0" : "px-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}>
                <Icon className={cn(
                  "shrink-0",
                  collapsed ? "w-5 h-5" : "w-4 h-4 mr-3",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                {!collapsed && item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-border text-xs text-muted-foreground font-mono shrink-0 flex items-center",
        collapsed ? "justify-center p-3" : "p-4"
      )}>
        {!collapsed && "v0.1.0-alpha"}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 z-30 w-6 h-6 rounded-full border border-border bg-sidebar flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors shadow-sm"
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5" />
          : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
