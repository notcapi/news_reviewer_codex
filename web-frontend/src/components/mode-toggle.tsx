"use client";

import * as React from "react";
import Moon from "lucide-react/dist/esm/icons/moon";
import Sun from "lucide-react/dist/esm/icons/sun";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { theme, setTheme, themes } = useTheme();
  const modes = React.useMemo(
    () =>
      themes?.map((mode) => ({
        id: mode,
        label:
          mode === "system"
            ? "Automático"
            : mode === "dark"
              ? "Oscuro"
              : "Claro",
      })) ?? [],
    [themes],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="relative h-9 w-9 min-w-9 rounded-full border-border/60 bg-background/80 backdrop-blur"
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {modes.map((mode) => (
          <DropdownMenuItem
            key={mode.id}
            onClick={() => setTheme(mode.id)}
            className={mode.id === theme ? "font-medium" : undefined}
          >
            {mode.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
