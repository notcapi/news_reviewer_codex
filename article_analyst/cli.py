from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

from .content_extraction import ContentExtractor
from .llm import LlamaFarmChatModel
from .pipeline import AnalyzerDependencies, ArticleAnalyzer
from .prompting import build_analysis_prompt


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    default_model = os.environ.get("LLAMAFARM_DEFAULT_MODEL", "hf:meta-llama/Meta-Llama-3.1-8B-Instruct")
    default_api_version = os.environ.get("LLAMAFARM_API_VERSION")

    parser = argparse.ArgumentParser(
        description="Analiza artículos periodísticos con LangChain + LlamaFarm y genera reportes estructurados.",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--url", type=str, help="URL del artículo a analizar.")
    group.add_argument("--text", type=str, help="Texto completo del artículo.")
    group.add_argument(
        "--file",
        type=Path,
        help="Ruta a un archivo de texto con el contenido del artículo.",
    )

    parser.add_argument(
        "--model",
        type=str,
        default=default_model,
        help="Modelo por defecto disponible en el proveedor (configurable vía LLAMAFARM_DEFAULT_MODEL).",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.1,
        help="Temperatura del modelo (0.0 - 1.0).",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=2_000,
        help="Máximo de tokens a solicitar al modelo.",
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="No guardar archivos en disco, solo mostrar por consola.",
    )
    parser.add_argument(
        "--show-json",
        action="store_true",
        help="Imprimir el JSON resultante en stdout.",
    )
    parser.add_argument(
        "--api-version",
        type=str,
        default=default_api_version,
        help="Versión de API requerida por el proveedor (por defecto se toma de LLAMAFARM_API_VERSION).",
    )
    parser.add_argument(
        "--force-json",
        action="store_true",
        default=os.environ.get("LLAMAFARM_FORCE_JSON", "").strip().lower() in {"1", "true", "yes"},
        help="Solicita al proveedor que fuerce respuesta JSON (equivalente a LLAMAFARM_FORCE_JSON=1).",
    )

    return parser.parse_args(argv)


def build_analyzer(
    model: str,
    *,
    temperature: float,
    max_tokens: Optional[int],
    api_version: Optional[str] = None,
    force_json: Optional[bool] = None,
) -> ArticleAnalyzer:
    extractor = ContentExtractor()
    prompt = build_analysis_prompt()
    llm = LlamaFarmChatModel(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_version=api_version,
        force_json=force_json,
    )
    dependencies = AnalyzerDependencies(extractor=extractor, llm=llm, prompt=prompt)
    return ArticleAnalyzer(dependencies)


def main(argv: Optional[List[str]] = None) -> int:
    load_dotenv()
    args = parse_args(argv)

    try:
        analyzer = build_analyzer(
            args.model,
            temperature=args.temperature,
            max_tokens=args.max_tokens,
            api_version=args.api_version,
            force_json=args.force_json,
        )
    except ValueError as exc:
        sys.stderr.write(f"❌ Error al inicializar el analizador: {exc}\n")
        return 1

    try:
        if args.url:
            bundle = analyzer.analyze_url(args.url, save=not args.no_save)
        elif args.text:
            bundle = analyzer.analyze_text(args.text, save=not args.no_save)
        else:
            content = args.file.read_text(encoding="utf-8")
            bundle = analyzer.analyze_text(content, source=str(args.file), save=not args.no_save)
    except RuntimeError as exc:
        sys.stderr.write(f"❌ {exc}\n")
        return 2
    except Exception as exc:  # pragma: no cover - guardrail para fallos inesperados
        sys.stderr.write(f"❌ Error inesperado: {exc}\n")
        return 3

    if args.show_json:
        json_output = json.dumps(bundle.raw_json, ensure_ascii=False, indent=2)
        sys.stdout.write(f"{json_output}\n")

    sys.stdout.write("✅ Análisis completado.\n")
    sys.stdout.write(f"- Claims detectados: {len(bundle.analysis.claims)}\n")
    sys.stdout.write(f"- Tono y sesgos: {bundle.analysis.tone_and_bias[:120]}...\n")
    if args.no_save:
        sys.stdout.write("No se guardaron archivos. Usa --no-save false para persistir resultados.\n")
    else:
        sys.stdout.write(f"Archivos guardados en: {analyzer.output_dir.resolve()}\n")

    return 0


def app() -> int:
    """Compatibilidad con el punto de entrada instalado por pip."""
    return main()


if __name__ == "__main__":
    sys.exit(main())
