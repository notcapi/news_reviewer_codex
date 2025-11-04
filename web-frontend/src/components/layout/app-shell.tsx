import * as React from "react";

import { AppSidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <GradientBackdrop />
      <div className="relative z-10 flex min-h-screen">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopNav />
          <main className="flex-1 py-8">
            <div className={cn("mx-auto w-full max-w-6xl px-4 lg:px-8", className)}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function GradientBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/35 via-primary/0 to-transparent blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-fuchsia-500/10 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
    </div>
  );
}
