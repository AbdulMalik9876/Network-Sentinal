import { useEffect } from "react";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings, useTestEmailAlert } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

const settingsSchema = z.object({
  emailAlertsEnabled: z.boolean(),
  alertEmail: z.string().email().optional().or(z.literal("")),
  routerIp: z.string().optional().or(z.literal("")),
  routerUser: z.string().optional().or(z.literal("")),
  routerPassword: z.string().optional().or(z.literal("")),
  scanInterval: z.coerce.number().min(1).max(1440),
  suspicionThreshold: z.coerce.number().min(1).max(100),
  portScanDetection: z.boolean(),
  bruteForceDetection: z.boolean(),
  highBandwidthThresholdMb: z.coerce.number().min(10)
});

export default function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });
  
  const updateSettings = useUpdateSettings();
  const testEmail = useTestEmailAlert();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      emailAlertsEnabled: false,
      alertEmail: "",
      routerIp: "",
      routerUser: "",
      routerPassword: "",
      scanInterval: 60,
      suspicionThreshold: 75,
      portScanDetection: true,
      bruteForceDetection: true,
      highBandwidthThresholdMb: 1000
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        emailAlertsEnabled: settings.emailAlertsEnabled,
        alertEmail: settings.alertEmail || "",
        routerIp: settings.routerIp || "",
        routerUser: settings.routerUser || "",
        routerPassword: "", // Password not sent from server
        scanInterval: settings.scanInterval,
        suspicionThreshold: settings.suspicionThreshold,
        portScanDetection: settings.portScanDetection,
        bruteForceDetection: settings.bruteForceDetection,
        highBandwidthThresholdMb: settings.highBandwidthThresholdMb || 1000
      });
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    updateSettings.mutate({
      data: {
        ...values,
        alertEmail: values.alertEmail || undefined,
        routerIp: values.routerIp || undefined,
        routerUser: values.routerUser || undefined,
        routerPassword: values.routerPassword || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Settings saved successfully" });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        // Clear password field after save
        form.setValue("routerPassword", "");
      }
    });
  };

  const handleTestEmail = () => {
    testEmail.mutate(undefined, {
      onSuccess: (res) => {
        toast({ 
          title: "Email Test", 
          description: res.message,
          variant: res.success ? "default" : "destructive" 
        });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <h1 className="text-2xl font-bold tracking-tight">System Configuration</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>Notifications & Alerts</CardTitle>
              <CardDescription>Configure how and when you receive security alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="emailAlertsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Alerts</FormLabel>
                      <FormDescription>
                        Receive email notifications for high and critical alerts.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2 items-end">
                <FormField
                  control={form.control}
                  name="alertEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" onClick={handleTestEmail} disabled={testEmail.isPending}>
                  Test Email Delivery
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detection Rules</CardTitle>
              <CardDescription>Tune the sensitivity of the security engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="portScanDetection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Port Scan Detection</FormLabel>
                        <FormDescription>Identify systematic scanning of multiple ports.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bruteForceDetection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Brute Force Detection</FormLabel>
                        <FormDescription>Detect repeated failed connection attempts.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="suspicionThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suspicion Threshold Score (1-100)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Higher values require more evidence before alerting.</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="highBandwidthThresholdMb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>High Bandwidth Alert (MB)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Alert if a device exceeds this usage in 1 hour.</FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Router Integration</CardTitle>
              <CardDescription>Connect directly to your router for enhanced data collection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="routerIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Router Management IP</FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.1.1" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="routerUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SSH/API Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="routerPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>Leave blank to keep existing password.</FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending} size="lg">
              Save Configuration
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
