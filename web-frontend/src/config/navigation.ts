import Clock from "lucide-react/dist/esm/icons/clock";
import PenSquare from "lucide-react/dist/esm/icons/pen-square";
import Settings from "lucide-react/dist/esm/icons/settings";
import type { LucideIcon } from "lucide-react";

export type NavEntry = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  shortcut?: string;
};

export const primaryNav: NavEntry[] = [
  {
    title: "Nuevo análisis",
    href: "/",
    icon: PenSquare,
    description: "Lanza el agente con URL o texto plano.",
    shortcut: "⌘1",
  },
  {
    title: "Historial",
    href: "/historial",
    icon: Clock,
    description: "Explora informes recientes y planes de verificación.",
    shortcut: "⌘2",
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
    description: "Gestiona credenciales y preferencias.",
    shortcut: "⌘3",
  },
];
