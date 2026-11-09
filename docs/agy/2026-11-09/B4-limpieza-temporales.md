# B4 — Limpieza periódica de temporales y cancelación sin pisar "done"

Bloque B4 · rama main · corre solo (nada en paralelo) · Claude ya dejó commiteados A1–A2, B1–B2, C1, C2 y C4 (918f237, 53bf2ab) y auditó: C3 quedó a medias (nada borra los archivos terminados al vencer) y DELETE puede pisar un job que acaba de terminar.

Pasos solo del usuario, fuera del bloque: después de la auditoría y el deploy, en el VPS comprobar con du que la carpeta /tmp/ayevideo_downloads del contenedor deja de crecer.

### PROMPT PARA GEMINI — copiar desde aquí

Objetivo: que el backend borre de disco los archivos de descargas vencidas y las carpetas huérfanas, de forma periódica, y que cancelar una descarga no pise una que acaba de terminar.

Alcance cerrado. Solo puedes modificar estos tres archivos:
1. api/app/services/download_service.py
2. api/main.py
3. api/app/api/v1/endpoints/downloads.py

Contexto verificado en el código:
- Cada descarga usa la carpeta settings.TEMP_DIR más el id del job como subcarpeta (download_service.py, dentro de DownloadService.start_download, la variable temp_dir). El archivo final queda dentro de esa subcarpeta y su ruta se guarda en el campo file_path del job.
- Al terminar bien, start_download guarda status DONE y expires_at igual a ahora más settings.DOWNLOAD_TTL_MINUTES. En el bloque finally de start_download (alrededor de las líneas 536 a 542) solo se borra la subcarpeta si el estado final no es DONE, y después se llama a unregister_job. Nada borra los archivos DONE vencidos.
- settings.CLEANUP_INTERVAL_SECONDS (300) existe en api/app/core/config.py y hoy no se usa en ningún sitio.
- JobStatus en api/app/models/download_job.py ya tiene EXPIRED. El modelo DownloadJob tiene índice sobre expires_at y sobre status.
- get_job_state de api/app/services/ytdlp_engine.py devuelve el estado en memoria de un job activo de este proceso, o None si no está activo.
- El endpoint download_file de downloads.py ya marca el job como EXPIRED si el archivo no existe en disco; no lo cambies.
- El lifespan de api/main.py (líneas 23 a 37) inicializa la base, barre jobs huérfanos con fail_if_stale y hace yield.
- delete_download en downloads.py (líneas 416 a 429) llama a cancel_job, pone status CANCELLED y guarda el documento entero con job.save(). Ese save completo es el problema: si el job terminó entre la lectura y el guardado, pisa DONE, el archivo queda en disco y nadie lo borra.
- En el resto de download_service.py las escrituras ya usan actualizaciones condicionales con DownloadJob.find_one(...).update con operador $set y filtro por status; sigue ese mismo estilo.

Ya existe y no debe cambiar: la lógica de descarga de start_download, los semáforos y el registro de ytdlp_engine.py, fail_if_stale, el sistema de tickets, los esquemas de respuesta, la configuración y el frontend.

Requisitos:
1. En download_service.py crea una función asíncrona pública de limpieza que haga dos pasadas y devuelva cuántas carpetas borró:
   a. Vencidos: busca los jobs con status DONE y expires_at anterior a ahora (UTC). Para cada uno borra su subcarpeta dentro de settings.TEMP_DIR y después actualiza el job de forma condicional (solo si sigue en DONE) a status EXPIRED, con updated_at igual a ahora.
   b. Huérfanos: recorre las subcarpetas directas de settings.TEMP_DIR. Sáltate las que correspondan a un job activo en memoria (get_job_state no es None). Para el resto, busca el job por el nombre de la carpeta. Si el nombre no es un id válido, si el job no existe o si su estado no es DONE con expires_at en el futuro, borra la carpeta.
2. Seguridad de rutas: la ruta a borrar se construye siempre como settings.TEMP_DIR más el id del job o el nombre de la subcarpeta, nunca a partir del campo file_path. Antes de borrar, comprueba que la ruta resuelta está dentro de settings.TEMP_DIR resuelto y que no es la propia carpeta TEMP_DIR. Si TEMP_DIR no existe, la pasada de huérfanos no hace nada.
3. El borrado de disco es bloqueante: hazlo con asyncio.to_thread usando shutil.rmtree con ignore_errors. Un fallo con un job o una carpeta se registra con logger y no detiene la limpieza del resto.
4. En el mismo archivo crea una función asíncrona de bucle que llame a la limpieza en cuanto arranca y luego cada settings.CLEANUP_INTERVAL_SECONDS. Debe capturar y registrar cualquier excepción de una vuelta sin morir, y terminar limpio cuando la cancelen. Registra con logger.info cuántas carpetas borró cada vuelta solo si fue más de cero.
5. En el lifespan de api/main.py, después del barrido con fail_if_stale y antes del yield, arranca ese bucle como tarea con asyncio.create_task. Después del yield, cancela la tarea y espera a que termine (ignorando la cancelación) antes del log de cierre.
6. En delete_download de downloads.py deja de usar job.save():
   a. Llama a cancel_job como ahora.
   b. Haz una actualización condicional que ponga status CANCELLED y updated_at solo si el job sigue en un estado activo (PENDING, FETCHING, QUEUED, RUNNING o MERGING).
   c. Si el job ya estaba en DONE (o la actualización no aplicó porque pasó a DONE mientras tanto; vuelve a leerlo para saberlo), borra su subcarpeta con las mismas reglas de seguridad del requisito 2 y ponlo en CANCELLED con file_path vacío, de forma condicional sobre DONE. Así el usuario que borra un elemento terminado libera el disco y el historial lo sigue viendo como antes.
   d. En cualquier otro estado (FAILED, CANCELLED, EXPIRED) no cambies nada en la base. La respuesta sigue siendo 204 en todos los casos válidos y 404 cuando no hay acceso, como hoy.
   e. Para el borrado de la carpeta reutiliza un helper de download_service.py (puedes exponer uno pequeño para borrar la subcarpeta de un job de forma segura) en lugar de duplicar la lógica en el endpoint.
7. No añadas configuración nueva ni dependencias nuevas.

Verificación:
- api/venv/bin/python -m compileall -q api/app api/main.py sin errores.
- api/venv/bin/ruff check en los tres archivos: no puede aparecer ningún error nuevo de las familias F (nombres no definidos, imports sin usar) ni B; los avisos de estilo que ya existían no hace falta tocarlos.
- Repasa a mano que ninguna ruta de borrado pueda salir de TEMP_DIR.

Criterios de aceptación:
- Un job DONE con expires_at pasado pierde su carpeta en la siguiente vuelta y queda en EXPIRED.
- Una carpeta dentro de TEMP_DIR sin job, o de un job FAILED o CANCELLED, desaparece en la siguiente vuelta; la de un job activo en memoria o DONE vigente no se toca.
- Cancelar un job en curso lo deja en CANCELLED y no se revierte; cancelar un job que ya terminó borra su archivo; nada pisa un DONE con un save completo.
- La API arranca y se apaga sin trazas de la tarea de limpieza.

Si algo no cuadra con este alcance (un test, el linter, un tipo, una función que no existe como se describe aquí), detente y pregúntame en lugar de cambiar código fuera de estos tres archivos. No dejes scripts auxiliares: borra cualquier archivo temporal que crees. No reviertas cambios que veas en archivos fuera de tu alcance: puede haber otro agente trabajando. Sigue docs/agy/_reglas-agentes.md.

### FIN DEL PROMPT PARA GEMINI
