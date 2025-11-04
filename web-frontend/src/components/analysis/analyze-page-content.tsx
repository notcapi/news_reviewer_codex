"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyzerStore } from "@/store/analyzer-store";
import { toast } from "sonner";

import { AnalysisForm } from "./analysis-form";
import { AnalysisHistory } from "./history-list";
import { AnalysisResults } from "./analysis-results";

export function AnalyzePageContent() {
  const result = useAnalyzerStore((state) => state.result);
  const error = useAnalyzerStore((state) => state.error);
  const resetError = useAnalyzerStore((state) => state.resetError);
  const isLoading = useAnalyzerStore((state) => state.isLoading);

  React.useEffect(() => {
    if (error) {
      toast.error(error);
      resetError();
    }
  }, [error, resetError]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Nuevo análisis</h1>
        <p className="text-muted-foreground">
          Lanza el pipeline completo del agente desde la web. Recibirás resumen 5W, claims, fact-check y preguntas.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Datos del artículo</CardTitle>
            <CardDescription>
              Usa URL o texto plano. El agente seguirá las mismas validaciones de la CLI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalysisForm />
          </CardContent>
        </Card>
        <AnalysisHistory />
      </div>

      {isLoading && (
        <Alert className="border border-border/60 bg-muted/40">
          <AlertTitle>Procesando</AlertTitle>
          <AlertDescription>
            El agente está extrayendo contenido, generando claims y verificaciones. Esto puede tardar unos segundos.
          </AlertDescription>
        </Alert>
      )}

      {result && <AnalysisResults result={result} />}
    </section>
  );
}
