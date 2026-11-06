import { useState } from "react";
import { useListAlerts, getListAlertsQueryKey, useResolveAlert, useCreateAlert, AlertSeverity, AlertInputSeverity, Alert } from "@workspace/api-client-react";
import { usePause } from "@/lib/pause";
import { formatDateTime } from "@/lib/utils";
import { AlertDetailModal } from "@/components/alert-detail-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { paused } = usePause();

  const qParams = {
    severity: severityFilter !== "all" ? severityFilter as AlertSeverity : undefined,
    resolved: statusFilter === "all" ? undefined : statusFilter === "resolved",
  };

  const { data: _alertsRaw, isLoading } = useListAlerts(qParams, {
  query: { queryKey: getListAlertsQueryKey(qParams), refetchInterval: paused ? false : 5000 }
  });
  const alerts = Array.isArray(_alertsRaw) ? _alertsRaw : (_alertsRaw as any)?.items ?? (_alertsRaw as any)?.data ?? [];

  const resolveAlert = useResolveAlert();
  const createAlert = useCreateAlert();

  const handleResolve = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    resolveAlert.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Alert resolved" });
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      }
    });
  };

  const handleSimulate = () => {
    createAlert.mutate({
      data: {
        type: "Port Scan Detected",
        severity: AlertInputSeverity.high,
        message: "Multiple connection attempts to closed ports detected from 192.168.1.50",
        srcIp: "192.168.1.50"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Simulated alert created" });
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-destructive text-destructive-foreground border-destructive";
      case "high":     return "bg-destructive/80 text-destructive-foreground border-destructive/80";
      case "medium":   return "bg-warning text-warning-foreground border-warning";
      case "low":      return "bg-info text-info-foreground border-info";
      default:         return "bg-muted text-muted-foreground border-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Security Alerts</h1>
        <Button onClick={handleSimulate} variant="outline" size="sm">
          Simulate Alert
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Alert Management</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Click any alert to see details, analysis &amp; resolution steps</p>
          </div>
          <div className="flex space-x-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
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
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Loading alerts...</TableCell>
                  </TableRow>
                ) : alerts?.map((alert) => (
                  <TableRow key={alert.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${alert.resolved ? "opacity-60" : ""}`}
                    onClick={() => setSelectedAlert(alert)}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm font-mono">
                      {formatDateTime(alert.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(alert.severity)} variant="outline">
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{alert.type}</TableCell>
                    <TableCell className="font-mono text-sm">{alert.srcIp}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={alert.message}>
                      {alert.message}
                    </TableCell>
                    <TableCell>
                      {alert.resolved ? (
                        <div className="flex items-center text-success text-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" />Resolved
                        </div>
                      ) : (
                        <div className="flex items-center text-warning text-sm font-medium">
                          <ShieldAlert className="w-4 h-4 mr-1" />Active
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!alert.resolved && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={(e) => handleResolve(e, alert.id)}
                          disabled={resolveAlert.isPending}>
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && alerts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No alerts found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedAlert && (
        <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}
