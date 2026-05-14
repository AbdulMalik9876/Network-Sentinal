import { useState } from "react";
import { useListTraffic, getListTrafficQueryKey, useCreateTrafficEvent, GeoTrafficEvent } from "@workspace/api-client-react";
import { usePause } from "@/lib/pause";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { TrafficDetailModal } from "@/components/traffic-detail-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function TrafficPage() {
  const [protocol, setProtocol] = useState<string>("all");
  const [direction, setDirection] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<GeoTrafficEvent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { paused } = usePause();

  const { data: traffic, isLoading } = useListTraffic(
    { protocol: protocol !== "all" ? protocol : undefined },
    { query: { queryKey: getListTrafficQueryKey({ protocol: protocol !== "all" ? protocol : undefined }), refetchInterval: paused ? false : 5000 } }
  );

  const createTraffic = useCreateTrafficEvent();

  const handleSimulate = () => {
    createTraffic.mutate({
      data: {
        srcIp: "192.168.1.100",
        dstIp: "8.8.8.8",
        srcPort: 50000 + Math.floor(Math.random() * 10000),
        dstPort: 443,
        protocol: "TCP",
        bytes: Math.floor(Math.random() * 10000),
        direction: "outbound"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Simulated traffic event created" });
        queryClient.invalidateQueries({ queryKey: getListTrafficQueryKey() });
      }
    });
  };

  const filteredTraffic = traffic?.filter(t => direction === "all" || t.direction === direction);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Traffic History</h1>
        <Button onClick={handleSimulate} variant="outline" size="sm">
          Simulate Event
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Network Traffic Feed</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Click any row to view packet details &amp; threat analysis</p>
          </div>
          <div className="flex space-x-2">
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Protocol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Protocols</SelectItem>
                <SelectItem value="TCP">TCP</SelectItem>
                <SelectItem value="UDP">UDP</SelectItem>
                <SelectItem value="ICMP">ICMP</SelectItem>
              </SelectContent>
            </Select>

            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-sm">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">Loading traffic...</TableCell>
                  </TableRow>
                ) : filteredTraffic?.map((event) => (
                  <TableRow key={event.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedEvent(event)}>
                    <TableCell className="text-muted-foreground">{formatDateTime(event.timestamp)}</TableCell>
                    <TableCell>{event.srcIp}:{event.srcPort}</TableCell>
                    <TableCell>{event.dstIp}:{event.dstPort}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.protocol}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-muted-foreground">{event.direction}</span>
                    </TableCell>
                    <TableCell className="text-right">{formatBytes(event.bytes)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.country ? `${event.city ? event.city + ', ' : ''}${event.country}` : '—'}
                    </TableCell>
                    <TableCell>
                      {event.isSuspicious ? (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-transparent cursor-pointer">⚠ Suspicious</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-border">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredTraffic?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No traffic found.</TableCell>
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
