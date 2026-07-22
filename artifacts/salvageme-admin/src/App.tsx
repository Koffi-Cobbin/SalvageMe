import { useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSessionStore } from "@/lib/stores/session-store";
import { useAdminStore } from "@/lib/stores/admin-store";
import { apiClient } from "@/lib/api-client";
import { bootstrapSession } from "@/lib/auth";
import { AdminLayout } from "@/components/AdminLayout";
import { ToastHost } from "@/components/ui/Toast";

import { LoginPage } from "@/pages/LoginPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { AdminListingsPage } from "@/pages/AdminListingsPage";
import { AdminCategoriesPage } from "@/pages/AdminCategoriesPage";
import { AdminReportsPage } from "@/pages/AdminReportsPage";
import { AdminExchangesPage } from "@/pages/AdminExchangesPage";
import { AdminRequestsPage } from "@/pages/AdminRequestsPage";
import { AdminRatingsPage } from "@/pages/AdminRatingsPage";
import { AdminDropoffPointsPage } from "@/pages/AdminDropoffPointsPage";
import { AdminPartnerApplicationsPage } from "@/pages/AdminPartnerApplicationsPage";
import { AdminAuditLogPage } from "@/pages/AdminAuditLogPage";
import { AdminRolesPage } from "@/pages/AdminRolesPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AppBootstrap() {
  useEffect(() => {
    bootstrapSession();
  }, []);
  return null;
}

function AdminBootstrap() {
  const { status } = useSessionStore();
  const { adminMe, setAdminMe, clear } = useAdminStore();

  useEffect(() => {
    if (status === "authenticated" && !adminMe) {
      apiClient.getAdminMe().then(setAdminMe).catch(() => {});
    }
    if (status === "unauthenticated" && adminMe) {
      clear();
    }
  }, [status, adminMe, setAdminMe, clear]);

  return null;
}

/**
 * Gate for the whole app. Unlike the public app's AdminGuard (which redirects
 * to a *different* route within the same app), this one has nowhere else to
 * send an unauthenticated visitor except this app's own local LoginPage —
 * there is no cross-origin redirect to the public site's login.
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSessionStore();
  const adminMe = useAdminStore((s) => s.adminMe);

  const stillLoading =
    status === "idle" ||
    status === "loading" ||
    (status === "authenticated" && !adminMe);

  if (stillLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-paper-300 border-t-terracotta-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LoginPage />;
  }

  if (!adminMe!.canAccessAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper-100 px-4 text-center">
        <p className="font-display text-xl font-semibold text-ink-900">Access denied</p>
        <p className="max-w-sm text-sm text-ink-700/70">
          Your account doesn't have an admin role assigned. Contact a
          SalvageMe admin if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-bold text-terracotta-500">404</p>
      <h1 className="mt-3 font-display text-xl font-semibold text-ink-900">Page not found</h1>
      <p className="mt-2 text-ink-700/70">This admin page doesn't exist.</p>
    </div>
  );
}

function AppInner() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Switch>
          <Route path="/users" component={AdminUsersPage} />
          <Route path="/listings" component={AdminListingsPage} />
          <Route path="/categories" component={AdminCategoriesPage} />
          <Route path="/reports" component={AdminReportsPage} />
          <Route path="/exchanges" component={AdminExchangesPage} />
          <Route path="/requests" component={AdminRequestsPage} />
          <Route path="/ratings" component={AdminRatingsPage} />
          <Route path="/dropoff-points" component={AdminDropoffPointsPage} />
          <Route path="/partner-applications" component={AdminPartnerApplicationsPage} />
          <Route path="/audit-log" component={AdminAuditLogPage} />
          <Route path="/roles" component={AdminRolesPage} />
          <Route path="/" component={AdminDashboardPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </AdminLayout>
    </AdminGuard>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
      <AdminBootstrap />
      <Router>
        <ScrollToTop />
        <AppInner />
      </Router>
      <ToastHost />
    </QueryClientProvider>
  );
}
