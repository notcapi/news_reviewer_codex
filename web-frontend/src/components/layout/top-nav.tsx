"use client";

import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MobileAppSidebar } from "./sidebar";
import Bell from "lucide-react/dist/esm/icons/bell";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <MobileAppSidebar />
          <Link href="/" className="hidden flex-col leading-tight lg:flex">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground/80">News Analyst</span>
            <span className="text-lg font-semibold tracking-tight text-foreground">Panel editorial inteligente</span>
          </Link>
          <div className="lg:hidden">
            <Link href="/" className="text-base font-semibold tracking-tight">
              News Analyst
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 rounded-full border border-transparent bg-background/60 text-muted-foreground hover:border-border/70 hover:text-foreground lg:inline-flex"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="sr-only">Ver notificaciones</span>
          </Button>
          <ModeToggle />
          <Separator orientation="vertical" className="mx-2 hidden h-6 lg:block" />
          <Button className="hidden gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold tracking-tight text-primary-foreground shadow-sm transition hover:bg-primary/90 lg:inline-flex">
            <Sparkles className="h-[18px] w-[18px]" />
            Nuevo análisis
          </Button>
          <Avatar className="h-9 w-9 border border-border/60 bg-muted/60">
            <AvatarImage alt="Usuario" src="" />
            <AvatarFallback>NG</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
