---
name: config-claude-push-main
description: "En el repo de configuración global (~/.claude, ChristianCHJH/configuraci-n-claude) Christian autorizó commit + push directo a main y resolver conflictos sin preguntar"
metadata:
  node_type: memory
  type: feedback
  originSessionId: dc17462d-992a-4917-bbbb-fff8a10803fb
  modified: 2026-10-29T17:34:09.944Z
---

En `C:\Users\Christian\.claude` (remoto `ChristianCHJH/configuraci-n-claude`, rama `main`) se commitea **y se empuja a `main` siempre**, y los conflictos se resuelven sin preguntar. Lo dijo el 2026-10-29 al crear la skill `spiderman-sdlc`.

**Why:** es su configuración personal; quiere los cambios (skills, agentes) publicados sin pasos de confirmación. Ese repo recibe commits automáticos de otras máquinas, así que el `main` local suele ir atrás.

**How to apply:**
- Commitea solo lo de la tarea (mensaje de `christian-commit`, sin firma); el árbol tiene cachés y estados de Claude Code sin commitear que no son tuyos.
- Antes del push: `git stash push -u -m "<etiqueta>"`, `git rebase origin/main`, push, y `git stash apply <SHA>`.
- En conflictos de caché o estado de esta máquina (`plugins/*`, `state/*`, `.in_use`), gana la versión local. Si el stash no restaura los archivos sin seguimiento, `git checkout <SHA>^3 -- .` y `git reset`; compara por `git hash-object` (no `cmp`: `autocrlf` cambia los fines de línea).
- Solo vale para ese repo: en unimar_tms y unimar-xms sigue la regla de confirmar ([[commits-unimar-tms]]).
