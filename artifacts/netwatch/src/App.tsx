import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import TrafficPage from "@/pages/traffic";
import AlertsPage from "@/pages/alerts";
import DevicesPage from "@/pages/devices";
import PortsPage from "@/pages/ports";
import SettingsPage from "@/pages/settings";
import HistoryPage from "@/pages/history";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/traffic" component={TrafficPage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/devices" component={DevicesPage} />
        <Route path="/ports" component={PortsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/history" component={HistoryPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
