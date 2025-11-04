"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Upload from "lucide-react/dist/esm/icons/upload";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAnalyzerStore } from "@/store/analyzer-store";

const formSchema = z
  .object({
    inputType: z.enum(["url", "text"]).default("url"),
    url: z.string().url({ message: "Introduce una URL válida." }).optional(),
    articleText: z.string().optional(),
    saveOutputs: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.inputType === "url" && !data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La URL es obligatoria",
        path: ["url"],
      });
    }
    if (data.inputType === "text") {
      const content = data.articleText?.trim() ?? "";
      if (!content) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pega el texto del artículo",
          path: ["articleText"],
        });
      } else if (content.length < 400) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Añade al menos 400 caracteres para un análisis útil.",
          path: ["articleText"],
        });
      }
    }
  });

type AnalysisFormValues = z.input<typeof formSchema>;

export function AnalysisForm() {
  const { runAnalysis, isLoading } = useAnalyzerStore();

  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: "url",
      url: "",
      articleText: "",
      saveOutputs: true,
    },
  });

  const inputType = useWatch({ control: form.control, name: "inputType" }) ?? "url";

  const onSubmit = (values: AnalysisFormValues) => {
    const resolvedInputType = values.inputType ?? "url";
    return runAnalysis({
      inputType: resolvedInputType,
      url: resolvedInputType === "url" ? values.url?.trim() : undefined,
      articleText: resolvedInputType === "text" ? values.articleText?.trim() : undefined,
      saveOutputs: values.saveOutputs,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-1 backdrop-blur">
          <Tabs
            value={inputType}
            onValueChange={(value) => form.setValue("inputType", value as "url" | "text")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/60">
              <TabsTrigger value="url">Analizar URL</TabsTrigger>
              <TabsTrigger value="text">Pegar texto</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {inputType === "url" ? (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL del artículo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.ejemplo.com/noticia"
                    {...field}
                    className="h-12 rounded-xl border-border/70 bg-background/80"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="articleText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto del artículo</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Pega aquí el contenido completo..."
                    className="min-h-[220px] rounded-2xl border-border/60 bg-background/80"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="saveOutputs"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
              <div className="space-y-0.5">
                <FormLabel className="font-semibold">Guardar salidas</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Almacena JSON y Markdown en la carpeta <code>outputs/</code> del servidor.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2 font-semibold"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isLoading ? "Procesando" : "Lanzar análisis"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isLoading}
            onClick={() => form.reset()}
          >
            Limpiar
          </Button>
        </div>
      </form>
    </Form>
  );
}
