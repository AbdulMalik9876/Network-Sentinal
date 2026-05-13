import {
  useGetTrafficSummary,
  getGetTrafficSummaryQueryKey,
  useGetTrafficGeo,
  getGetTrafficGeoQueryKey,
  useListTraffic,
  getListTrafficQueryKey
} from "@workspace/api-client-react";
import { WorldMap } from "@/components/world-map";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldAlert, Network, ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: summary } = useGetTrafficSummary({
    query: { queryKey: getGetTrafficSummaryQueryKey(), refetchInterval: 5000 }
  });

  const { data: geoData } = useGetTrafficGeo({ limit: 100 }, {
    query: { queryKey: getGetTrafficGeoQueryKey({ limit: 100 }), refetchInterval: 5000 }
  });

  const { data: recentTraffic } = useListTraffic({ limit: 10 }, {
    query: { queryKey: getListTrafficQueryKey({ limit: 10 }), refetchInterval: 5000 }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Live Dashboard</h1>
        <div className="flex items-center space-x-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-success">LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Traffic</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatBytes(summary?.totalBytes || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary?.totalEvents.toLocaleString()} events</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Global Traffic Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[400px]">
            <WorldMap events={geoData || []} />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Bandwidth (24h)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Traffic Feed</CardTitle>
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
                  <TableRow key={event.id}>
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
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-transparent">Suspicious</Badge>
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
    </div>
  );
}
