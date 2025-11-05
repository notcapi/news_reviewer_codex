"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { primaryNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Menu from "lucide-react/dist/esm/icons/menu";

export type SidebarStats = {
  totalReports: number;
  totalClaims: number;
};

export function AppSidebar({ stats }: { stats?: SidebarStats }) {
  const pathname = usePathname();

  return (
    <aside className="relative hidden w-[296px] shrink-0 lg:flex">
      <div className="sticky top-0 flex h-screen w-full flex-col gap-7 border-r border-border/20 bg-background/85 px-6 py-8 backdrop-blur-2xl">
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.38em] text-muted-foreground/50">
            Dashboard
          </span>
          <p className="text-lg font-semibold tracking-tight text-foreground">News Analyst</p>
        </div>

        <div className="flex flex-col gap-2">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "group relative flex items-start gap-3 rounded-2xl px-3.5 py-3 transition-all duration-200",
                  "hover:bg-muted/20",
                  isActive ? "bg-primary/10 text-foreground shadow-[0_20px_40px_-34px_rgba(99,102,241,0.65)]" : "text-muted-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                      : "bg-muted text-foreground/60",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-tight text-foreground/90 group-hover:text-foreground">
                      {item.title}
                    </span>
                    {item.shortcut ? (
                      <kbd className="hidden rounded-md border border-border/70 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70 lg:inline-block">
                        {item.shortcut}
                      </kbd>
                    ) : null}
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground/80 group-hover:text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                {isActive ? (
                  <span className="absolute left-2 top-2 bottom-2 w-[3px] rounded-full bg-primary/80" aria-hidden="true" />
                ) : null}
              </Link>
            );
          })}
        </div>

        <Separator className="bg-border/50" />

        <SidebarFooter stats={stats} />
      </div>
    </aside>
  );
}

export function MobileAppSidebar() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border/60 bg-background/80 backdrop-blur lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" />
          <span className="sr-only">Abrir navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-sm border-border/40 bg-background/95 px-6 py-8 backdrop-blur-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
            News Analyst
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Resume artículos, detecta sesgos y planifica fact-check.
          </p>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-transparent px-4 py-3",
                  "active:scale-[0.98]",
                  isActive ? "border-primary/50 bg-primary/10" : "bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/60",
                  )}
                >
                  <Icon className="h-[20px] w-[20px]" />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground/80">Consejo</p>
          <p className="mt-2 leading-relaxed">
            Explora el historial para copiar el informe Markdown o ver los fact-check priorizados.
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-3 w-full rounded-full border-border/60 bg-background/80"
          >
            <Link href="/historial">Ir al historial</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SidebarFooter({ stats }: { stats?: SidebarStats }) {
  if (!stats) {
    return (
      <div className="rounded-2xl border border-border/40 bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
        Revisa el historial para copiar informes y seguir la evolución.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Resumen</p>
      <div className="flex items-center justify-between text-sm text-foreground">
        <span>Informes</span>
        <BadgeChip>{stats.totalReports}</BadgeChip>
      </div>
      <div className="flex items-center justify-between text-sm text-foreground">
        <span>Claims</span>
        <BadgeChip>{stats.totalClaims}</BadgeChip>
      </div>
      <Button asChild variant="ghost" size="sm" className="justify-start px-0 text-xs text-muted-foreground">
        <Link href="/historial">Ver historial completo →</Link>
      </Button>
    </div>
  );
}

function BadgeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-background/80 px-2 py-1 text-xs font-semibold ring-1 ring-border/60">
      {children}
    </span>
  );
}
