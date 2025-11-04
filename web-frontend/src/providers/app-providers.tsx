"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { DefaultOptions } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

const defaultQueryOptions: DefaultOptions["queries"] = {
  refetchOnWindowFocus: false,
  retry: 1,
};

const ReactQueryDevtoolsDynamic = dynamic(async () => {
  const mod = await import("@tanstack/react-query-devtools");
  return { default: mod.ReactQueryDevtools };
}, { ssr: false });

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
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtoolsDynamic initialIsOpen={false} buttonPosition="bottom-right" />
        ) : null}
        <Toaster richColors position="top-right" theme="system" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
