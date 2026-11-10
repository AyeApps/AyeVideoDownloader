# aye-video-downloader — CLAUDE.md

## Rol de Claude
Gemini (vía Google Antigravity, "agy") escribe el código de la app. Claude planea con los grafos (codebase-memory + graphify, nombre graphify `aye-video-downloader`), escribe los specs y audita lo que agy entrega. Claude solo escribe código directamente para esqueletos/contratos que eliminen un hueco de cableado, o para arreglos triviales en la auditoría (y lo dice).

La entrega de specs y prompts sigue la sección **"How specs and prompts are delivered"** de `~/.claude/rules/gemini-workflow.md` (fuente de verdad). Resumen:
- Un bloque = un spec en `docs/agy/AAAA-MM-DD/<id>-<nombre-corto>.md`, con el prompt para agy entre `### PROMPT PARA GEMINI — copiar desde aquí` y `### FIN DEL PROMPT PARA GEMINI` (solo palabras, sin bloques de código).
- Reglas compartidas para agentes: `docs/agy/_<nombre>.md`. La base es `docs/agy/_reglas-agentes.md`.
- En el chat solo va el mini prompt por bloque, por ejemplo:
  `Lee y ejecuta docs/agy/AAAA-MM-DD/B4-<nombre>.md, la sección entre "### PROMPT PARA GEMINI — copiar desde aquí" y "### FIN DEL PROMPT PARA GEMINI". Sigue docs/agy/_reglas-agentes.md, PRODUCT.md y README.md. Si algo no cuadra con el código, detente y pregunta. Borra cualquier script temporal que crees.`
- Pasos solo del usuario (reiniciar el VPS, probar en Safari iOS, variables en Railway) van fuera del bloque de agy.

## Letras de bloque
| Letra | Alcance | Sigue |
|---|---|---|
| B | Backend FastAPI (`api/`: endpoints, servicios, modelos, Docker/Railway) | **B9** (B1–B2, B4 hechos; B5–B8 en curso; B3 reservado: quitar `?token=` en `/file` y `/stream`) |
| W | Frontend web React 19 + Vite (`frontend/`) | **W2** (W1 en curso) |

Los ids A1–A2 y C1–C4 (2026-10/11, entregados en el chat antes de esta convención) son históricos: no se reutilizan. Un cambio que toca los dos lados se parte en un B y un W con el contrato acordado en el spec del B.

## Anatomía
- `api/main.py` → `api/app/api/v1/router.py` → `endpoints/{downloads,formats}.py` → `services/{download_service,format_service,ytdlp_engine,ytdlp_utils}.py`; modelos Beanie en `app/models/`, schemas en `app/schemas/`, config/auth en `app/core/`.
- `frontend/src/App.jsx` concentra el flujo (llamadas a `${API_BASE_URL}/api/v1/...`); componentes en `frontend/src/components/`.
- Auth la da otro repo (aye-auth); para el grafo cruzado usar `link-services.sh`.

## No tocar sin pedirlo
- `__pycache__/*.pyc` y `.codebase-memory/*` aparecen modificados pero no son cambios de la app: no se incluyen en commits de bloques.
- VPS: el compose es `~/aye/docker-compose.prod.yml` (requiere `-f`); comparte máquina con otras apps.

## Verificación (auditoría al "listo")
- Backend: `api/venv/bin/ruff check api` y `cd api && venv/bin/pytest` (35 tests sin Mongo ni red; dependencias en `requirements-dev.txt`). Antes de un deploy, también `RUN_NETWORK_TESTS=1 venv/bin/pytest -m network` (descargas reales de YouTube en audio y video).
- Frontend: `cd frontend && npm run lint && npm run build`.
- Grafos: `~/.claude/tools/graphify-bridge/refresh.sh <repo> aye-video-downloader`, revisar los huecos del puente y `graphify affected` sobre lo tocado.
- Un commit por bloque tras la auditoría; actualizar la memoria del proyecto con estado y siguiente paso.
