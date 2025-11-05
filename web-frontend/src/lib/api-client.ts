import type { AnalyzerResponse, HistoryResponse, InputType } from "@/types/analysis";

const API_BASE = process.env.NEXT_PUBLIC_ANALYZER_API ?? "http://localhost:8000";

export type AnalyzeRequest = {
  inputType: InputType;
  url?: string;
  articleText?: string;
  saveOutputs?: boolean;
  signal?: AbortSignal;
};

export async function analyzeArticle({
  inputType,
  url,
  articleText,
  saveOutputs = false,
  signal,
}: AnalyzeRequest): Promise<AnalyzerResponse> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_type: inputType,
      url,
      article_text: articleText,
      save_outputs: saveOutputs,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await safeParseJSON(response);
    let detail: string | null = null;

    if (errorBody && typeof errorBody === "object") {
      const maybeDetail = (errorBody as { detail?: unknown }).detail;
      if (typeof maybeDetail === "string") {
        detail = maybeDetail;
      } else if (Array.isArray(maybeDetail)) {
        detail = maybeDetail
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object" && "msg" in item) {
              const message = (item as { msg?: unknown }).msg;
              return typeof message === "string" ? message : null;
            }
            return null;
          })
          .filter(Boolean)
          .join(". ");
      }
    }

    throw new Error(detail || response.statusText || "No se pudo procesar la solicitud");
  }

  const data = (await response.json()) as AnalyzerResponse;
  return data;
}

async function safeParseJSON(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

type HistoryFetchOptions = {
  limit?: number;
  offset?: number;
  includeDetails?: boolean;
  init?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } };
};

export async function fetchHistory(options: HistoryFetchOptions = {}): Promise<HistoryResponse> {
  const {
    limit = 10,
    offset = 0,
    includeDetails = false,
    init,
  } = options;

  const url = new URL(`${API_BASE}/api/history`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  if (includeDetails) {
    url.searchParams.set("include_details", "1");
  }

  const response = await fetch(url.toString(), init);

  if (!response.ok) {
    const errorBody = await safeParseJSON(response);
    let detail: string | null = null;

    if (errorBody && typeof errorBody === "object" && "detail" in errorBody) {
      const maybeDetail = (errorBody as { detail?: unknown }).detail;
      if (typeof maybeDetail === "string") {
        detail = maybeDetail;
      }
    }

    throw new Error(detail || response.statusText || "No se pudo recuperar el historial");
  }

  const data = (await response.json()) as HistoryResponse;
  return data;
}
