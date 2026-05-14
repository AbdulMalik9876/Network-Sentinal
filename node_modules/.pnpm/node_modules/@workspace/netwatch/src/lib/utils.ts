import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(ts: string | Date): string {
  return new Date(ts).toLocaleString();
}

export function formatDateTime(ts: string | Date): string {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return "text-red-400 bg-red-400/10 border-red-400/30";
    case "high": return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    case "medium": return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    case "low": return "text-cyan-400 bg-cyan-400/10 border-cyan-400/30";
    default: return "text-slate-400 bg-slate-400/10 border-slate-400/30";
  }
}
