export type SupportLevel = "none" | "weak" | "moderate" | "strong";

export interface Claim {
  statement: string;
  quote: string;
  speaker: string;
  support_level: SupportLevel;
  analysis: string;
  notes: string | null;
}

export interface TimelineEvent {
  timestamp: string;
  description: string;
}

export interface FactCheckTarget {
  claim: string;
  verification_plan: string;
  suggested_sources: string[];
}

export interface ArticleAnalysis {
  summary: string;
  claims: Claim[];
  tone_and_bias: string;
  tone_bias_indicators: string[];
  timeline: TimelineEvent[];
  uncertainties: string[];
  fact_check_targets: FactCheckTarget[];
  risks: string[];
  critical_questions: string[];
  counterpoints: string[];
}

export interface AnalyzerResponse {
  source: string;
  analysis: ArticleAnalysis;
  markdown_report: string;
  raw_json: Record<string, unknown>;
  summary_counts: {
    claims: number;
    questions: number;
    fact_checks: number;
  };
}

export type InputType = "url" | "text";
