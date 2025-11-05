import * as React from "react";

import { AppSidebar, type SidebarStats } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  stats,
}: React.PropsWithChildren<{ className?: string; stats?: SidebarStats }>) {
  return (
    <div className="relative min-h-screen bg-background">
      <GradientBackdrop />
      <div className="relative z-10 flex min-h-screen">
        <AppSidebar stats={stats} />
        <div className="flex flex-1 flex-col">
          <TopNav />
          <main className="flex-1 py-10">
            <div className={cn("mx-auto w-full max-w-6xl px-4 lg:px-8", className)}>
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

function GradientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute left-1/2 top-[-25%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/40 via-primary/0 to-transparent blur-[180px]" />
      <div className="absolute bottom-[-30%] right-[-20%] h-[640px] w-[640px] rounded-full bg-gradient-to-tr from-indigo-500/25 via-fuchsia-500/15 to-transparent blur-[200px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_65%)]" />
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/20 bg-background/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-10 text-xs text-muted-foreground/80 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <span className="font-medium text-foreground/80">News Analyst</span>
        <div className="flex flex-wrap items-center gap-3">
          <span>© {year} Panel editorial asistido.</span>
          <a
            href="https://github.com/notcapi/news_reviewer_codex"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            Código disponible en GitHub →
          </a>
        </div>
      </div>
    </footer>
  );
}
