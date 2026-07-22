import { useEffect } from "react";
import { Router, Route, Switch, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSessionStore } from "@/lib/stores/session-store";
import { bootstrapSession } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { ToastHost } from "@/components/ui/Toast";

import { HomePage } from "@/pages/HomePage";
import { ListingsPage } from "@/pages/ListingsPage";
import { ListingDetailPage } from "@/pages/ListingDetailPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExchangesPage } from "@/pages/ExchangesPage";
import { ExchangeDetailPage } from "@/pages/ExchangeDetailPage";
import { RequestsPage } from "@/pages/RequestsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NewListingPage } from "@/pages/NewListingPage";
import { EditListingPage } from "@/pages/EditListingPage";
import { FaqPage } from "@/pages/FaqPage";
import { HowItWorksPage } from "@/pages/HowItWorksPage";
import { GalleryPage } from "@/pages/GalleryPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSessionStore();
  const [location] = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-paper-300 border-t-terracotta-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect to={`/login?returnTo=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}

function AppBootstrap() {
  useEffect(() => {
    bootstrapSession();
  }, []);
  return null;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-bold text-terracotta-500">404</p>
      <h1 className="mt-3 text-display-sm">Page not found</h1>
      <p className="mt-2 text-ink-700/70">This page doesn't exist or was moved.</p>
      <a
        href="/"
        className="mt-6 inline-flex items-center rounded-xl bg-terracotta-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-600"
      >
        Back to home
      </a>
    </div>
  );
}

function AppInner() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Switch>
          {/* Public */}
          <Route path="/" component={HomePage} />
          <Route path="/listings" component={ListingsPage} />
          <Route path="/listings/new">
            <AuthGuard>
              <NewListingPage />
            </AuthGuard>
          </Route>
          <Route path="/listings/:id/edit">
            <AuthGuard>
              <EditListingPage />
            </AuthGuard>
          </Route>
          <Route path="/listings/:id" component={ListingDetailPage} />
          <Route path="/faq" component={FaqPage} />
          <Route path="/how-it-works" component={HowItWorksPage} />
          <Route path="/gallery" component={GalleryPage} />

          {/* Auth */}
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />

          {/* Protected */}
          <Route path="/dashboard">
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          </Route>
          <Route path="/exchanges/:id">
            <AuthGuard>
              <ExchangeDetailPage />
            </AuthGuard>
          </Route>
          <Route path="/exchanges">
            <AuthGuard>
              <ExchangesPage />
            </AuthGuard>
          </Route>
          <Route path="/requests">
            <AuthGuard>
              <RequestsPage />
            </AuthGuard>
          </Route>
          <Route path="/settings">
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          </Route>

          <Route component={NotFoundPage} />
        </Switch>
      </main>
      <SiteFooter />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
      <Router>
        <ScrollToTop />
        <NavigationProgress />
        <AppInner />
      </Router>
      <ToastHost />
    </QueryClientProvider>
  );
}
