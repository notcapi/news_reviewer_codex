from __future__ import annotations

from datetime import datetime
from textwrap import dedent
from typing import Dict, List

from .content_extraction import ExtractedContent
from .schemas import ArticleAnalysis, Claim, FactCheckTarget, TimelineEvent


def _claims_to_markdown(claims: list[Claim]) -> str:
    if not claims:
        return "- No se identificaron claims principales."

    bullets = []
    for claim in claims:
        notes = f"\n    - Notas: {claim.notes}" if claim.notes else ""
        bullets.append(
            f"- **Claim:** {claim.statement}\n"
            f"    - Cita: “{claim.quote}”\n"
            f"    - Fuente: {claim.speaker}\n"
            f"    - Soporte: `{claim.support_level}`\n"
            f"    - Análisis: {claim.analysis}{notes}"
        )
    return "\n".join(bullets)


def _list_to_markdown(items: list[str], empty_message: str) -> str:
    if not items:
        return f"- {empty_message}"
    return "\n".join(f"- {item}" for item in items)


def _timeline_to_markdown(events: List[TimelineEvent]) -> str:
    if not events:
        return "- No se identificaron hitos temporales claros."
    return "\n".join(
        f"- {event.timestamp}: {event.description}"
        for event in events
    )


def _fact_check_to_markdown(targets: List[FactCheckTarget]) -> str:
    if not targets:
        return "- No se identificaron afirmaciones prioritarias para verificación."

    bullets = []
    for target in targets:
        sources = target.suggested_sources or []
        sources_md = (
            "\n      - ".join([""] + sources) if sources else " (sin fuentes sugeridas)"
        )
        bullets.append(
            f"- **Afirmación:** {target.claim}\n"
            f"    - Plan de verificación: {target.verification_plan}\n"
            f"    - Fuentes sugeridas:{sources_md}"
        )
    return "\n".join(bullets)


def build_markdown_report(
    extracted: ExtractedContent,
    analysis: ArticleAnalysis,
    metadata: Dict,
) -> str:
    """Genera un informe en Markdown con el resultado del análisis."""
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    header = dedent(
        f"""
        # Informe de análisis periodístico

        - Fuente: {extracted.source}
        - Título detectado: {extracted.candidate_title or "No disponible"}
        - Idioma detectado: {extracted.language or "No detectado"}
        - Fecha de generación: {timestamp}
        """
    ).strip()

    sections = [
        header,
        "## Resumen",
        analysis.summary,
        "## Línea de tiempo",
        _timeline_to_markdown(analysis.timeline),
        "## Claims principales y soporte",
        _claims_to_markdown(analysis.claims),
        "## Tono y posibles sesgos",
        analysis.tone_and_bias or "No se identificaron sesgos.",
        "## Indicadores del tono/sesgo",
        _list_to_markdown(
            analysis.tone_bias_indicators,
            "No se hallaron indicadores suficientes (no concluyente).",
        ),
        "## Incertidumbres o áreas poco claras",
        _list_to_markdown(
            analysis.uncertainties,
            "No se identificaron incertidumbres relevantes.",
        ),
        "## Declaraciones a verificar (fact-check)",
        _fact_check_to_markdown(analysis.fact_check_targets),
        "## Riesgos, implicaciones o impacto",
        _list_to_markdown(
            analysis.risks,
            "No se describieron riesgos o impactos significativos.",
        ),
        "## Preguntas críticas para reflexionar",
        _list_to_markdown(
            analysis.critical_questions,
            "No se sugirieron preguntas adicionales.",
        ),
        "## Contrapuntos posibles",
        _list_to_markdown(
            analysis.counterpoints,
            "No se identificaron contrapuntos claros.",
        ),
    ]

    if metadata:
        sections.append("## Metadatos del modelo")
        meta_lines = "\n".join(f"- {key}: {value}" for key, value in metadata.items())
        sections.append(meta_lines or "- Sin metadatos adicionales.")

    return "\n\n".join(section.strip() for section in sections)
