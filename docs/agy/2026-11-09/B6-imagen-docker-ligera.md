# B6 — Imagen Docker más ligera y dependencias de desarrollo aparte

Bloque B6 · rama main · en paralelo con B5 y W1 (alcances disjuntos) · B7 espera la auditoría de B5 y B6 · Contexto: el deploy del 2026-11-09 tardó 17 min en el VPS de 1 núcleo (apt del builder 450 s, apt de producción 478 s, pip 117 s, exportar imagen 377 s).

Paso solo del usuario, fuera del bloque: ninguno; el deploy sale solo con el push al final de todos los bloques.

### PROMPT PARA GEMINI — copiar desde aquí

Objetivo: reducir el tiempo de build y el tamaño de la imagen del backend sin cambiar lo que hace en producción.

Alcance cerrado. Solo puedes modificar o crear estos archivos:
1. api/Dockerfile
2. api/requirements.txt
3. api/requirements-dev.txt (nuevo)

Contexto verificado en el código:
- api/Dockerfile tiene dos etapas. La etapa builder (python:3.13-slim) instala ffmpeg con apt y luego hace pip install de requirements.txt; ffmpeg no se usa en esa etapa, solo se copian después /usr/local/bin y site-packages a producción.
- La etapa production instala con apt ffmpeg, nodejs, curl y unzip sin --no-install-recommends, enlaza nodejs como node, instala deno con el script oficial (que necesita curl y unzip), crea appuser y la carpeta /tmp/ayevideo_downloads, copia el código, usa USER appuser, tiene HEALTHCHECK y CMD de uvicorn con un worker.
- api/requirements.txt incluye ruff, pytest, pytest-asyncio y httpx, que solo sirven para desarrollo y tests; ningún archivo de api/app ni api/main.py importa pytest, ruff ni httpx (compruébalo con una búsqueda antes de moverlos).
- api/.dockerignore ya excluye .env, __pycache__, .git y node_modules.

Ya existe y no debe cambiar: la imagen base python:3.13-slim, el ENV con PYTHONUNBUFFERED, PYTHONDONTWRITEBYTECODE y MALLOC_ARENA_MAX=2, la presencia de ffmpeg, node y deno en la imagen final, el usuario appuser, la carpeta /tmp/ayevideo_downloads con su dueño, el HEALTHCHECK, el puerto 8000 y el CMD con un worker. No toques api/railway.toml ni el compose del VPS.

Requisitos:
1. En la etapa builder quita la instalación de ffmpeg con apt (no hace falta para pip). Si algún paquete de requirements necesitara compilar, detente y pregunta antes de añadir paquetes de sistema.
2. En la etapa production usa apt-get install con --no-install-recommends para ffmpeg, nodejs, curl, unzip y ca-certificates (este último es necesario al quitar los recomendados para que curl y deno funcionen por HTTPS). Mantén el borrado de /var/lib/apt/lists en la misma instrucción.
3. Junta en una sola instrucción RUN la creación de appuser, la carpeta /tmp/ayevideo_downloads y su chown, para no crear capas de más.
4. Mueve ruff, pytest, pytest-asyncio y httpx de requirements.txt a requirements-dev.txt. La primera línea de requirements-dev.txt debe incluir requirements.txt con la sintaxis de pip para incluir otro archivo de requisitos, de modo que instalar el de desarrollo instale todo.
5. No cambies versiones ni quites ninguna otra dependencia.

Verificación (el linter no aplica a estos archivos):
- docker build -t ayevideo-b6 api desde la raíz del repo debe terminar bien. Si docker no está disponible en tu entorno, dilo y detente ahí; Claude lo compila en la auditoría.
- Con la imagen construida: docker run --rm ayevideo-b6 sh -c "ffmpeg -version y node --version y deno --version y python -c import yt_dlp_ejs" (cada comando por separado) debe funcionar, y docker run --rm ayevideo-b6 python -c "import pytest" debe fallar. Pega la salida resumida y el tamaño de la imagen (docker images ayevideo-b6) en tu respuesta. Borra la imagen al terminar.

Criterios de aceptación:
- La imagen final tiene ffmpeg, node, deno, yt_dlp_ejs y la app, y no tiene pytest, ruff ni httpx.
- El builder ya no instala ffmpeg.
- requirements-dev.txt instala todo lo de requirements.txt más las herramientas de desarrollo.

Si algo no cuadra con este alcance (un test, el linter, un tipo, una dependencia que sí se importa en la app), detente y pregúntame en lugar de cambiar código fuera de estos archivos. No dejes scripts auxiliares: borra cualquier archivo temporal que crees. No reviertas cambios que veas en archivos fuera de tu alcance: puede haber otro agente trabajando. Sigue docs/agy/_reglas-agentes.md.

### FIN DEL PROMPT PARA GEMINI
