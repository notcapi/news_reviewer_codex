"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";

export function ThemeBoundary({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
