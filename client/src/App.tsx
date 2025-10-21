import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import Dashboard from "@/pages/dashboard";
import Lineup from "@/pages/lineup";
import Leagues from "@/pages/leagues";
import Stats from "@/pages/stats";
import PlayerStats from "@/pages/player-stats";
import ToolsAccordion from "@/pages/tools-accordion";
import TeamPage from "@/pages/team-page";
import UserProfile from "@/pages/profile";
import TradeAnalyzer from "@/pages/trade-analyzer";
import PreviewTool from "@/pages/preview-tool";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="flex-1 overflow-auto">
        <Header />
        <div className={`p-4 ${isMobile ? 'pb-20' : ''} bg-gray-900`}>
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <MainLayout>
          <Dashboard />
        </MainLayout>
      )} />
      <Route path="/player-stats" component={() => (
        <MainLayout>
          <PlayerStats />
        </MainLayout>
      )} />
      <Route path="/lineup" component={() => (
        <MainLayout>
          <Lineup />
        </MainLayout>
      )} />
      <Route path="/leagues" component={() => (
        <MainLayout>
          <Leagues />
        </MainLayout>
      )} />
      <Route path="/stats" component={() => (
        <MainLayout>
          <Stats />
        </MainLayout>
      )} />
      <Route path="/profile" component={() => (
        <MainLayout>
          <UserProfile />
        </MainLayout>
      )} />
      <Route path="/trade-analyzer" component={() => (
        <MainLayout>
          <TradeAnalyzer />
        </MainLayout>
      )} />
      <Route path="/tools-accordion" component={() => (
        <MainLayout>
          <ToolsAccordion />
        </MainLayout>
      )} />
      <Route path="/team" component={() => (
        <MainLayout>
          <TeamPage />
        </MainLayout>
      )} />
      <Route path="/preview-tool" component={() => (
        <MainLayout>
          <PreviewTool />
        </MainLayout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;