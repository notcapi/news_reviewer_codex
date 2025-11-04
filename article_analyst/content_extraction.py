from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

import requests
import trafilatura
from bs4 import BeautifulSoup
from langdetect import DetectorFactory, LangDetectException, detect_langs
from requests import Response


# Deterministic results for langdetect
DetectorFactory.seed = 42


@dataclass(slots=True)
class ExtractedContent:
    """Resultado de la extracción básica de un artículo."""

    source: str
    text: str
    candidate_title: Optional[str] = None
    language: Optional[str] = None


class ContentExtractor:
    """Se encarga de obtener y limpiar contenido desde URLs o texto plano."""

    def __init__(self, timeout_seconds: int = 30) -> None:
        self.timeout_seconds = timeout_seconds

    def from_url(self, url: str) -> ExtractedContent:
        response = self._download(url)
        response.raise_for_status()

        text = self._extract_main_text(response)
        if not text:
            raise ValueError("No se pudo extraer texto significativo del artículo.")

        candidate_title = self._detect_title(response.text)
        language = self._detect_language(text)

        return ExtractedContent(
            source=url,
            text=text,
            candidate_title=candidate_title,
            language=language,
        )

    def from_text(self, text: str, *, source: str = "provided-text") -> ExtractedContent:
        cleaned = self._cleanup_whitespace(text)
        if not cleaned:
            raise ValueError("El texto proporcionado está vacío tras la limpieza.")

        return ExtractedContent(
            source=source,
            text=cleaned,
            candidate_title=None,
            language=self._detect_language(cleaned),
        )

    def _download(self, url: str) -> Response:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
            )
        }
        try:
            return requests.get(url, headers=headers, timeout=self.timeout_seconds)
        except requests.exceptions.SSLError as exc:
            raise RuntimeError(
                "Error SSL al descargar el artículo. Verifica certificados o intenta con otra URL."
            ) from exc
        except requests.exceptions.RequestException as exc:
            raise RuntimeError(
                "Error al descargar el artículo. Verifica la URL o la conectividad de red."
            ) from exc

    def _extract_main_text(self, response: Response) -> str:
        extracted = trafilatura.extract(
            response.text,
            url=response.url,
            favor_recall=True,
            include_comments=False,
        )
        if extracted:
            return self._cleanup_whitespace(extracted)

        soup = BeautifulSoup(response.text, "html.parser")
        candidate = " ".join(p.get_text(separator=" ", strip=True) for p in soup.find_all("p"))
        return self._cleanup_whitespace(candidate)

    def _cleanup_whitespace(self, text: str) -> str:
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def _detect_title(self, html: str) -> Optional[str]:
        soup = BeautifulSoup(html, "html.parser")

        if soup.title and soup.title.string:
            return soup.title.string.strip()

        main_heading = soup.find(["h1", "h2"])
        if main_heading and main_heading.get_text(strip=True):
            return main_heading.get_text(strip=True)

        meta_title = soup.find("meta", property="og:title")
        if meta_title and meta_title.get("content"):
            return meta_title["content"].strip()

        return None

    def _detect_language(self, text: str) -> Optional[str]:
        try:
            languages = detect_langs(text[:10_000])
        except LangDetectException:
            return None

        if not languages:
            return None

        # Retornar el idioma con mayor probabilidad si supera un umbral
        top = max(languages, key=lambda item: item.prob)
        return top.lang if top.prob >= 0.6 else None
