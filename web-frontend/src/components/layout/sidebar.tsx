"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative hidden w-[280px] flex-col border-r border-border/60 bg-background/80 px-6 py-8 backdrop-blur lg:flex">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Panel</p>
          <h1 className="text-xl font-semibold tracking-tight">News Analyst</h1>
        </div>
        <Separator className="bg-border/60" />
        <nav className="flex flex-1 flex-col gap-4">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "group flex flex-col gap-1 rounded-xl border border-transparent bg-transparent p-3 transition-all",
                  "hover:border-border/80 hover:bg-muted/40 hover:shadow-sm",
                  isActive && "border-primary/60 bg-muted/60 shadow-sm",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="pointer-events-none w-fit">
                    Activo
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-xl border border-border/60 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Consejo</p>
          <p>Importa un artículo y deja que el agente resuma los 5W, claims y verificación.</p>
        </div>
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
      <SheetContent side="left" className="w-[320px] border-border/60 bg-background/95 backdrop-blur">
        <SheetHeader className="text-left">
          <SheetTitle className="tracking-tight">News Analyst</SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-4">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "group flex flex-col gap-1 rounded-xl border border-transparent bg-transparent p-3 transition-all",
                  "hover:border-border/80 hover:bg-muted/40 hover:shadow-sm",
                  isActive && "border-primary/60 bg-muted/60 shadow-sm",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
