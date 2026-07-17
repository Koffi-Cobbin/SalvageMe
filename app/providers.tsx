"use client";

import { Suspense, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { bootstrapSession } from "@/lib/auth";
import { ToastHost } from "@/components/ui/Toast";
import { NavigationProgress } from "@/components/layout/NavigationProgress";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    bootstrapSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
      <ToastHost />
    </QueryClientProvider>
  );
}
