from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from markdown import markdown
from pydantic import BaseModel, HttpUrl

from .cli import build_analyzer
from .pipeline import ArticleAnalyzer


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
OUTPUT_DIR = Path(
    os.environ.get("ARTICLE_ANALYST_OUTPUT_DIR", str(Path.cwd() / "outputs"))
).resolve()
HISTORY_CACHE_TTL = int(os.environ.get("ARTICLE_ANALYST_HISTORY_TTL", "60"))
_HISTORY_CACHE: Dict[Tuple[int, int, bool], Tuple[float, Tuple[int, Dict[str, Any], List[Dict[str, Any]]]]] = {}


@lru_cache()
def get_analyzer() -> ArticleAnalyzer:
    model = os.environ.get("LLAMAFARM_DEFAULT_MODEL", "hf:meta-llama/Meta-Llama-3.1-8B-Instruct")
    temperature = float(os.environ.get("LLAMAFARM_TEMPERATURE", "0.1"))
    max_tokens_env = os.environ.get("LLAMAFARM_MAX_TOKENS", "").strip()
    max_tokens: Optional[int] = int(max_tokens_env) if max_tokens_env else None
    api_version = os.environ.get("LLAMAFARM_API_VERSION")
    force_json_env = os.environ.get("LLAMAFARM_FORCE_JSON", "").strip().lower()
    force_json = force_json_env in {"1", "true", "yes"}

    return build_analyzer(
        model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_version=api_version,
        force_json=force_json,
    )


def _prepare_result(bundle: Any) -> Dict[str, Any]:
    json_output = json.dumps(bundle.raw_json, ensure_ascii=False, indent=2)
    html_report = markdown(bundle.markdown_report, extensions=["extra"])
    return {
        "json_output": json_output,
        "html_report": html_report,
        "summary_counts": {
            "claims": len(bundle.analysis.claims),
            "questions": len(bundle.analysis.critical_questions),
            "fact_checks": len(bundle.analysis.fact_check_targets),
        },
    }


app = FastAPI(title="Article Analyst Web")

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if OUTPUT_DIR.exists():
    app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="analysis-outputs")

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    context = {
        "request": request,
        "result": None,
        "error": None,
        "defaults": _form_defaults(),
        "form_state": _form_state(),
    }
    return templates.TemplateResponse("index.html", context)


class AnalyzePayload(BaseModel):
    input_type: Literal["url", "text"] = "url"
    url: Optional[HttpUrl] = None
    article_text: Optional[str] = None
    save_outputs: bool = False

    def ensure_valid(self) -> None:
        if self.input_type == "url":
            if not self.url:
                raise HTTPException(status_code=400, detail="Debes proporcionar una URL válida para analizar.")
        else:
            if not self.article_text or not self.article_text.strip():
                raise HTTPException(status_code=400, detail="Debes proporcionar un texto para analizar.")


def _form_defaults() -> Dict[str, Any]:
    return {
        "model": os.environ.get("LLAMAFARM_DEFAULT_MODEL", "hf:meta-llama/Meta-Llama-3.1-8B-Instruct"),
        "temperature": os.environ.get("LLAMAFARM_TEMPERATURE", "0.1"),
        "max_tokens": os.environ.get("LLAMAFARM_MAX_TOKENS", "2000"),
    }


def _form_state(input_type: str = "url", url: str = "", article_text: str = "", save: bool = False) -> Dict[str, Any]:
    return {
        "input_type": input_type,
        "url": url,
        "article_text": article_text,
        "save": save,
    }


@app.post("/analyze", response_class=HTMLResponse)
async def analyze(
    request: Request,
    input_type: str = Form("url"),
    url: str = Form(""),
    article_text: str = Form(""),
    save_outputs: Optional[str] = Form(None),
) -> HTMLResponse:
    analyzer = get_analyzer()
    save_flag = bool(save_outputs)

    try:
        if input_type == "url" and url.strip():
            bundle = analyzer.analyze_url(url.strip(), save=save_flag)
            source_label = url.strip()
        elif input_type == "text" and article_text.strip():
            bundle = analyzer.analyze_text(article_text.strip(), save=save_flag)
            source_label = "Texto proporcionado"
        else:
            raise ValueError("Debes proporcionar una URL válida o un texto para analizar.")

        result_context = _prepare_result(bundle)
        context = {
            "request": request,
            "result": {
                **result_context,
                "source": source_label,
            },
            "error": None,
            "defaults": _form_defaults(),
            "form_state": _form_state(input_type, url, article_text, save_flag),
        }
    except Exception as exc:  # noqa: BLE001 - mostramos el error al usuario
        context = {
            "request": request,
            "result": None,
            "error": str(exc),
            "defaults": _form_defaults(),
            "form_state": _form_state(input_type, url, article_text, save_flag),
        }

    return templates.TemplateResponse("index.html", context)


@app.post("/api/analyze")
async def analyze_api(payload: AnalyzePayload) -> Dict[str, Any]:
    analyzer = get_analyzer()
    payload.ensure_valid()

    try:
        if payload.input_type == "url":
            assert payload.url  # for type checker
            bundle = analyzer.analyze_url(str(payload.url), save=payload.save_outputs)
            source_label = str(payload.url)
        else:
            assert payload.article_text  # for type checker
            bundle = analyzer.analyze_text(payload.article_text, save=payload.save_outputs)
            source_label = "Texto proporcionado"
    except Exception as exc:  # noqa: BLE001 - devolvemos error específico al cliente
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "source": source_label,
        "analysis": bundle.analysis.model_dump(mode="json"),
        "markdown_report": bundle.markdown_report,
        "raw_json": bundle.raw_json,
        "summary_counts": {
            "claims": len(bundle.analysis.claims),
            "questions": len(bundle.analysis.critical_questions),
            "fact_checks": len(bundle.analysis.fact_check_targets),
        },
    }


@app.get("/api/history")
async def history_api(
    limit: int = Query(10, ge=1, le=200),
    offset: int = Query(0, ge=0),
    include_details: bool = Query(False),
) -> Dict[str, Any]:
    total, stats, entries = _collect_history(limit=limit, offset=offset, include_details=include_details)
    return {
        "total": total,
        "stats": stats,
        "items": entries,
    }


__all__ = ["app", "get_analyzer"]


def _collect_history(
    *,
    limit: int,
    offset: int,
    include_details: bool,
) -> Tuple[int, Dict[str, Any], List[Dict[str, Any]]]:
    cache_key = (limit, offset, include_details)
    now = time.time()
    cached = _HISTORY_CACHE.get(cache_key)
    if cached and (now - cached[0]) < HISTORY_CACHE_TTL:
        return cached[1]

    if not OUTPUT_DIR.exists():
        result = 0, {
            "total_reports": 0,
            "total_claims": 0,
            "total_fact_checks": 0,
            "total_questions": 0,
            "latest_generated_at": None,
        }, []
        _HISTORY_CACHE[cache_key] = (now, result)
        return result

    json_files = sorted(OUTPUT_DIR.glob("*.json"))
    total = len(json_files)
    if total == 0:
        result = total, {
            "total_reports": 0,
            "total_claims": 0,
            "total_fact_checks": 0,
            "total_questions": 0,
            "latest_generated_at": None,
        }, []
        _HISTORY_CACHE[cache_key] = (now, result)
        return result

    entries: List[Dict[str, Any]] = []
    aggregated = {
        "total_reports": total,
        "total_claims": 0,
        "total_fact_checks": 0,
        "total_questions": 0,
        "latest_generated_at": None,
    }

    ordered = list(reversed(json_files))

    for idx, json_path in enumerate(ordered):
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue

        analysis = data.get("analysis", {})
        summary = analysis.get("summary", "")
        claims = analysis.get("claims", []) or []
        questions = analysis.get("critical_questions", []) or []
        fact_checks = analysis.get("fact_check_targets", []) or []
        timeline = analysis.get("timeline", []) or []

        aggregated["total_claims"] += len(claims)
        aggregated["total_fact_checks"] += len(fact_checks)
        aggregated["total_questions"] += len(questions)

        base_name = json_path.stem
        markdown_path = json_path.with_suffix(".md")

        source_url, detected_title, generated_text = _parse_markdown_metadata(markdown_path)
        generated_iso = _parse_generated_timestamp(base_name, generated_text)

        if aggregated["latest_generated_at"] is None and generated_iso is not None:
            aggregated["latest_generated_at"] = generated_iso

        source_domain = None
        if source_url:
            try:
                source_domain = urlparse(source_url).netloc or None
            except ValueError:
                source_domain = None

        if offset <= idx < offset + limit:
            entry = {
                "id": base_name,
                "summary": summary,
                "source_url": source_url,
                "source_domain": source_domain,
                "title": detected_title,
                "generated_at": generated_iso,
                "claims_count": len(claims),
                "fact_check_count": len(fact_checks),
                "question_count": len(questions),
                "timeline_count": len(timeline),
                "json_filename": json_path.name,
                "markdown_filename": markdown_path.name if markdown_path.exists() else None,
                "markdown_url": f"/outputs/{markdown_path.name}" if markdown_path.exists() else None,
                "json_url": f"/outputs/{json_path.name}",
            }

            if include_details:
                entry["critical_questions"] = questions
                entry["fact_check_targets"] = fact_checks
            else:
                entry["critical_questions"] = []
                entry["fact_check_targets"] = []

            entries.append(entry)

    result = total, aggregated, entries
    _HISTORY_CACHE[cache_key] = (now, result)
    return result


def _parse_markdown_metadata(md_path: Path) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    source_url: Optional[str] = None
    detected_title: Optional[str] = None
    generated_at: Optional[str] = None

    if not md_path.exists():
        return source_url, detected_title, generated_at

    try:
        with md_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                stripped = line.strip()
                if stripped.startswith("- Fuente:") and source_url is None:
                    source_url = stripped.split(":", 1)[1].strip() or None
                elif stripped.startswith("- Título detectado:") and detected_title is None:
                    detected_title = stripped.split(":", 1)[1].strip() or None
                elif stripped.startswith("- Fecha de generación:") and generated_at is None:
                    generated_at = stripped.split(":", 1)[1].strip() or None

                if source_url and detected_title and generated_at:
                    break
    except OSError:
        return None, None, None

    return source_url, detected_title, generated_at


def _parse_generated_timestamp(stem: str, generated_text: Optional[str]) -> Optional[str]:
    if generated_text:
        try:
            dt = datetime.strptime(generated_text, "%Y-%m-%d %H:%M UTC").replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except ValueError:
            pass

    try:
        ts_part = stem.split("_", 1)[0]
        dt = datetime.strptime(ts_part, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return None
