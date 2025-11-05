# Analista de artículos con LangChain + LlamaFarm + Next.js

Suite que automatiza el análisis periodístico de artículos y presenta los resultados en CLI, API y una interfaz web moderna. El backend en Python usa LangChain para orquestar modelos compatibles con la API OpenAI-like de LlamaFarm (o Groq), mientras que el frontend en Next.js muestra informes, métricas e historial basados en los JSON generados.

## Capacidades

- **Extracción de contenido**: descarga HTML, limpia y mantiene solo el texto útil con *trafilatura* y *BeautifulSoup*.
- **Metadatos**: detecta idioma probable y título candidato.
- **Análisis estructurado**: genera resumen 5W + contexto, línea de tiempo (3–5 hitos), claims con cita literal y nivel de soporte, tono/sesgo con indicadores, incertidumbres, riesgos, fact-check accionable, contrapuntos y preguntas críticas incisivas.
- **Validación**: valida la estructura con Pydantic para asegurar JSON consistente.
- **Persistencia**: guarda automáticamente `.json` y `.md` en `outputs/` listos para reutilizar.
- **API REST**: expone `/api/analyze` y `/api/history` (nuevo) sobre FastAPI.
- **Dashboard Next.js**: landing enriquecida con métricas reales, preguntas críticas y fact-checks recientes, además de una página de historial que lista los informes producidos.

## Requisitos

- Python 3.11 o superior.
- Dependencias definidas en `pyproject.toml`.
- Variable de entorno `LLAMAFARM_API_KEY` con la clave del servicio.
- Node.js 22.x (se facilita `.nvmrc`) para la interfaz web en `web-frontend/`.

## Instalación rápida (CLI y API)

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

## Interfaz web (FastAPI + Next.js)

### API FastAPI

```bash
source .venv/bin/activate
uvicorn article_analyst.web_app:app --reload
```

Endpoints clave:

- `POST /api/analyze`: recibe `{input_type: "url"|"text", url?, article_text?, save_outputs?}` y devuelve el JSON validado, markdown y contadores.
- `GET /api/history`: expone (`total`, `stats`, `items[]`) leyendo los archivos de `outputs/`. Cada item incluye resumen, métricas, URLs del JSON/Markdown y planes de fact-check.
- `/outputs/...`: servidor estático que expone los archivos generados.

Variables útiles en `.env` (además de la API key):

```env
FRONTEND_ORIGIN=http://localhost:3000
NEXT_PUBLIC_ANALYZER_API=http://localhost:8000
ARTICLE_ANALYST_OUTPUT_DIR=/ruta/a/outputs  # opcional si deseas otra carpeta
```

### Interfaz Next.js (dashboard moderno)

```bash
cd web-frontend
npm install
npm run dev  # requiere Node 22.x (usa nvm use 22)
```

Características principales del dashboard:

- Landing con métricas reales (informes, claims, fact-checks) y últimas preguntas críticas / verificaciones.
- Widget “Último informe” con acceso al Markdown y fuente original.
- Página `/analizar` con formulario (URL o texto), historial en sesión y resultados enriquecidos (Markdown/JSON).
- Página `/historial` que lista informes reales, preguntas críticas y planes de verificación; enlaces directos a JSON/Markdown desde la API.

Para despliegue en producción (por ejemplo Vercel) ejecuta:

```bash
npm run build
npm start
```

Asegúrate de desplegar la API FastAPI accesible y de propagar las variables `NEXT_PUBLIC_ANALYZER_API` y `FRONTEND_ORIGIN`.

## Arquitectura

1. **Extracción** (`ContentExtractor`): descarga o limpia el contenido original.
2. **Preparación** (`build_analysis_prompt`): crea un prompt con esquema JSON derivado de `ModelAnalysisOutput`.
3. **IA** (`LlamaFarmChatModel`): invoca el modelo remoto mediante LangChain.
4. **Validación** (`ModelAnalysisOutput`): asegura formato y campos obligatorios.
5. **Presentación** (`build_markdown_report`): genera Markdown y guarda ambos formatos.
6. **API & UI**: FastAPI ofrece CLI y endpoints REST; Next.js consume `/api/analyze` y `/api/history` para renderizar resultados y el historial.

## Flujo de trabajo recomendado

1. Inicia el backend FastAPI (CLI + API) con el entorno virtual activado.
2. Inicia el dashboard Next.js (`npm run dev`) para tener la UI conectada.
3. Lanza análisis desde la CLI o desde `/analizar`.
4. Revisa métricas y preguntas críticas en la landing y accede a informes pasados desde `/historial`.

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

1. Añadir pruebas unitarias para sanitizado, renderizado y API `/api/history`.
2. Validar de forma automática la respuesta del modelo con reintentos antes de persistir.
3. Implementar búsqueda y filtros (fecha, medio, nivel de riesgo) en `/historial`.
4. Incorporar autenticación y control de cuotas en la interfaz Next.js.
