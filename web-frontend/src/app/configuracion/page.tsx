import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeBoundary } from "@/components/theme-boundary";

export default function SettingsPage() {
  return (
    <ThemeBoundary>
      <AppShell>
        <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Preferencias del agente</h1>
          <p className="text-muted-foreground">
            Ajusta credenciales, parámetros de salida y comportamiento del fact-check.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Credenciales</CardTitle>
              <CardDescription>
                Las llaves se almacenan en el servidor FastAPI. Asegúrate de configurar variables en .env.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="llamafarm">LlamaFarm API Key</Label>
                <Input id="llamafarm" placeholder="lfk_************************" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groq">Groq API Key</Label>
                <Input id="groq" placeholder="gsk_************************" disabled />
              </div>
              <Button disabled className="w-fit rounded-full">
                Guardar cambios (próximamente)
              </Button>
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Modo de análisis</CardTitle>
              <CardDescription>
                Define comportamiento por defecto para generar timelines, claims y fact-check.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                En la siguiente iteración podrás elegir modos como “Expreso”, “Investigativo” o “Prensa local”
                para adaptar el nivel de detalle y el tono de las preguntas críticas.
              </p>
              <p>
                Mientras tanto, utiliza las banderas disponibles en la CLI/web actual para ajustar el flujo.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </AppShell>
    </ThemeBoundary>
  );
}
