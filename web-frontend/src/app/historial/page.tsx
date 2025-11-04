import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Historial de análisis</h1>
          <p className="text-muted-foreground">
            Próximamente podrás filtrar por fecha, medio, nivel de riesgo y exportar informes.
          </p>
        </div>
        <Card className="border border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base font-medium">Próximamente</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esta sección se conectará al backend para listar ejecuciones pasadas y permitir compartir
            informes con el equipo.
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
