from __future__ import annotations

import json
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate


def build_analysis_prompt() -> ChatPromptTemplate:
    """Crea el prompt que guía al modelo para estructurar el análisis."""
    schema_example = {
        "metadata": {
            "model": "nombre del modelo (opcional)",
            "analysis_notes": "Notas internas del modelo (opcional)"
        },
        "analysis": {
            "summary": "Resumen con quién, qué, cuándo, dónde y contexto (≥3 frases).",
            "timeline": [
                {"timestamp": "Fecha/hora aproximada", "description": "Qué ocurrió"}
            ],
            "claims": [
                {
                    "statement": "Claim principal",
                    "quote": "Cita literal ≤30 palabras",
                    "speaker": "Quién lo dijo",
                    "support_level": "none|weak|moderate|strong",
                    "analysis": "Cómo respalda la evidencia",
                    "notes": "Notas adicionales opcionales"
                }
            ],
            "tone_and_bias": "Descripción del tono y sesgo",
            "tone_bias_indicators": [
                "Indicador textual concreto o 'no concluyente'"
            ],
            "uncertainties": [
                "Duda o aspecto poco claro"
            ],
            "fact_check_targets": [
                {
                    "claim": "Afirmación a verificar",
                    "verification_plan": "Qué y cómo validar",
                    "suggested_sources": [
                        "Fuente sugerida"
                    ]
                }
            ],
            "risks": [
                "Riesgo o impacto potencial"
            ],
            "critical_questions": [
                "Pregunta crítica incisiva"
            ],
            "counterpoints": [
                "Argumento que desafía la narrativa"
            ]
        }
    }
    schema_str = json.dumps(schema_example, ensure_ascii=False, indent=2)
    schema_str = schema_str.replace("{", "{{").replace("}", "}}")

    rules = """
- El resumen debe cubrir quién, qué, cuándo, dónde y contexto en al menos 3 frases.
- Genera una línea de tiempo con entre 3 y 5 eventos clave con fecha/hora aproximada.
- Reporta al menos 4 claims distintos; cada uno debe incluir cita literal (≤30 palabras), autor y nivel de soporte (none|weak|moderate|strong) más un análisis breve.
- Las citas deben escribirse sin duplicar comillas; si el texto trae comillas dobles, sustitúyelas por comillas simples o angulares para mantener JSON válido.
- Asegúrate de que cada claim sea único (sin duplicados).
- Justifica tono/sesgo con 2 o 3 indicadores textuales concretos; si no es posible, escribe “no concluyente”.
- Plantea preguntas críticas incisivas sobre decisiones, fuentes o intencionalidad (evita obviedades).
- En fact-check identifica 2 o 3 afirmaciones a verificar con plan concreto y fuentes sugeridas.
- Añade contrapuntos creíbles que desafíen la narrativa principal.
- No repitas ni cites definiciones tipo '$defs', 'title', 'type' u otros metadatos del esquema.
- Si falta información, explica la ausencia con detalle; no dejes campos vacíos.
- Limita cada cita literal a 30 palabras (resume si es más larga).
- Prioriza fidelidad al texto y evita especulaciones no sustentadas.
""".strip()

    system = (
        "Eres un analista periodístico riguroso. Evalúas artículos sin inventar datos, "
        "identificando claims, evidencias y sesgos. Sigue estrictamente estas reglas:\n"
        f"{rules}\n"
        "La estructura EXACTA que debes devolver es la siguiente (rellénala con datos reales, sin dejar marcadores):\n"
        f"{schema_str}\n"
        "No incluyas texto adicional, ni explicaciones fuera del JSON. "
        "No agregues campos extra ni metas definiciones del esquema. Si cierta información no aparece en el artículo, explica brevemente la ausencia."
    )

    human = (
        "Analiza el siguiente artículo.\n"
        "Metadatos:\n"
        "- Título detectado: {title}\n"
        "- Idioma detectado: {language}\n"
        "- Fuente: {source}\n\n"
        "Contenido:\n"
        "{article_text}\n"
    )

    return ChatPromptTemplate.from_messages(
        [
            ("system", system),
            ("human", human),
        ]
    )


def format_prompt_input(
    *,
    title: str | None,
    language: str | None,
    source: str,
    article_text: str,
) -> Dict[str, Any]:
    return {
        "title": title or "Título no disponible",
        "language": language or "Idioma no detectado",
        "source": source,
        "article_text": article_text,
    }
