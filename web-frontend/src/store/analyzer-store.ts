import { create } from "zustand";

import { analyzeArticle, type AnalyzeRequest } from "@/lib/api-client";
import type { AnalyzerResponse, InputType } from "@/types/analysis";

export type AnalyzerHistoryItem = {
  id: string;
  createdAt: number;
  payload: {
    inputType: InputType;
    url?: string;
  };
  result: AnalyzerResponse;
};

type AnalyzerState = {
  isLoading: boolean;
  error: string | null;
  result: AnalyzerResponse | null;
  history: AnalyzerHistoryItem[];
  runAnalysis: (payload: Omit<AnalyzeRequest, "signal">) => Promise<void>;
  resetError: () => void;
};

export const useAnalyzerStore = create<AnalyzerState>((set, get) => ({
  isLoading: false,
  error: null,
  result: null,
  history: [],
  async runAnalysis(payload) {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    const controller = new AbortController();

    try {
      const result = await analyzeArticle({ ...payload, signal: controller.signal });
      set((state) => ({
        result,
        isLoading: false,
        history: [
          {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            payload: { inputType: payload.inputType, url: payload.url },
            result,
          },
          ...state.history.slice(0, 4),
        ],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      set({ error: message, isLoading: false });
      throw error;
    }
  },
  resetError() {
    if (get().error) {
      set({ error: null });
    }
  },
}));
