import Clock from "lucide-react/dist/esm/icons/clock";
import PenSquare from "lucide-react/dist/esm/icons/pen-square";
import Settings from "lucide-react/dist/esm/icons/settings";
import type { LucideIcon } from "lucide-react";

export type NavEntry = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const primaryNav: NavEntry[] = [
  {
    title: "Nuevo análisis",
    href: "/",
    icon: PenSquare,
    description: "Analiza un artículo con URL o texto plano.",
  },
  {
    title: "Historial",
    href: "/historial",
    icon: Clock,
    description: "Consulta informes anteriores y descárgalos.",
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
    description: "Gestiona llaves API y preferencias avanzadas.",
  },
];
