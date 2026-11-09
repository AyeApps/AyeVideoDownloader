# B5 — Extraer y descargar en la misma instancia de yt-dlp

Bloque B5 · rama main · en paralelo con B6 y W1 (alcances disjuntos) · B7 espera la auditoría de B5 y B6 · Claude ya arregló y commiteó js_runtimes (d578e0a) y reprodujo el fallo de este bloque en local.

Hallazgo de Claude (2026-11-09, reproducido con yt-dlp 2026.10.21): reutilizar el diccionario de info extraído en una instancia de YoutubeDL para descargar con otra instancia da HTTP 403 en el formato de audio de YouTube (251), con o sin sanitize_info y aunque se copie el cookiejar. Extraer y descargar en la misma instancia funciona. El modo audio (MP3) falla siempre hoy y el video depende del formato elegido.

### PROMPT PARA GEMINI — copiar desde aquí

Objetivo: que cada descarga extraiga la información y descargue dentro de una sola instancia de YoutubeDL, en lugar de reutilizar la info cacheada de otra instancia, porque YouTube responde 403 a los formatos descargados desde info de otra instancia.

Alcance cerrado. Solo puedes modificar este archivo:
1. api/app/services/download_service.py

Contexto verificado en el código:
- _download_from_info_sync (línea 275 aprox.) arma las opciones con build_ytdlp_options, los hooks con _make_download_hooks, el outtmpl, el formato (bestaudio/best con postprocesador FFmpegExtractAudio a mp3 para audio; format_string o bestvideo+bestaudio/best con merge_output_format mp4 para video) y llama a ydl.process_ie_result con una copia de info_dict. Devuelve una tupla (éxito, error) y deja pasar DownloadCancelled.
- DownloadService.start_download (línea 324 aprox.), dentro del semáforo de descarga (línea 399 aprox.), hace esto: lee get_cached_info(job.url); si hay caché, actualiza título y miniatura y descarga desde esa info; si falla, invalida la caché y extrae de nuevo con FormatService._extract_sync dentro de get_extraction_semaphore, guarda en caché y descarga desde la info nueva con otra instancia; si el error menciona cookies, reintenta sin cookies. Todo eso termina en la variable success y en err, que consume el bloque que empieza en "if success:" (línea 553 aprox.) y que no debe cambiar.
- update_job_metadata(job_id, title, thumbnail_url) de ytdlp_engine.py actualiza el estado en memoria; el bucle _progress_flush_loop de start_download ya escribe title y thumbnail_url en Mongo cuando cambian.
- El progress_hook recibe en cada llamada un diccionario con la clave info_dict, que trae title y thumbnail del video.
- FormatService.fetch_formats (format_service.py) usa la caché de info para la pantalla de formatos; eso se queda igual.

Ya existe y no debe cambiar: la caché y sus funciones en ytdlp_engine.py, fetch_formats, el bloque "if success:" y todo lo que hay después en start_download (resultado DONE/FAILED, mensajes, finally con limpieza y unregister_job), el bucle de flush, las comprobaciones de cancelación y de espacio en disco, cleanup_downloads, cleanup_loop y remove_job_temp_dir.

Requisitos:
1. Sustituye _download_from_info_sync por una función síncrona _extract_and_download_sync que reciba el id del job, la carpeta temporal, job.url, el formato del job, el format_string y el indicador ignore_cookies. Arma las mismas opciones, hooks, outtmpl, formato y postprocesadores que hoy, y dentro de un solo bloque with de YoutubeDL llama a extract_info con la URL y download en verdadero. Devuelve (éxito, error) igual que la función actual, con el mismo manejo de YTDLPLogger, clean de error y DownloadCancelled.
2. En el progress_hook de _make_download_hooks, la primera vez que llegue un info_dict con title o thumbnail, llama a update_job_metadata con esos valores (solo una vez por job; guarda un indicador en el cierre de la función). No escribas en Mongo desde el hook: el bucle de flush ya lo hace.
3. En start_download, dentro del semáforo de descarga y después de marcar RUNNING, reemplaza todo el bloque de caché, extracción con get_extraction_semaphore y descargas desde info por esto:
   a. Si get_cached_info(job.url) devuelve info, usa solo su title y thumbnail para update_job_metadata y para la actualización condicional en Mongo que ya existe hoy (status distinto de CANCELLED). No la uses para descargar.
   b. Llama a _extract_and_download_sync con asyncio.to_thread y ignore_cookies en falso.
   c. Si falla, no está cancelado y el error menciona cookies (las mismas cuatro palabras clave que hoy), reintenta una vez con ignore_cookies en verdadero.
   d. Deja el resultado en success y err para el bloque "if success:".
4. Quita de download_service.py los imports que queden sin uso (copy, set_cached_info, invalidate_cached_info, get_extraction_semaphore, FormatService si ya no se usa). No borres esas funciones de ytdlp_engine.py ni de format_service.py.
5. No cambies firmas públicas que usen otros archivos: DownloadService.start_download, fail_if_stale, remove_job_temp_dir, cleanup_downloads y cleanup_loop siguen igual.

Verificación:
- api/venv/bin/python -m compileall -q api/app api/main.py sin errores.
- api/venv/bin/ruff check api/app/services/download_service.py sin errores nuevos de las familias F ni B.
- Prueba real, borrando después el script que uses: con TEMP_DIR apuntando a una carpeta temporal, registra un job con register_job y llama a _extract_and_download_sync con ignore_cookies en verdadero para https://www.youtube.com/watch?v=jNQXAC9IVRw dos veces: formato audioMP3 (debe quedar un .mp3) y videoMP4 con format_string bestvideo[height<=360]+bestaudio/best (debe quedar un .mp4). Las dos deben devolver éxito y get_job_state debe tener el título "Me at the zoo". Pega el resultado en tu respuesta.

Criterios de aceptación:
- La descarga de audio MP3 y la de video funcionan en local con la prueba anterior.
- start_download ya no llama a process_ie_result ni descarga desde info cacheada; la caché solo aporta título y miniatura.
- Cancelar sigue funcionando: el hook sigue lanzando DownloadCancelled y start_download lo sigue tratando igual.

Si algo no cuadra con este alcance (un test, el linter, un tipo, una función que no existe como se describe aquí), detente y pregúntame en lugar de cambiar código fuera de este archivo. No dejes scripts auxiliares: borra cualquier archivo temporal que crees. No reviertas cambios que veas en archivos fuera de tu alcance: puede haber otro agente trabajando. Sigue docs/agy/_reglas-agentes.md.

### FIN DEL PROMPT PARA GEMINI
