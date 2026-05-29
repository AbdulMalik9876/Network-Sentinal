import { useState } from "react";
import { useListDevices, getListDevicesQueryKey, useUpdateDevice, useCreateDevice } from "@workspace/api-client-react";
import { usePause } from "@/lib/pause";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldBan, HardDrive, Wifi, WifiOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DevicesPage() {
  const { paused } = usePause();
  const { data: _devicesRaw, isLoading } = useListDevices({
  query: { queryKey: getListDevicesQueryKey(), refetchInterval: paused ? false : 8000 }
  });
  const devices = Array.isArray(_devicesRaw) ? _devicesRaw : (_devicesRaw as any)?.items ?? (_devicesRaw as any)?.data ?? [];
  
  const updateDevice = useUpdateDevice();
  const createDevice = useCreateDevice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDeviceIp, setNewDeviceIp] = useState("");
  const [newDeviceLabel, setNewDeviceLabel] = useState("");

  const handleBlockToggle = (id: number, currentBlocked: boolean) => {
    updateDevice.mutate({ id, data: { isBlocked: !currentBlocked } }, {
      onSuccess: () => {
        toast({ title: `Device ${!currentBlocked ? 'blocked' : 'unblocked'} successfully` });
        queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
      }
    });
  };

  const handleAddDevice = () => {
    createDevice.mutate({
      data: { ip: newDeviceIp, label: newDeviceLabel }
    }, {
      onSuccess: () => {
        toast({ title: "Device added" });
        setIsAddOpen(false);
        setNewDeviceIp("");
        setNewDeviceLabel("");
        queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
      }
    });
  };

  const totalNetworkBytes = devices?.reduce((acc, dev) => acc + (dev.totalBytes || 0), 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Network Devices</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>Add Device</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Known Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ip">IP Address</Label>
                <Input id="ip" value={newDeviceIp} onChange={e => setNewDeviceIp(e.target.value)} placeholder="192.168.1.x" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input id="label" value={newDeviceLabel} onChange={e => setNewDeviceLabel(e.target.value)} placeholder="e.g. Living Room TV" />
              </div>
              <Button onClick={handleAddDevice} className="w-full" disabled={!newDeviceIp || !newDeviceLabel || createDevice.isPending}>
                Save Device
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center p-12 text-muted-foreground">Loading devices...</div>
        ) : devices?.map((device) => {
          const usagePercent = Math.min(100, Math.max(0, (device.totalBytes / totalNetworkBytes) * 100));
          
          return (
            <Card key={device.id} className={device.isBlocked ? "opacity-75 border-destructive" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{device.label || 'Unknown Device'}</CardTitle>
                      <CardDescription className="font-mono text-xs">{device.ip}</CardDescription>
                    </div>
                  </div>
                  {device.isOnline ? (
                    <Wifi className="w-4 h-4 text-success" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Bandwidth Share</span>
                    <span>{usagePercent.toFixed(1)}%</span>
                  </div>
                  <Progress value={usagePercent} className="h-1.5" />
                  <div className="flex justify-between text-xs mt-1 font-mono">
                    <span className="text-primary">↓ {formatBytes(device.downloadBytes || 0)}</span>
                    <span className="text-accent">↑ {formatBytes(device.uploadBytes || 0)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <div className="text-xs text-muted-foreground">
                    <p>MAC: <span className="font-mono">{device.mac || 'N/A'}</span></p>
                    <p>Last seen: {formatDateTime(device.lastSeen)}</p>
                  </div>
                  <Button 
                    variant={device.isBlocked ? "outline" : "destructive"} 
                    size="sm"
                    className="h-8 text-xs px-2"
                    onClick={() => handleBlockToggle(device.id, device.isBlocked)}
                    disabled={updateDevice.isPending}
                  >
                    {device.isBlocked ? (
                      <><Shield className="w-3 h-3 mr-1" /> Unblock</>
                    ) : (
                      <><ShieldBan className="w-3 h-3 mr-1" /> Block</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
