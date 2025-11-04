"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalyzerStore } from "@/store/analyzer-store";

export function AnalysisHistory() {
  const history = useAnalyzerStore((state) => state.history);

  if (history.length === 0) {
    return (
      <Card className="border border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
          <CardDescription>
            Los últimos análisis aparecerán aquí para reabrirlos rápidamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aún no has ejecutado análisis desde la web.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Historial reciente</CardTitle>
        <CardDescription>
          Últimos cinco análisis ejecutados en esta sesión.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[320px] pr-2">
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item.id} className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: es })}
                  </span>
                  <Badge variant="outline" className="rounded-full border-border/50">
                    {item.payload.inputType === "url" ? "URL" : "Texto"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {item.result.analysis.summary.split(".")[0] ?? "Análisis"}
                </p>
                {item.payload.url && (
                  <p className="mt-1 text-xs text-muted-foreground">{item.payload.url}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="rounded-full border-border/50">
                    {item.result.summary_counts.claims} claims
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-border/50">
                    {item.result.summary_counts.fact_checks} fact-checks
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-border/50">
                    {item.result.summary_counts.questions} preguntas
                  </Badge>
                </div>
                <a
                  href={item.payload.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                >
                  Abrir fuente
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
