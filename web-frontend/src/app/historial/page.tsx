import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Link2 from "lucide-react/dist/esm/icons/link-2";

import { ThemeBoundary } from "@/components/theme-boundary";
import { fetchHistory } from "@/lib/api-client";
import { formatDateTime, formatNumber, truncate } from "@/lib/format";
import type { HistoryEntry } from "@/types/analysis";

const API_BASE = process.env.NEXT_PUBLIC_ANALYZER_API ?? "http://localhost:8000";

const PAGE_SIZE = 24;

export default async function HistoryPage() {
  const { items, stats } = await fetchHistory({
    limit: PAGE_SIZE,
    includeDetails: true,
    init: {
      next: { revalidate: 60 },
    },
  });
  const hasMore = stats.total_reports > items.length;

  return (
    <ThemeBoundary>
      <AppShell stats={{ totalReports: stats.total_reports, totalClaims: stats.total_claims }}>
        <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Historial de análisis</h1>
          <p className="text-sm text-muted-foreground">
            Mostrando {formatNumber(items.length)} de {formatNumber(stats.total_reports)} informes generados.
            {hasMore && " Usa la CLI o ajusta el límite de la API para acceder a todo el histórico."}
          </p>
        </div>

        <Card className="border border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Totales del agente</CardTitle>
            <CardDescription>Conteos acumulados desde el primer informe registrado.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryItem label="Informes" value={stats.total_reports} />
            <SummaryItem label="Claims" value={stats.total_claims} />
            <SummaryItem label="Fact-checks" value={stats.total_fact_checks} />
            <SummaryItem label="Preguntas críticas" value={stats.total_questions} />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {items.length === 0 ? (
            <Card className="border border-border/60 bg-card/80 backdrop-blur">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay informes almacenados. Ejecuta un análisis para llenar este histórico.
              </CardContent>
            </Card>
          ) : (
            items.map((item) => <HistoryCard key={item.id} entry={item} />)
          )}
        </div>
      </section>
      </AppShell>
    </ThemeBoundary>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{formatNumber(value)}</p>
    </div>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const domain = entry.source_domain ?? deriveDomain(entry.source_url);
  const markdownHref = entry.markdown_url ? `${API_BASE}${entry.markdown_url}` : null;

  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">
            {entry.title ?? domain}
          </CardTitle>
          <CardDescription>
            {domain}
            {entry.generated_at ? ` · ${formatDateTime(entry.generated_at)}` : null}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="rounded-full">
            {`Claims ${formatNumber(entry.claims_count)}`}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {`Fact-check ${formatNumber(entry.fact_check_count)}`}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {`Preguntas ${formatNumber(entry.question_count)}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p className="leading-relaxed">{truncate(entry.summary, 360)}</p>
        {entry.critical_questions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Preguntas críticas</p>
            <ul className="space-y-2">
              {entry.critical_questions.slice(0, 3).map((question, index) => (
                <li
                  key={`${entry.id}-question-${index}`}
                  className="rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}
        {entry.fact_check_targets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
              Fact-check propuestos
            </p>
            <ul className="space-y-2">
              {entry.fact_check_targets.slice(0, 2).map((target, index) => {
                const sources = target.suggested_sources ?? [];

                return (
                  <li
                    key={`${entry.id}-fact-${index}`}
                    className="rounded-lg border border-border/50 bg-muted/30 p-3"
                  >
                    <p className="font-medium text-foreground">{target.claim}</p>
                    <p className="mt-1 text-xs leading-relaxed">{target.verification_plan}</p>
                    {sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        {sources.map((source) => (
                          <Badge
                            key={`${entry.id}-source-${source}`}
                            variant="outline"
                            className="rounded-full border-border/50"
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-3 text-xs">
          {markdownHref && (
            <Button asChild variant="outline" size="sm" className="rounded-full px-4">
              <Link href={markdownHref} target="_blank" rel="noreferrer" prefetch={false}>
                <FileText className="h-3.5 w-3.5" /> Informe Markdown
              </Link>
            </Button>
          )}
          {entry.source_url && (
            <Button asChild variant="ghost" size="sm" className="rounded-full px-4 text-muted-foreground">
              <Link href={entry.source_url} target="_blank" rel="noreferrer" prefetch={false}>
                <Link2 className="h-3.5 w-3.5" /> Fuente original
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm" className="rounded-full px-4 text-muted-foreground">
            <Link href={`${API_BASE}${entry.json_url}`} target="_blank" rel="noreferrer" prefetch={false}>
              <ArrowUpRight className="h-3.5 w-3.5" /> JSON crudo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
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
