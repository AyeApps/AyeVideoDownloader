# Reglas para agentes (agy / Gemini) en aye-video-downloader

- Los specs están en `docs/agy/AAAA-MM-DD/<id>-<nombre>.md`. Ejecuta solo la sección entre `### PROMPT PARA GEMINI — copiar desde aquí` y `### FIN DEL PROMPT PARA GEMINI`; lo que esté fuera es contexto para el humano o para Claude.
- El alcance es cerrado: toca solo los archivos que lista el spec.
- Si algo choca con el alcance (un test, el linter, un tipo, una función que no existe como dice el spec), detente y pregunta en lugar de cambiar código fuera del alcance.
- No reviertas cambios que veas en archivos fuera de tu alcance: puede haber otro agente trabajando.
- No dejes scripts auxiliares ni archivos temporales: bórralos antes de terminar.
- No incluyas ni edites `__pycache__/` ni `.codebase-memory/`.
- Verificación antes de decir "listo": backend con `api/venv/bin/ruff check api`; frontend con `npm run lint` y `npm run build` dentro de `frontend/`.
