from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from markdown import markdown

from .cli import build_analyzer
from .pipeline import ArticleAnalyzer


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"


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


__all__ = ["app", "get_analyzer"]
