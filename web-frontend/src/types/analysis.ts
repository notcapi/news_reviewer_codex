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

export interface HistoryEntry {
  id: string;
  summary: string;
  source_url: string | null;
  source_domain: string | null;
  title: string | null;
  generated_at: string | null;
  claims_count: number;
  fact_check_count: number;
  question_count: number;
  timeline_count: number;
  json_filename: string;
  markdown_filename: string | null;
  markdown_url: string | null;
  json_url: string;
  timeline: TimelineEvent[];
  critical_questions: string[];
  fact_check_targets: FactCheckTarget[];
}

export interface HistoryStats {
  total_reports: number;
  total_claims: number;
  total_fact_checks: number;
  total_questions: number;
  latest_generated_at: string | null;
}

export interface HistoryResponse {
  total: number;
  stats: HistoryStats;
  items: HistoryEntry[];
}
