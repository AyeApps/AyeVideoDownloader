# B7 — Tests del backend (unitarios + integración real opcional)

Bloque B7 · rama main · espera la auditoría de B5 y B6 (usa _extract_and_download_sync de B5 y requirements-dev.txt de B6) · Contexto: hoy no hay ningún test (pyproject apunta a app/tests, que no existe). Los dos bugs del 2026-11-09 (js_runtimes como lista y el 403 de audio) se habrían visto con estos tests.

### PROMPT PARA GEMINI — copiar desde aquí

Objetivo: crear una batería de tests del backend que corra sin Mongo ni red por defecto, y una prueba de integración real con YouTube que solo corra cuando se pida.

Alcance cerrado. Solo puedes crear o modificar estos archivos:
1. api/app/tests/__init__.py (nuevo, vacío)
2. api/app/tests/conftest.py (nuevo)
3. api/app/tests/test_ytdlp_utils.py (nuevo)
4. api/app/tests/test_ytdlp_engine.py (nuevo)
5. api/app/tests/test_temp_cleanup.py (nuevo)
6. api/app/tests/test_download_ticket.py (nuevo)
7. api/app/tests/test_integration_youtube.py (nuevo)
8. api/pyproject.toml (solo la sección tool.pytest.ini_options)

Contexto verificado en el código:
- api/pyproject.toml ya tiene tool.pytest.ini_options con addopts "-ra -q --asyncio-mode=auto" y testpaths app/tests. Los tests se corren desde api/ con venv/bin/pytest; venv/bin/pip install -r requirements-dev.txt instala pytest, pytest-asyncio y httpx.
- settings (app.core.config) se importa sin variables de entorno obligatorias en local y admite asignar atributos, así que se puede usar monkeypatch.setattr sobre settings.TEMP_DIR, settings.YTDLP_JS_RUNTIMES, settings.MAX_FILE_SIZE_MB, settings.INFO_CACHE_MAX_ITEMS y settings.INFO_CACHE_TTL_SECONDS.
- app.services.ytdlp_utils.build_ytdlp_options(ignore_cookies, ytdlp_logger) devuelve el diccionario de opciones; js_runtimes debe ser un diccionario de nombre de runtime en minúsculas a un diccionario con la clave path (None si no se dio ruta, o la ruta del formato "deno:/ruta"). Con ignore_cookies en verdadero no debe aparecer cookiefile. max_filesize es MAX_FILE_SIZE_MB por 1024 por 1024 cuando es mayor que cero.
- app.services.download_service.remove_job_temp_dir_sync(nombre) borra solo subcarpetas dentro de settings.TEMP_DIR y devuelve verdadero o falso; bloquea la propia TEMP_DIR, rutas con .. que salen de ella y el nombre vacío.
- app.services.ytdlp_engine tiene register_job, unregister_job, cancel_job, is_job_cancelled, get_job_state, get_queue_position, count_active_jobs, count_active_jobs_for_user, update_job_status, get_cached_info, set_cached_info e invalidate_cached_info, con estado global en _active_jobs, _arrival_counter e _info_cache.
- app.core.security tiene create_download_ticket(job_id, user_id, scope) y verify_download_ticket(ticket, job_id, scope), que devuelve el user_id o None.
- Tras B5, app.services.download_service._extract_and_download_sync(id del job, carpeta, url, formato, format_string, ignore_cookies) devuelve (éxito, error). Lee la firma real en el archivo antes de usarla y, si no coincide con esto, detente y pregunta.

Ya existe y no debe cambiar: todo el código de api/app fuera de app/tests, requirements y Dockerfile.

Requisitos:
1. conftest.py: un fixture automático que limpie el estado global de ytdlp_engine antes y después de cada test (vaciar _active_jobs e _info_cache y poner _arrival_counter a cero) y otro fixture que apunte settings.TEMP_DIR a tmp_path con monkeypatch.
2. test_ytdlp_utils.py: js_runtimes con "node,deno" y con "Deno:/usr/local/bin/deno" (nombre en minúsculas y ruta); que yt_dlp.YoutubeDL acepte las opciones de build_ytdlp_options(ignore_cookies en verdadero) sin lanzar excepción al construirse dentro de un with (sin red); ausencia de cookiefile con ignore_cookies; max_filesize presente y ausente según MAX_FILE_SIZE_MB; clean_ytdlp_error quita el prefijo ERROR y la etiqueta del extractor.
3. test_ytdlp_engine.py: posición en cola (tres jobs registrados, el tercero tiene dos por delante; cancelar uno lo descuenta; un job que no está en queued devuelve None); cancel_job marca cancelado y luego update_job_status no lo revierte; conteos por usuario; caché con expulsión del más antiguo al superar INFO_CACHE_MAX_ITEMS, expiración por TTL (monkeypatch de time.time del módulo o TTL negativo) y que get_cached_info devuelva una copia que al modificarse no altera la caché.
4. test_temp_cleanup.py: remove_job_temp_dir_sync borra una subcarpeta válida; devuelve falso y no borra nada con "..", con una ruta que sale a una carpeta hermana de TEMP_DIR, con "." y con el nombre vacío; devuelve falso si la carpeta no existe.
5. test_download_ticket.py: un ticket válido devuelve el user_id; falla con otro job_id, con otro scope, con un ticket alterado y con un JWT normal firmado con settings.JWT_SECRET_KEY sin el sufijo del ticket.
6. test_integration_youtube.py: registra un marcador network en pyproject y marca este archivo con él. Los tests se saltan salvo que la variable de entorno RUN_NETWORK_TESTS valga 1. Con TEMP_DIR en tmp_path y un job registrado, llama a _extract_and_download_sync con ignore_cookies en verdadero para https://www.youtube.com/watch?v=jNQXAC9IVRw en audioMP3 (debe quedar un .mp3) y en videoMP4 con format_string bestvideo[height<=360]+bestaudio/best (debe quedar un .mp4); los dos deben devolver éxito y dejar el título en get_job_state.
7. pyproject.toml: añade solo la declaración del marcador network en tool.pytest.ini_options. No cambies nada más.
8. Ningún test puede necesitar Mongo ni red salvo los marcados network.

Verificación:
- cd api, venv/bin/pip install -r requirements-dev.txt, venv/bin/pytest: todo en verde y los de red saltados.
- RUN_NETWORK_TESTS=1 venv/bin/pytest -m network: los dos en verde. Pega el resumen de ambas corridas en tu respuesta.
- venv/bin/ruff check app/tests sin errores de las familias F ni B.

Criterios de aceptación:
- La suite corre en segundos sin red ni Mongo y cubre lo listado.
- Con RUN_NETWORK_TESTS=1 se prueban descargas reales de audio y video.
- Si vuelves temporalmente js_runtimes a lista en build_ytdlp_options, test_ytdlp_utils falla (compruébalo y deshaz el cambio; no lo dejes en el diff).

Si algo no cuadra con este alcance (un test que falla por un bug real del código, el linter, un tipo, una firma distinta), detente y pregúntame en lugar de cambiar código fuera de app/tests y pyproject. No dejes scripts auxiliares: borra cualquier archivo temporal que crees. No reviertas cambios que veas en archivos fuera de tu alcance: puede haber otro agente trabajando. Sigue docs/agy/_reglas-agentes.md.

### FIN DEL PROMPT PARA GEMINI
