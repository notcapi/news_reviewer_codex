from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class SupportLevel(str, Enum):
    none = "none"
    weak = "weak"
    moderate = "moderate"
    strong = "strong"


class Claim(BaseModel):
    statement: str = Field(..., description="Descripción clara del claim o idea principal.")
    quote: str = Field(
        ...,
        description="Cita literal (<=30 palabras) del artículo asociada al claim.",
        max_length=300,
    )
    speaker: str = Field(
        ...,
        description="Persona o entidad que emite el claim o a quien se atribuye.",
    )
    support_level: SupportLevel = Field(
        ...,
        description="Nivel de soporte o evidencia percibido para el claim.",
    )
    analysis: str = Field(
        ...,
        description="Breve análisis de por qué la cita respalda (o no) el claim.",
    )
    notes: Optional[str] = Field(
        None,
        description="Notas adicionales sobre confiabilidad, contexto o dudas.",
    )


class TimelineEvent(BaseModel):
    timestamp: str = Field(
        ...,
        description="Fecha y hora aproximadas (ISO 8601 o descripción breve) del evento.",
    )
    description: str = Field(..., description="Descripción concreta de lo ocurrido.")


class FactCheckTarget(BaseModel):
    claim: str = Field(..., description="Afirmación que requiere verificación.")
    verification_plan: str = Field(
        ...,
        description="Qué información debe verificarse exactamente y cómo comprobarla.",
    )
    suggested_sources: List[str] = Field(
        default_factory=list,
        description="Fuentes o tipos de documentos recomendados para verificar.",
    )


class ArticleAnalysis(BaseModel):
    summary: str = Field(..., description="Resumen conciso del artículo.")
    claims: List[Claim] = Field(default_factory=list, description="Claims evaluados.")
    tone_and_bias: str = Field(..., description="Tono y sesgos detectados en el autor.")
    tone_bias_indicators: List[str] = Field(
        default_factory=list,
        description="Indicadores concretos del texto que justifican el tono o sesgo percibido.",
    )
    timeline: List[TimelineEvent] = Field(
        default_factory=list,
        description="Secuencia de 3-5 eventos clave con fecha/hora aproximada.",
    )
    uncertainties: List[str] = Field(
        default_factory=list,
        description="Áreas poco claras o preguntas abiertas.",
    )
    fact_check_targets: List[FactCheckTarget] = Field(
        default_factory=list,
        description="Declaraciones que requieren verificación con plan detallado.",
    )
    risks: List[str] = Field(
        default_factory=list,
        description="Riesgos, implicaciones o impactos potenciales.",
    )
    critical_questions: List[str] = Field(
        default_factory=list,
        description="Preguntas críticas para reflexionar sobre el contenido.",
    )
    counterpoints: List[str] = Field(
        default_factory=list,
        description="Argumentos o datos que podrían cuestionar la narrativa principal.",
    )

    @validator("summary")
    def _summary_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("summary no puede estar vacío.")
        return value

    @validator("claims")
    def _claims_minimum(cls, value: List[Claim]) -> List[Claim]:
        if len(value) < 4:
            raise ValueError("Se requieren al menos 4 claims.")
        return value

    @validator("timeline")
    def _timeline_range(cls, value: List[TimelineEvent]) -> List[TimelineEvent]:
        if not value:
            raise ValueError("Incluye una línea de tiempo con 3 a 5 eventos.")
        if not (3 <= len(value) <= 5):
            raise ValueError("La línea de tiempo debe contener entre 3 y 5 eventos.")
        return value

    @validator("fact_check_targets")
    def _fact_check_range(cls, value: List[FactCheckTarget]) -> List[FactCheckTarget]:
        if len(value) < 2:
            raise ValueError("Incluye al menos 2 afirmaciones prioritarias para verificación.")
        return value

    @validator("tone_bias_indicators")
    def _tone_bias_indicators_len(cls, value: List[str]) -> List[str]:
        normalized = [item.strip().lower() for item in value]
        if not value:
            raise ValueError(
                "Proporciona indicadores del tono/sesgo o la frase 'no concluyente'."
            )
        if len(value) == 1 and "no concluyente" in normalized[0]:
            return value
        if not (2 <= len(value) <= 3):
            raise ValueError("Incluye entre 2 y 3 indicadores concretos o marca 'no concluyente'.")
        return value

    @validator("counterpoints")
    def _counterpoints_non_empty(cls, value: List[str]) -> List[str]:
        if not value:
            raise ValueError("Incluye al menos un contrapunto.")
        return value


class ModelAnalysisOutput(BaseModel):
    metadata: dict = Field(default_factory=dict, description="Metadatos adicionales generados por la IA.")
    analysis: ArticleAnalysis

    class Config:
        extra = "allow"


class ReportBundle(BaseModel):
    """Agrupa los resultados validados y los formatos de salida."""

    analysis: ArticleAnalysis
    markdown_report: str
    raw_json: dict
