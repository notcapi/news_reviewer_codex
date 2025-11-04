"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { DefaultOptions } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

const defaultQueryOptions: DefaultOptions["queries"] = {
  refetchOnWindowFocus: false,
  retry: 1,
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: defaultQueryOptions,
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={80}>{children}</TooltipProvider>
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        <Toaster richColors position="top-right" theme="system" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
