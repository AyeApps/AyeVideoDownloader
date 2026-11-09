# W1 — Quitar los avisos de oxlint en App.jsx

Bloque W1 · rama main · en paralelo con B5 y B6 (alcances disjuntos) · Claude auditó C4 y vio que npm run lint deja 2 avisos react-hooks(exhaustive-deps) en frontend/src/App.jsx líneas 110 y 111.

### PROMPT PARA GEMINI — copiar desde aquí

Objetivo: que npm run lint en frontend/ termine sin avisos, sin cambiar el comportamiento.

Alcance cerrado. Solo puedes modificar este archivo:
1. frontend/src/App.jsx

Contexto verificado en el código:
- En App (línea 100 aprox.) existe pollTimersRef, un useRef con un Map de temporizadores de sondeo por descarga.
- El useEffect de las líneas 108 a 113 aprox. tiene dependencias vacías y en su función de limpieza recorre pollTimersRef.current para cancelar cada temporizador y luego lo vacía. oxlint avisa en las líneas 110 y 111 porque lee ref.current dentro de la limpieza.
- pollDownloadStatus usa ese mismo Map con setPollTimer y clearPollTimer para programar y cancelar el sondeo de cada descarga.

Ya existe y no debe cambiar: la lógica de sondeo, los límites de tiempo y fallos, el uso de tickets, el texto de cola, el EventSource y todo lo demás de App.jsx.

Requisitos:
1. Dentro del cuerpo de ese useEffect (no en la limpieza), copia pollTimersRef.current a una constante local y usa esa constante en la función de limpieza para cancelar los temporizadores y vaciar el Map. Es el mismo Map, así que el comportamiento no cambia.
2. No toques nada más del archivo.

Verificación:
- cd frontend y npm run lint: cero avisos y cero errores.
- npm run build termina bien.

Criterios de aceptación:
- Lint sin avisos, build bien, y el diff de App.jsx se limita a ese useEffect.

Si algo no cuadra con este alcance (un test, el linter, un tipo), detente y pregúntame en lugar de cambiar código fuera de este archivo. No dejes scripts auxiliares: borra cualquier archivo temporal que crees. No reviertas cambios que veas en archivos fuera de tu alcance: puede haber otro agente trabajando. Sigue docs/agy/_reglas-agentes.md.

### FIN DEL PROMPT PARA GEMINI
