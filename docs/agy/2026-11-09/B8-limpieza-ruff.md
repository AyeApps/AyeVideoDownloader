# B8 — Dejar ruff en cero en el backend

Bloque B8 · rama main · va al final, cuando B5, B6, B7 y W1 estén auditados y commiteados (toca casi todos los archivos de api/) · Contexto: ruff marca unos 156 avisos; la mayoría son de estilo arreglables automáticamente (UP045, UP017, I001), más B008 por el uso normal de Depends en FastAPI y algunos manuales (BLE001, DTZ003, S110, ASYNC230, RUF012, RUF013, SIM102, SIM103, TRY401, UP035, UP046).

### PROMPT PARA GEMINI — copiar desde aquí

Objetivo: que api/venv/bin/ruff check api --exclude api/venv termine con cero errores, sin cambiar el comportamiento del backend.

Alcance cerrado. Solo puedes modificar archivos .py dentro de api/app y api/main.py, y la sección tool.ruff de api/pyproject.toml.

Contexto verificado en el código:
- api/pyproject.toml tiene tool.ruff con line-length 100 y target-version py313. La configuración de reglas activas viene de la configuración de ruff que ya aplica al proyecto; consulta cuál es con ruff check --show-settings antes de cambiar nada.
- La suite de tests de B7 está en api/app/tests y se corre con cd api y venv/bin/pytest.
- FastAPI usa Depends(...) como valor por defecto de los parámetros de los endpoints; eso es lo correcto en FastAPI y ruff lo marca como B008.

Ya existe y no debe cambiar: el comportamiento de cualquier endpoint, servicio o modelo; los mensajes al usuario; los nombres públicos.

Requisitos:
1. Primero aplica las correcciones automáticas seguras con ruff check --fix (sin --unsafe-fixes) y revisa el diff que produce.
2. Para B008 no reescribas los endpoints: en tool.ruff de pyproject, configura que fastapi.Depends, fastapi.Query, fastapi.Body y fastapi.Header se consideren llamadas inmutables para flake8-bugbear (la opción extend-immutable-calls de la sección lint.flake8-bugbear).
3. Corrige a mano el resto, eligiendo siempre la opción que no cambia el comportamiento:
   a. datetime.utcnow pasa a datetime.now con timezone.utc solo si el valor se compara o se guarda con fechas que ya son conscientes de zona; si no es seguro, detente y pregunta.
   b. except Exception con pass o sin registrar: añade logger.exception o logger.warning con contexto en lugar de cambiar el flujo; donde capturar todo sea intencional y esté justificado, usa un noqa con la regla concreta y un comentario corto del motivo.
   c. ASYNC230 (open bloqueante dentro de async): muévelo a asyncio.to_thread solo si es sencillo; si no, noqa con motivo.
   d. RUF012 en atributos de clase mutables de modelos o settings: anótalos con ClassVar solo si no son campos del modelo; si son campos de Beanie o Pydantic, usa noqa con motivo.
   e. El resto (SIM, TRY401, UP035, UP046, RUF013) según la sugerencia de ruff.
4. No uses un noqa general en todo el archivo ni desactives reglas enteras en pyproject salvo lo del requisito 2.

Verificación:
- api/venv/bin/ruff check api --exclude api/venv: cero errores.
- cd api y venv/bin/pytest: todo en verde (y RUN_NETWORK_TESTS=1 venv/bin/pytest -m network en verde).
- api/venv/bin/python -m compileall -q api/app api/main.py sin errores.
- Pega el antes y después de ruff check --statistics en tu respuesta.

Criterios de aceptación:
- Ruff en cero, tests en verde, ningún cambio de comportamiento; cada noqa lleva su regla concreta y un motivo.

Si algo no cuadra con este alcance (un test que falla, una corrección que cambiaría el comportamiento, un tipo), detente y pregúntame en lugar de cambiar el comportamiento. No dejes scripts auxiliares: borra cualquier archivo temporal que crees. No reviertas cambios que veas en archivos fuera de tu alcance: puede haber otro agente trabajando. Sigue docs/agy/_reglas-agentes.md.

### FIN DEL PROMPT PARA GEMINI
