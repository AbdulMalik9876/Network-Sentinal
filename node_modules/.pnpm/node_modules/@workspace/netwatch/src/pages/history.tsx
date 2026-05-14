import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDateTime, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, ShieldAlert, Database } from "lucide-react";

export default function HistoryPage() {
  const [trafficEvents, setTrafficEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to load from Firebase
    try {
      const qTraffic = query(collection(db, "traffic_events"), orderBy("mirroredAt", "desc"), limit(50));
      const unsubscribeTraffic = onSnapshot(qTraffic, (snapshot) => {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTrafficEvents(events);
        setLoading(false);
      }, (err) => {
        console.error("Firebase traffic error:", err);
        setError("Firebase connection error or missing config.");
        setLoading(false);
      });

      const qAlerts = query(collection(db, "alerts"), orderBy("mirroredAt", "desc"), limit(50));
      const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
        const alts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlerts(alts);
      }, (err) => {
        console.error("Firebase alerts error:", err);
      });

      return () => {
        unsubscribeTraffic();
        unsubscribeAlerts();
      };
    } catch (err) {
      console.error("Firebase init error:", err);
      setError("Firebase is not configured. Add VITE_FIREBASE_* env vars to enable historical archiving.");
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historical Archive</h1>
          <p className="text-muted-foreground text-sm mt-1">Data mirrored to Firebase Firestore for long-term retention</p>
        </div>
        <Database className="w-6 h-6 text-primary opacity-50" />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          <p className="font-medium">Firebase Integration Offline</p>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      )}

      <Tabs defaultValue="traffic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="traffic"><Activity className="w-4 h-4 mr-2" /> Traffic Archive</TabsTrigger>
          <TabsTrigger value="alerts"><ShieldAlert className="w-4 h-4 mr-2" /> Alerts Archive</TabsTrigger>
        </TabsList>
        
        <TabsContent value="traffic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Archived Traffic Events</CardTitle>
              <CardDescription>Last 50 events synced to cloud storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Mirrored At</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-mono text-sm">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading archive...</TableCell>
                      </TableRow>
                    ) : trafficEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-muted-foreground">
                          {event.mirroredAt?.toDate ? formatDateTime(event.mirroredAt.toDate().toISOString()) : 'Pending'}
                        </TableCell>
                        <TableCell>{formatDateTime(event.timestamp)}</TableCell>
                        <TableCell>{event.srcIp}:{event.srcPort}</TableCell>
                        <TableCell>{event.dstIp}:{event.dstPort}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.protocol}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatBytes(event.bytes)}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && trafficEvents.length === 0 && !error && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No archived traffic found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Archived Security Alerts</CardTitle>
              <CardDescription>Last 50 alerts synced to cloud storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Mirrored At</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Loading archive...</TableCell>
                      </TableRow>
                    ) : alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="text-muted-foreground text-sm font-mono whitespace-nowrap">
                          {alert.mirroredAt?.toDate ? formatDateTime(alert.mirroredAt.toDate().toISOString()) : 'Pending'}
                        </TableCell>
                        <TableCell className="text-sm font-mono whitespace-nowrap">{formatDateTime(alert.timestamp)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">{alert.severity}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{alert.type}</TableCell>
                        <TableCell className="text-sm">{alert.message}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && alerts.length === 0 && !error && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No archived alerts found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
