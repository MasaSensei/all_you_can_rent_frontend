"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient inside state so it's not shared across requests (SSR safe)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data dianggap fresh selama 30 detik
            staleTime: 30 * 1000,
            // Retry sekali saja sebelum error
            retry: 1,
            // Jangan refetch saat window refocus di development
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
          },
          mutations: {
            // Mutation tidak retry otomatis
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          classNames: {
            toast: "rounded-lg border border-slate-200 shadow-lg",
          },
        }}
      />

      {/* DevTools — only in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
