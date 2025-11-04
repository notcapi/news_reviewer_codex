import type { ReactNode } from "react";

import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Link2, Loader2, Newspaper, Sparkles } from "lucide-react";

const recentReports = [
  {
    id: "1",
    title: "Fiscalía y correos del entorno Ayuso",
    outlet: "La Razón",
    createdAt: "04 Nov 2025, 13:07",
    status: "Revisado",
    href: "/historial",
  },
  {
    id: "2",
    title: "Dimisión de Mazón y plazos de investidura",
    outlet: "ABC",
    createdAt: "03 Nov 2025, 11:30",
    status: "Revisado",
    href: "/historial",
  },
  {
    id: "3",
    title: "Crisis energética en Europa",
    outlet: "El País",
    createdAt: "29 Oct 2025, 18:45",
    status: "En cola",
    href: "/historial",
  },
];

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <HeroBanner />

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Informes generados"
            value="128"
            trend="+12% vs. mes anterior"
            icon={<Newspaper className="h-5 w-5" />}
            gradient="from-primary/20 via-primary/0 to-transparent"
          />
          <MetricCard
            label="Tasa de completado"
            value="94%"
            trend="+4 puntos"
            icon={<Sparkles className="h-5 w-5" />}
            gradient="from-emerald-500/20 via-emerald-500/0 to-transparent"
          />
          <MetricCard
            label="Análisis en cola"
            value="03"
            trend="Última actualización: hace 5 min"
            icon={<Loader2 className="h-5 w-5 animate-spin" />}
            gradient="from-purple-500/20 via-purple-500/0 to-transparent"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Últimos informes</CardTitle>
                <CardDescription>
                  Sigue la evolución de tus análisis recientes y retoma tareas pendientes.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/historial" className="flex items-center gap-2">
                  Ver historial <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={report.href}
                  className="flex flex-col gap-2 rounded-xl border border-transparent bg-muted/40 p-4 transition hover:border-border/70 hover:bg-muted/60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{report.title}</span>
                      <span className="text-xs text-muted-foreground">{report.outlet}</span>
                    </div>
                    <Badge variant={report.status === "En cola" ? "outline" : "secondary"}>
                      {report.status}
                    </Badge>
                  </div>
                  <Separator className="bg-border/60" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{report.createdAt}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/60 sm:inline-flex" />
                    <span className="flex items-center gap-1 text-xs">
                      <Link2 className="h-3 w-3" />
                      Resultado estructurado
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Estado del agente</CardTitle>
              <CardDescription>
                Monitoriza la disponibilidad del analista antes de lanzar nuevos procesos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Disponibilidad</span>
                <Badge className="bg-emerald-500/15 text-emerald-500">Operativo</Badge>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uso de cuota</span>
                  <span className="font-medium text-foreground">67%</span>
                </div>
                <Progress value={67} className="h-2 bg-muted/60" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Integraciones</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="rounded-full border-border/50">
                    LlamaFarm · SSL verificado
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-border/50">
                    Groq · 0 errores hoy
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-border/50">
                    Cache local activa
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Borradores recientes</CardTitle>
              <CardDescription>Retoma análisis en progreso antes de enviarlos a revisión.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="urls" className="flex flex-col gap-4">
                <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                  <TabsTrigger value="urls">URLs en espera</TabsTrigger>
                  <TabsTrigger value="texto">Textos pegados</TabsTrigger>
                </TabsList>
                <TabsContent value="urls" className="space-y-3">
                  <DraftRow
                    title="Investigación sobre contratos públicos"
                    meta="elconfidencial.com · creado hace 2h"
                    status="pendiente de scraping"
                  />
                  <DraftRow
                    title="Contexto electoral Latinoamérica"
                    meta="elpais.com · creado hace 6h"
                    status="extrayendo claims"
                  />
                </TabsContent>
                <TabsContent value="texto" className="space-y-3">
                  <DraftRow
                    title="Informe manual sobre regulación IA"
                    meta="Pegado por Sonia · hace 1h"
                    status="terminando fact-check"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Guías rápidas</CardTitle>
              <CardDescription>Optimiza el resultado del agente con buenas prácticas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <GuideItem
                title="Prioriza fuentes oficiales"
                description="Incluye enlaces a documentos primarios para que el fact-check sea verificable."
              />
              <GuideItem
                title="Pide contra-narrativas"
                description="Solicita contrapuntos explícitos si el artículo es muy alineado con una versión."
              />
              <GuideItem
                title="Ajusta el tono"
                description="Selecciona 'moderado' o 'crítico' para hacer preguntas más incisivas."
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function HeroBanner() {
  return (
    <Card className="relative overflow-hidden border border-border/60 bg-card/90 px-6 py-8 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <Badge className="w-fit rounded-full bg-primary/20 text-xs font-medium text-primary">
            Nueva interfaz · beta
          </Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Inteligencia editorial para tus artículos en segundos
            </h1>
            <p className="text-base text-muted-foreground sm:max-w-[42ch]">
              Lanza el agente, obtiene un resumen 5W enriquecido, claims con soporte y verificaciones accionables.
              Personaliza el nivel de escepticismo y detecta sesgos con indicadores concretos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/analizar">Empezar un análisis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-border/70">
              <Link href="/guia">Ver guía de uso</Link>
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-border/70 bg-background/80 p-5 md:max-w-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
            <span>Estado del pipeline</span>
            <ModeToggle />
          </div>
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
            <div className="flex items-center justify-between text-sm font-medium text-foreground">
              <span>Recolección</span>
              <span>Completado</span>
            </div>
            <Progress value={100} className="h-1.5 bg-border/40" />
            <div className="flex items-center justify-between text-sm font-medium text-foreground">
              <span>Procesamiento</span>
              <span>82%</span>
            </div>
            <Progress value={82} className="h-1.5 bg-border/40" />
            <div className="flex items-center justify-between text-sm font-medium text-foreground">
              <span>Fact-check</span>
              <span>24%</span>
            </div>
            <Progress value={24} className="h-1.5 bg-border/40" />
          </div>
          <p className="text-xs text-muted-foreground">
            Ajusta el flujo en configuración para priorizar timeline, claims o verificación según la urgencia.
          </p>
        </div>
      </div>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  trend,
  icon,
  gradient,
}: {
  label: string;
  value: string;
  trend: string;
  icon: ReactNode;
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", gradient)} />
      <CardHeader className="relative flex flex-row items-start justify-between gap-4">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-1 text-3xl font-semibold tracking-tight">{value}</CardTitle>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 text-primary shadow-sm">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative text-sm text-muted-foreground">{trend}</CardContent>
    </Card>
  );
}

function DraftRow({
  title,
  meta,
  status,
}: {
  title: string;
  meta: string;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/40 bg-muted/30 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </div>
      <Badge variant="outline" className="w-fit rounded-full border-border/50">
        {status}
      </Badge>
    </div>
  );
}

function GuideItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
