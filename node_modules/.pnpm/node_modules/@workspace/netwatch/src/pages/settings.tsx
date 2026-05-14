import { useEffect } from "react";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings, useTestEmailAlert } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, ShieldCheck, Router, Info } from "lucide-react";

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
        routerPassword: "",
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

          {/* ── Email Notifications ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <CardTitle>Email Notifications</CardTitle>
              </div>
              <CardDescription>
                Receive instant email alerts for suspicious events and security threats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <FormField
                control={form.control}
                name="emailAlertsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Email Alerts</FormLabel>
                      <FormDescription>
                        Send an email for every high/critical alert and suspicious traffic event.
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
                      <FormLabel>Recipient Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" type="email" {...field} />
                      </FormControl>
                      <FormDescription>Alerts will be sent to this address.</FormDescription>
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" onClick={handleTestEmail}
                  disabled={testEmail.isPending || !form.watch("emailAlertsEnabled")}>
                  {testEmail.isPending ? "Sending…" : "Send Test Email"}
                </Button>
              </div>

              {/* SMTP setup guide */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="w-4 h-4 text-primary" />
                  SMTP Configuration (required for email delivery)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Email delivery requires SMTP credentials set as environment variables on the server.
                  Add these in the <strong>Secrets</strong> tab of your Replit project:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  {[
                    { key: "SMTP_HOST",   ex: "smtp.gmail.com",      desc: "Your SMTP server" },
                    { key: "SMTP_PORT",   ex: "587",                 desc: "Usually 587 (TLS)" },
                    { key: "SMTP_USER",   ex: "you@gmail.com",       desc: "Login username/email" },
                    { key: "SMTP_PASS",   ex: "••••••••",             desc: "App password (not login)" },
                    { key: "SMTP_SECURE", ex: "false",               desc: "true for port 465 only" },
                  ].map(({ key, ex, desc }) => (
                    <div key={key} className="flex flex-col gap-0.5 bg-background rounded p-2 border border-border">
                      <span className="text-primary font-bold">{key}</span>
                      <span className="text-muted-foreground">{ex}</span>
                      <span className="text-muted-foreground/70 text-[10px]">{desc}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Gmail tip:</strong> Use an <em>App Password</em> (not your account password) — go to
                  Google Account → Security → 2-Step Verification → App Passwords.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── Detection Rules ──────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <CardTitle>Detection Rules</CardTitle>
              </div>
              <CardDescription>Tune the sensitivity of the security engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="portScanDetection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Port Scan Detection</FormLabel>
                        <FormDescription>Flag systematic scanning of multiple ports from a single IP.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bruteForceDetection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Brute Force Detection</FormLabel>
                        <FormDescription>Detect repeated failed connection attempts to SSH, RDP, or HTTP.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="suspicionThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suspicion Threshold (1–100)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Higher = less sensitive. 75 is recommended.</FormDescription>
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
                      <FormDescription>Alert if a device exceeds this in 1 hour.</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scanInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scan Interval (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>How often to run active network scans.</FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Router Integration ───────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Router className="w-4 h-4 text-primary" />
                <CardTitle>Router Integration</CardTitle>
              </div>
              <CardDescription>
                Connect directly to your router for enhanced data collection and port visibility.
              </CardDescription>
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
                    <FormDescription>The LAN IP of your router's admin interface.</FormDescription>
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
              {updateSettings.isPending ? "Saving…" : "Save Configuration"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
