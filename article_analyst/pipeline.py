from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

from .content_extraction import ContentExtractor, ExtractedContent
from .prompting import build_analysis_prompt, format_prompt_input
from .renderers import build_markdown_report
from .schemas import ModelAnalysisOutput, ReportBundle


@dataclass(slots=True)
class AnalyzerDependencies:
    extractor: ContentExtractor
    llm: BaseChatModel
    prompt: ChatPromptTemplate


class ArticleAnalyzer:
    """Orquesta el flujo completo de análisis del artículo."""

    def __init__(
        self,
        dependencies: AnalyzerDependencies,
        *,
        output_dir: Path | str = Path("outputs"),
    ) -> None:
        self.extractor = dependencies.extractor
        self.llm = dependencies.llm
        self.prompt = dependencies.prompt
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._chain = self.prompt | self.llm

    def analyze_url(self, url: str, *, save: bool = True) -> ReportBundle:
        extracted = self.extractor.from_url(url)
        return self._analyze_extracted(extracted, save=save)

    def analyze_text(self, text: str, *, source: str = "provided-text", save: bool = True) -> ReportBundle:
        extracted = self.extractor.from_text(text, source=source)
        return self._analyze_extracted(extracted, save=save)

    def _analyze_extracted(self, extracted: ExtractedContent, *, save: bool) -> ReportBundle:
        prompt_input = format_prompt_input(
            title=extracted.candidate_title,
            language=extracted.language,
            source=extracted.source,
            article_text=extracted.text,
        )

        message = self._chain.invoke(prompt_input)
        content = getattr(message, "content", message)

        try:
            raw_json = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError("La respuesta del modelo no es JSON válido.") from exc

        try:
            validated = ModelAnalysisOutput.model_validate(raw_json)
        except Exception as exc:  # ValidationError
            preview = json.dumps(raw_json, ensure_ascii=False)
            if len(preview) > 500:
                preview = f"{preview[:500]}…"
            raise ValueError(
                f"La respuesta del modelo no cumple el esquema esperado. Contenido recibido: {preview}"
            ) from exc
        markdown = build_markdown_report(extracted, validated.analysis, validated.metadata)
        bundle = ReportBundle(
            analysis=validated.analysis,
            markdown_report=markdown,
            raw_json=raw_json,
        )

        if save:
            self._persist_outputs(bundle, extracted)

        return bundle

    def _persist_outputs(self, bundle: ReportBundle, extracted: ExtractedContent) -> None:
        base_name = self._build_output_stem(extracted)
        json_path = self.output_dir / f"{base_name}.json"
        md_path = self.output_dir / f"{base_name}.md"

        json_text = json.dumps(bundle.raw_json, ensure_ascii=False, indent=2)
        json_path.write_text(json_text, encoding="utf-8")
        md_path.write_text(bundle.markdown_report, encoding="utf-8")

    def _build_output_stem(self, extracted: ExtractedContent) -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        title = extracted.candidate_title or "analisis"
        slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", title.lower()).strip("-")
        if not slug:
            slug = "analisis"
        return f"{timestamp}_{slug[:60]}"
