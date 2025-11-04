"use client";

import * as React from "react";
import Clipboard from "lucide-react/dist/esm/icons/clipboard";
import Check from "lucide-react/dist/esm/icons/check";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ListChecks from "lucide-react/dist/esm/icons/list-checks";
import Quote from "lucide-react/dist/esm/icons/quote";
import ShieldQuestion from "lucide-react/dist/esm/icons/shield-question";
import Timer from "lucide-react/dist/esm/icons/timer";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalyzerResponse, Claim, SupportLevel } from "@/types/analysis";

export function AnalysisResults({ result }: { result: AnalyzerResponse }) {
  return (
    <div className="space-y-6">
      <SummaryHeader result={result} />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <SummaryCard result={result} />
        <ToneCard result={result} />
      </div>
      <TimelineCard events={result.analysis.timeline} />
      <ClaimsCard claims={result.analysis.claims} />
      <FactCheckCard
        targets={result.analysis.fact_check_targets}
        questions={result.analysis.critical_questions}
        counterpoints={result.analysis.counterpoints}
        risks={result.analysis.risks}
      />
      <OutputTabs markdown={result.markdown_report} rawJson={result.raw_json} />
    </div>
  );
}

function SummaryHeader({ result }: { result: AnalyzerResponse }) {
  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/80">Fuente analizada</p>
          <CardTitle className="text-lg font-semibold tracking-tight">{result.source}</CardTitle>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="rounded-full border-border/60">
            {result.summary_counts.claims} claims
          </Badge>
          <Badge variant="outline" className="rounded-full border-border/60">
            {result.summary_counts.questions} preguntas críticas
          </Badge>
          <Badge variant="outline" className="rounded-full border-border/60">
            {result.summary_counts.fact_checks} verificaciones
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ result }: { result: AnalyzerResponse }) {
  return (
    <Card className="h-full border border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Resumen 5W + contexto</CardTitle>
        <CardDescription>
          Síntesis estructurada con quién, qué, cuándo, dónde y contexto adicional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-foreground">
        {result.analysis.summary.split("\n").map((paragraph, index) => (
          <p key={index} className="text-muted-foreground">
            {paragraph.trim()}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function ToneCard({ result }: { result: AnalyzerResponse }) {
  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Tono y sesgo</CardTitle>
        <CardDescription>
          Evaluación cualitativa con indicadores concretos de lenguaje, fuentes o énfasis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>{result.analysis.tone_and_bias}</p>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/80">Indicadores</p>
          <ul className="space-y-2">
            {result.analysis.tone_bias_indicators.map((indicator) => (
              <li key={indicator} className="flex gap-2 rounded-xl bg-muted/40 p-3">
                <span className="mt-1 h-2 w-2 flex-none rounded-full bg-primary/60" />
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineCard({ events }: { events: AnalyzerResponse["analysis"]["timeline"] }) {
  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4" />
          Línea de tiempo
        </CardTitle>
        <CardDescription>Eventos clave (3–5) con fecha/hora aproximada.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {events.map((event, index) => (
            <li key={`${event.timestamp}-${index}`} className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70">{event.timestamp}</p>
              <p className="mt-2 text-sm text-foreground">{event.description}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function ClaimsCard({ claims }: { claims: Claim[] }) {
  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4" />
          Claims evaluados
        </CardTitle>
        <CardDescription>
          Cada claim incluye cita literal, emisor y nivel de soporte (none, weak, moderate, strong).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {claims.map((claim, index) => (
          <ClaimItem key={`${claim.statement}-${index}`} claim={claim} index={index + 1} />
        ))}
      </CardContent>
    </Card>
  );
}

function ClaimItem({ claim, index }: { claim: Claim; index: number }) {
  const supportConfig: Record<SupportLevel, { label: string; className: string }> = {
    none: { label: "Sin soporte", className: "bg-red-500/15 text-red-500" },
    weak: { label: "Soporte débil", className: "bg-orange-500/15 text-orange-500" },
    moderate: { label: "Soporte moderado", className: "bg-amber-500/15 text-amber-500" },
    strong: { label: "Soporte sólido", className: "bg-emerald-500/15 text-emerald-500" },
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-full border-border/60">
            Claim #{index}
          </Badge>
          <Badge className={`rounded-full ${supportConfig[claim.support_level].className}`}>
            {supportConfig[claim.support_level].label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{claim.speaker}</p>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{claim.statement}</h3>
      <blockquote className="mt-3 flex gap-3 rounded-xl border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">
        <Quote className="mt-1 h-4 w-4 flex-none text-muted-foreground/70" />
        <span>{claim.quote}</span>
      </blockquote>
      <p className="mt-3 text-sm text-muted-foreground">{claim.analysis}</p>
      {claim.notes && (
        <p className="mt-3 rounded-lg border border-dashed border-border/50 bg-amber-500/10 p-3 text-xs text-amber-600">
          Nota: {claim.notes}
        </p>
      )}
    </div>
  );
}

function FactCheckCard({
  targets,
  questions,
  counterpoints,
  risks,
}: {
  targets: AnalyzerResponse["analysis"]["fact_check_targets"];
  questions: string[];
  counterpoints: string[];
  risks: string[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldQuestion className="h-4 w-4" />
            Fact-check prioritario
          </CardTitle>
          <CardDescription>
            Afirmaciones con riesgo de inexactitud, fuentes sugeridas y plan de verificación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {targets.map((target, index) => (
            <div key={`${target.claim}-${index}`} className="rounded-xl border border-border/50 bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">{target.claim}</p>
              <Separator className="my-3 bg-border/50" />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Plan de verificación</p>
              <p className="mt-1 text-sm text-muted-foreground">{target.verification_plan}</p>
              {target.suggested_sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {target.suggested_sources.map((source) => (
                    <Badge key={source} variant="outline" className="rounded-full border-border/50">
                      {source}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Preguntas y contrapuntos
          </CardTitle>
          <CardDescription>
            Cuestiona decisiones editoriales, fuentes e intencionalidades; incorpora narrativas alternativas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-muted-foreground">
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground/80">
              Preguntas críticas
            </h3>
            <ul className="space-y-2">
              {questions.map((question, index) => (
                <li key={`${question}-${index}`} className="rounded-xl border border-border/50 bg-muted/30 p-3">
                  {question}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground/80">
              Contrapuntos
            </h3>
            <ul className="space-y-2">
              {counterpoints.map((counterpoint, index) => (
                <li key={`${counterpoint}-${index}`} className="rounded-xl border border-border/50 bg-muted/30 p-3">
                  {counterpoint}
                </li>
              ))}
            </ul>
          </div>
          {risks.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground/80">Riesgos</h3>
              <ul className="space-y-2">
                {risks.map((risk, index) => (
                  <li key={`${risk}-${index}`} className="rounded-xl border border-border/50 bg-muted/30 p-3">
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OutputTabs({ markdown, rawJson }: { markdown: string; rawJson: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false);
  const sanitizedMarkdown = useSanitizedMarkdown(markdown);

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base">Salidas del agente</CardTitle>
          <CardDescription>Consulta el Markdown enriquecido o el JSON original.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton label="Copiar Markdown" onCopy={() => handleCopy(markdown)} copied={copied} />
          <CopyButton
            label="Copiar JSON"
            onCopy={() => handleCopy(JSON.stringify(rawJson, null, 2))}
            copied={copied}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="markdown" className="space-y-4">
          <TabsList className="w-full justify-start bg-muted/60">
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="markdown">
            <ScrollArea className="max-h-[400px] rounded-xl border border-border/60 bg-background/70 p-4">
              <article
                className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizedMarkdown }}
              />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="json">
            <ScrollArea className="max-h-[400px] rounded-xl border border-border/60 bg-background/70 p-4">
              <pre className="text-xs text-muted-foreground">
                {JSON.stringify(rawJson, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CopyButton({ label, onCopy, copied }: { label: string; onCopy: () => void; copied: boolean }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function useSanitizedMarkdown(markdown: string): string {
  const [sanitized, setSanitized] = useState("");

  useEffect(() => {
    let mounted = true;

    async function convert() {
      try {
        const [{ marked }, dompurify] = await Promise.all([import("marked"), import("dompurify")]);
        const raw = marked.parse(markdown, { breaks: true }) as string;
        const clean = dompurify.default.sanitize(raw);

        if (mounted) {
          setSanitized(clean);
        }
      } catch (error) {
        if (mounted) {
          setSanitized("<p>No se pudo renderizar el informe.</p>");
        }
        console.error("Error rendering markdown", error);
      }
    }

    convert();

    return () => {
      mounted = false;
    };
  }, [markdown]);

  return sanitized;
}
