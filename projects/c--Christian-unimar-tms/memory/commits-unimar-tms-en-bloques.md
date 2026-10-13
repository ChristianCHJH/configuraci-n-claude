---
name: commits-unimar-tms-en-bloques
description: "En unimar_tms, cuando Christian pide commitear: todo el árbol repartido en commits temáticos, mensajes de 5 palabras como máximo y sin firma"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dc4a2f5c-3a7a-4cfa-bf83-533269e8c974
  modified: 2026-09-09T17:23:19.180Z
---

En **`unimar_tms`** el commit lo sigue pidiendo Christian, nunca se hace por iniciativa propia. Pero cuando lo pide, la forma es: **todo lo que haya en el árbol, repartido en varios commits temáticos**, con mensajes de **5 palabras como máximo**, en minúscula, con prefijo tipo `feat:` / `fix:` / `docs:` / `chore:` / `refactor:`, y **sin firma** (nada de `Co-Authored-By` ni `Generated with`). Push nunca.

**Why:** el 2026-09-09 le pregunté con un menú si commiteaba solo mis 12 ficheros o los 103 del árbol. Rechazó la pregunta y respondió «comitea todo pero en bloques». No quiere elegir alcance: quiere que agrupe yo por tema y que entre todo. Preguntar por el alcance le hace perder tiempo en algo que él ya da por decidido.

**How to apply:** `git reset` para vaciar el índice, y luego un `git add` por bloque con rutas explícitas, commiteando entre bloque y bloque. Agrupar por capa o por funcionalidad, no por fecha: aquel día salieron seis —almacén compartido, soporte técnico del backend, API UNITRANS, app Android, frontend web y documentación—. Si un fichero mezcla trabajo mío con trabajo previo suyo, va entero al bloque al que pertenece por contenido y **se le dice en el resumen**, porque `git add -i` no está disponible en este entorno y los hunks no se pueden separar. Al cerrar, verificar con `git status --porcelain` que no quedó nada suelto.

Matiza a [[git-unimar-obsidian-siempre-commit-push]], que decía «en unimar_tms ni commit ni push»: el push sigue prohibido, el commit a petición explícita ya no.
