import { useScanPorts, getScanPortsQueryKey } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Shield } from "lucide-react";

export default function PortsPage() {
  const { data: _portScansRaw, isLoading, refetch, isRefetching } = useScanPorts({
  query: { queryKey: getScanPortsQueryKey() }
  });
  const portScans = Array.isArray(_portScansRaw) ? _portScansRaw : (_portScansRaw as any)?.items ?? (_portScansRaw as any)?.data ?? [];
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleScan = () => {
    refetch().then(() => {
      toast({ title: "Port scan completed" });
    });
  };

  const getStateColor = (state: string) => {
    switch(state) {
      case "open": return "bg-destructive text-destructive-foreground border-destructive animate-pulse";
      case "filtered": return "bg-warning text-warning-foreground border-warning";
      case "closed": return "bg-success text-success-foreground border-success";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">External Port Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoring router's public-facing ports</p>
        </div>
        <Button onClick={handleScan} disabled={isLoading || isRefetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Run Scan Now
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Port Scan Results
          </CardTitle>
          <CardDescription>
            Open ports on your router can be a security risk. Ensure only necessary ports are open.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Port</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Target IP</TableHead>
                  <TableHead className="text-right">Last Checked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Running port scan...</TableCell>
                  </TableRow>
                ) : portScans?.map((scan, idx) => (
                  <TableRow key={`${scan.ip}-${scan.port}-${idx}`}>
                    <TableCell className="font-mono font-bold text-primary">{scan.port}</TableCell>
                    <TableCell>{scan.protocol}</TableCell>
                    <TableCell>{scan.service || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge className={getStateColor(scan.state)} variant="outline">
                        {scan.state.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{scan.ip}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDateTime(scan.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && portScans?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No port scan results available.</TableCell>
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
