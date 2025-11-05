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
import { Separator } from "@/components/ui/separator";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Newspaper from "lucide-react/dist/esm/icons/newspaper";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

import { fetchHistory } from "@/lib/api-client";
import { formatDateTime, formatNumber, truncate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HistoryEntry, HistoryStats } from "@/types/analysis";

const API_BASE = process.env.NEXT_PUBLIC_ANALYZER_API ?? "http://localhost:8000";

interface LandingReport {
  id: string;
  title: string;
  domain: string;
  dateLabel: string;
  summary: string;
  href: string;
  sourceUrl: string | null;
  generatedAt: string | null;
  stats: {
    claims: number;
    factChecks: number;
    questions: number;
    timeline: number;
  };
  criticalQuestions: string[];
  factChecks: HistoryEntry["fact_check_targets"];
}

function deriveDomain(url: string | null): string {
  if (!url) return "Fuente desconocida";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Fuente desconocida";
  }
}

function toLandingReport(item: HistoryEntry): LandingReport {
  const domain = item.source_domain ?? deriveDomain(item.source_url);
  const fallbackTitle = item.title ?? (item.source_url ? deriveDomain(item.source_url) : "Informe sin título");
  const href = item.markdown_url ? `${API_BASE}${item.markdown_url}` : item.source_url ?? "#";

  return {
    id: item.id,
    title: item.title ?? fallbackTitle,
    domain,
    dateLabel: formatDateTime(item.generated_at),
    summary: truncate(item.summary, 240),
    href,
    sourceUrl: item.source_url,
    generatedAt: item.generated_at,
    stats: {
      claims: item.claims_count,
      factChecks: item.fact_check_count,
      questions: item.question_count,
      timeline: item.timeline_count,
    },
    criticalQuestions: item.critical_questions,
    factChecks: item.fact_check_targets,
  };
}

export default async function Home() {
const { items, stats } = await fetchHistory({
  limit: 12,
  includeDetails: true,
  init: {
    next: { revalidate: 120 },
  },
});

  const recentReports = items.map(toLandingReport);
  const latestReport = recentReports[0] ?? null;

  const metrics = buildMetrics(stats);
  const criticalQuestions = recentReports
    .flatMap((report) => report.criticalQuestions.map((question) => ({
      id: `${report.id}-question-${question.slice(0, 24)}`,
      question,
      reference: report.title,
      dateLabel: report.dateLabel,
    })))
    .slice(0, 4);

  const factChecks = recentReports
    .flatMap((report) =>
      report.factChecks.map((target, index) => ({
        id: `${report.id}-fact-${index}`,
        claim: target.claim,
        plan: target.verification_plan,
        sources: target.suggested_sources,
        reference: report.title,
        dateLabel: report.dateLabel,
      })),
    )
    .slice(0, 3);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <HeroBanner latestReport={latestReport} stats={stats} />

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Últimos informes</CardTitle>
                <CardDescription>
                  Sigue la evolución de los informes más recientes y accede a sus fichas completas.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/historial" className="flex items-center gap-2">
                  Ver historial <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReports.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no se han generado informes. Ejecuta un análisis para comenzar a poblar el historial.
                </p>
              ) : (
                recentReports.slice(0, 5).map((report) => (
                  <Link
                    key={report.id}
                    href={report.href}
                    target={report.href.startsWith("http") ? "_blank" : undefined}
                    rel={report.href.startsWith("http") ? "noreferrer" : undefined}
                    prefetch={false}
                    className="flex flex-col gap-2 rounded-xl border border-transparent bg-muted/40 p-4 transition hover:border-border/70 hover:bg-muted/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{report.title}</span>
                        <span className="text-xs text-muted-foreground">{report.domain}</span>
                      </div>
                      <Badge variant="outline">{report.dateLabel}</Badge>
                    </div>
                    <Separator className="bg-border/60" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{report.summary}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> Informe estructurado
                      </span>
                      <Badge variant="secondary" className="rounded-full">
                        {`Claims: ${formatNumber(report.stats.claims)}`}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {`Fact-check: ${formatNumber(report.stats.factChecks)}`}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {`Preguntas: ${formatNumber(report.stats.questions)}`}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <SummaryCard latestReport={latestReport} stats={stats} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Preguntas críticas recientes</CardTitle>
              <CardDescription>
                Interrogantes sugeridos por el agente para contrastar fuentes, decisiones o contexto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {criticalQuestions.length === 0 ? (
                <p>No hay preguntas críticas registradas todavía.</p>
              ) : (
                criticalQuestions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/50 bg-muted/40 p-4"
                  >
                    <p className="font-medium text-foreground">{item.question}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.reference} · {item.dateLabel}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Fact-check prioritarios</CardTitle>
              <CardDescription>
                Planes de verificación propuestos por el agente en los informes más recientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {factChecks.length === 0 ? (
                <p>No hay verificaciones registradas todavía.</p>
              ) : (
                factChecks.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/50 bg-muted/40 p-4"
                  >
                    <p className="font-medium text-foreground">{item.claim}</p>
                    <p className="mt-2 text-xs leading-relaxed">{item.plan}</p>
                    {item.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {item.sources.map((source) => (
                          <Badge
                            key={`${item.id}-${source}`}
                            variant="outline"
                            className="rounded-full border-border/60"
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {item.reference} · {item.dateLabel}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function HeroBanner({
  latestReport,
  stats,
}: {
  latestReport: LandingReport | null;
  stats: HistoryStats;
}) {
  return (
    <Card className="relative overflow-hidden border border-border/60 bg-card/90 px-6 py-8 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <Badge className="w-fit rounded-full bg-primary/20 text-xs font-medium text-primary">
            {`Se han generado ${formatNumber(stats.total_reports)} informes`}
          </Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Inteligencia editorial con claims trazados y fact-check accionable
            </h1>
            <p className="text-base text-muted-foreground sm:max-w-[52ch]">
              Elabora resúmenes 5W, líneas de tiempo y verificaciones basadas en evidencia.
              El agente ya registró {formatNumber(stats.total_claims)} claims y {formatNumber(stats.total_fact_checks)}
              planes de verificación.
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
            <span>Último informe</span>
            <ModeToggle />
          </div>
          {latestReport ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">{latestReport.title}</p>
                <p className="text-xs text-muted-foreground/80">
                  {latestReport.domain} · {latestReport.dateLabel}
                </p>
              </div>
              <p className="leading-relaxed">{latestReport.summary}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="rounded-full border-border/50">
                  Claims {formatNumber(latestReport.stats.claims)}
                </Badge>
                <Badge variant="outline" className="rounded-full border-border/50">
                  Fact-check {formatNumber(latestReport.stats.factChecks)}
                </Badge>
                <Badge variant="outline" className="rounded-full border-border/50">
                  Preguntas {formatNumber(latestReport.stats.questions)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-full px-4">
                  <Link
                    href={latestReport.href}
                    target={latestReport.href.startsWith("http") ? "_blank" : undefined}
                    rel={latestReport.href.startsWith("http") ? "noreferrer" : undefined}
                    prefetch={false}
                  >
                    Ver informe
                  </Link>
                </Button>
                {latestReport.sourceUrl && (
                  <Button asChild variant="outline" size="sm" className="rounded-full px-4">
                    <Link href={latestReport.sourceUrl} target="_blank" rel="noreferrer" prefetch={false}>
                      Ver fuente
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Aún no hay informes registrados</p>
              <p className="leading-relaxed">
                Ejecuta un análisis con una URL o texto para generar el primer informe y visualizar aquí los
                resultados.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function buildMetrics(stats: HistoryStats) {
  const averageClaims = stats.total_reports > 0 ? stats.total_claims / stats.total_reports : 0;
  return [
    {
      label: "Informes generados",
      value: formatNumber(stats.total_reports),
      trend: stats.latest_generated_at
        ? `Último informe: ${formatDateTime(stats.latest_generated_at)}`
        : "Sin informes todavía",
      icon: <Newspaper className="h-5 w-5" />,
      gradient: "from-primary/20 via-primary/0 to-transparent",
    },
    {
      label: "Claims analizados",
      value: formatNumber(stats.total_claims),
      trend:
        stats.total_reports > 0
          ? `Media por informe: ${formatNumber(averageClaims, { decimals: true })}`
          : "Aún sin datos",
      icon: <Sparkles className="h-5 w-5" />,
      gradient: "from-emerald-500/20 via-emerald-500/0 to-transparent",
    },
    {
      label: "Fact-check planificados",
      value: formatNumber(stats.total_fact_checks),
      trend: `Preguntas críticas: ${formatNumber(stats.total_questions)}`,
      icon: <Loader2 className="h-5 w-5" />,
      gradient: "from-purple-500/20 via-purple-500/0 to-transparent",
    },
  ];
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

function SummaryCard({
  latestReport,
  stats,
}: {
  latestReport: LandingReport | null;
  stats: HistoryStats;
}) {
  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Resumen global</CardTitle>
        <CardDescription>
          Totales consolidados del agente con información lista para seguimiento editorial.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Claims totales</span>
            <span className="font-semibold text-foreground">{formatNumber(stats.total_claims)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Fact-check generados</span>
            <span className="font-semibold text-foreground">{formatNumber(stats.total_fact_checks)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Preguntas críticas</span>
            <span className="font-semibold text-foreground">{formatNumber(stats.total_questions)}</span>
          </div>
        </div>
        <Separator className="bg-border/60" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Último informe generado</p>
          {latestReport ? (
            <div className="mt-3 space-y-2">
              <p className="font-semibold text-foreground">{latestReport.title}</p>
              <p className="text-xs text-muted-foreground">
                {latestReport.domain} · {latestReport.dateLabel}
              </p>
              <p className="text-xs leading-relaxed">{latestReport.summary}</p>
            </div>
          ) : (
            <p className="mt-3 text-xs">Genera un informe para ver aquí el resumen más reciente.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
