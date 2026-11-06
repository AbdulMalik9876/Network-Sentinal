import {
  useGetTrafficSummary,
  getGetTrafficSummaryQueryKey,
  useGetTrafficGeo,
  getGetTrafficGeoQueryKey,
  useListTraffic,
  getListTrafficQueryKey,
  GeoTrafficEvent
} from "@workspace/api-client-react";
import { WorldMap } from "@/components/world-map";
import { TrafficDetailModal } from "@/components/traffic-detail-modal";
import { ThreatFeedPanel } from "@/components/threat-feed";
import { formatBytes } from "@/lib/utils";
import { usePause } from "@/lib/pause";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Network, ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { paused } = usePause();
  const interval = paused ? false : 5000;
  const [selectedEvent, setSelectedEvent] = useState<GeoTrafficEvent | null>(null);

  const { data: summary } = useGetTrafficSummary({
    query: { queryKey: getGetTrafficSummaryQueryKey(), refetchInterval: interval }
  });

  const { data: geoData } = useGetTrafficGeo({ limit: 500 }, {
    query: { queryKey: getGetTrafficGeoQueryKey({ limit: 500 }), refetchInterval: interval }
  });

  const { data: _trafficRaw } = useListTraffic({ limit: 10 }, {
    query: { queryKey: getListTrafficQueryKey({ limit: 10 }), refetchInterval: interval }
  });
  const recentTraffic = Array.isArray(_trafficRaw)
    ? _trafficRaw
    : (_trafficRaw as any)?.items ?? (_trafficRaw as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Live Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Traffic</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatBytes(summary?.totalBytes || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary?.totalEvents?.toLocaleString()} events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspicious Events</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">{summary?.suspiciousCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inbound</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{formatBytes(summary?.inboundBytes || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outbound</CardTitle>
            <ArrowUpToLine className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-accent">{formatBytes(summary?.outboundBytes || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Map + Threat feed side-by-side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Global Traffic Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[480px]">
            <WorldMap events={geoData || []} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <CardTitle>Live Threat Feed</CardTitle>
              <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Click any threat to see details &amp; fix steps</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <ThreatFeedPanel />
          </CardContent>
        </Card>
      </div>

      {/* Bandwidth chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Bandwidth (24h)</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary?.recentActivity || []}>
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => new Date(val).getHours() + 'h'} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => formatBytes(val, 0)} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number) => formatBytes(value)}
              />
              <Bar dataKey="bytes" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live traffic table */}
      <Card>
        <CardHeader>
          <CardTitle>Live Traffic Feed</CardTitle>
          <p className="text-xs text-muted-foreground">Click any row to view packet details</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-sm">
                {recentTraffic?.map((event) => (
                  <TableRow key={event.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedEvent(event)}>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}
                    </TableCell>
                    <TableCell>{event.srcIp}:{event.srcPort}</TableCell>
                    <TableCell>{event.dstIp}:{event.dstPort}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.protocol}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatBytes(event.bytes)}</TableCell>
                    <TableCell>
                      {event.isSuspicious ? (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-transparent">⚠ Suspicious</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-border">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!recentTraffic?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Waiting for traffic data...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <TrafficDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
