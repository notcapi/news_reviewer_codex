import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const tips = [
  {
    title: "Cómo conseguir mejores timelines",
    copy:
      "Aporta la cronología básica en la petición y pide quebrar eventos por actores. El agente completará vacíos con contexto adicional.",
  },
  {
    title: "Profundiza en los claims",
    copy:
      "Pide mínimo cuatro claims y especifica si quieres evaluaciones divergentes o referencias cruzadas con notas previas.",
  },
  {
    title: "Fact-check con rigor",
    copy:
      "Solicita siempre fuentes oficiales (BOE, BOJA, Sentencias) y hemerotecas con fecha exacta para minimizar ambigüedades.",
  },
];

export default function GuidePage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Guía de uso rápido</h1>
          <p className="text-muted-foreground">
            Tanto la CLI como la interfaz web comparten el mismo backend. Estas pautas ayudan a obtener informes más útiles.
          </p>
        </div>
        <Card className="border border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Buenas prácticas</CardTitle>
            <CardDescription>
              Ajusta tus prompts para obtener resúmenes con 5W claros, timelines completos y fact-check accionable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {tips.map((tip) => (
              <div key={tip.title} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{tip.title}</h2>
                  <p className="text-sm text-muted-foreground">{tip.copy}</p>
                </div>
                <Separator className="bg-border/40" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
