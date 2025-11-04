# Analista de artículos con LangChain + LlamaFarm

Herramienta en Python que automatiza el análisis periodístico de un artículo, ya sea desde una URL o texto plano. Utiliza LangChain como framework orquestador (según la documentación oficial consultada vía Context7) y consume un modelo gratuito alojado en LlamaFarm mediante su API OpenAI-like.

## Capacidades

- **Extracción de contenido**: descarga HTML, limpia y mantiene solo el texto útil con *trafilatura* y *BeautifulSoup*.
- **Metadatos**: detecta idioma probable y título candidato.
- **Análisis estructurado**: genera resumen con contexto (quién/qué/cuándo/dónde), línea de tiempo, claims con citas evaluadas, tono y sesgos con indicadores, incertidumbres, fact-check detallado, contrapuntos, riesgos e interrogantes críticas.
- **Validación**: valida la estructura con Pydantic para asegurar JSON consistente.
- **Presentación**: persiste un `.json` estructurado y un informe `.md` listo para compartir.

## Requisitos

- Python 3.11 o superior.
- Dependencias definidas en `pyproject.toml`.
- Variable de entorno `LLAMAFARM_API_KEY` con la clave del servicio.

## Instalación rápida

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
```

Configura tu clave en un `.env` o directamente en la sesión:

```bash
export LLAMAFARM_API_KEY="tu_clave"
```

## Uso

Analizar un artículo desde una URL:

```bash
article-analyst --url "https://ejemplo.com/reportaje"
```

Analizar texto pegado:

```bash
article-analyst --text "$(cat articulo.txt)"
```

Opciones útiles:

- `--show-json` imprime el JSON en consola.
- `--no-save` evita crear archivos en `outputs/`.
- `--max-tokens` ajusta el máximo de tokens pedidos al modelo (por defecto 2000).
- `--model` cambia el modelo gratuito dentro de LlamaFarm (por defecto usa `hf:meta-llama/Meta-Llama-3.1-8B-Instruct`).

Los resultados se almacenan en `outputs/<timestamp>_<slug>.json` y `.md`.

## Arquitectura

1. **Extracción** (`ContentExtractor`): descarga o limpia el contenido original.
2. **Preparación** (`build_analysis_prompt`): crea un prompt con esquema JSON derivado de `ModelAnalysisOutput`.
3. **IA** (`LlamaFarmChatModel`): invoca el modelo remoto mediante LangChain.
4. **Validación** (`ModelAnalysisOutput`): asegura formato y campos obligatorios.
5. **Presentación** (`build_markdown_report`): genera Markdown y guarda ambos formatos.

## Interfaz web

Incluye una interfaz web ligera en FastAPI para lanzar análisis desde el navegador.

```bash
uvicorn article_analyst.web_app:app --reload
```

Visita `http://127.0.0.1:8000`, pega una URL o texto completo y obtén el informe enriquecido (resumen 5W, línea de tiempo, claims con cita y soporte, indicadores de sesgo, fact-check y contrapuntos) junto al JSON estructurado. Desde la página puedes decidir si guardar o no los archivos en `outputs/`.

## Desarrollo

- Ejecuta `python -m article_analyst` para usar la CLI sin instalar el script.
- Ajusta el prompt o el esquema modificando `article_analyst/prompting.py` y `article_analyst/schemas.py`.

## Limitaciones actuales

- La precisión de detección de idioma depende de `langdetect`.
- El scraper no maneja sitios fuertemente dinámicos (JavaScript pesado).
- El servicio de LlamaFarm debe ofrecer un modelo gratuito compatible con el endpoint OpenAI-like.

## Resolución de problemas

- **Errores SSL al invocar LlamaFarm**: si ves un mensaje indicando problemas de certificados, asegúrate de que tu sistema tenga las CA actualizadas. Puedes apuntar a un bundle específico exportando `LLAMAFARM_CA_BUNDLE=/ruta/a/cacert.pem`. Como último recurso (no recomendado en producción) desactiva la verificación de certificados con `LLAMAFARM_VERIFY_SSL=0`.
- **Usas otro proveedor API-compatible (p. ej. Groq/Qroq)**: define `LLAMAFARM_BASE_URL` con el endpoint adecuado (por ejemplo `https://api.groq.com/openai/v1/chat/completions`), establece `LLAMAFARM_DEFAULT_MODEL` con un modelo válido para ese proveedor (por ejemplo `llama3-8b-8192`) y, si la API lo requiere, `LLAMAFARM_API_VERSION` con la versión publicada en su documentación.
- **El modelo responde fuera de JSON**: activa `LLAMAFARM_FORCE_JSON=1` (o usa `--force-json`) para enviar `response_format={"type": "json_object"}` cuando el proveedor sea compatible con OpenAI Responses.

## Próximos pasos sugeridos

1. Añadir pruebas unitarias para el sanitizado y la renderización Markdown.
2. Validar de forma automática la respuesta del modelo antes de persistir (p. ej. reintentos inteligentes).
3. Implementar un modo batch para carpetas completas de artículos.
