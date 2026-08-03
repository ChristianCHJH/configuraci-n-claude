---
name: wikis-commit-si-push-no
description: "Vaults Unimar_obsidian y Viernes — commit automático sí, push jamás; /unimar y /viernes solo por invocación explícita de Christian"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 14124c45-8761-4f20-9e4c-04d181dce9dc
  modified: 2026-08-01T03:53:56.624Z
---

Regla de Christian (2026-07-31) para los wikis/segundos cerebros (`Unimar_obsidian` y el vault de Viernes):

1. **Commit sí, push no.** Al documentar vía `/unimar` o `/viernes` se hace `git add -A && git commit`, pero **jamás `git push`** — el push lo hace Christian a mano.
2. **`/unimar` y `/viernes` solo se activan si Christian los escribe él mismo.** Ninguna skill (incluidos `/despertar` y `/despertar-unimar`) ni el modelo por iniciativa propia deben invocarlas.
3. **Responder ≠ documentar.** No escribir respuestas (ni partes de ellas) al wiki después de cada respuesta; la documentación ocurre solo dentro de una invocación explícita de `/unimar` o `/viernes`.

**Why:** los despertares encadenaban escrituras al wiki + commit + push en cada respuesta, y a Christian le molestaba el push constante y la escritura no pedida.

**How to apply:** ya está codificado en los 4 comandos (`~/.claude/commands/unimar.md`, `viernes.md`, `despertar.md`, `despertar-unimar.md`) — sección "Persistencia (git)" y "Reglas duras". Si Christian pide cambiar esto, actualizar esos archivos, no solo la memoria. Esta regla reemplaza la memoria antigua [[git-unimar-obsidian-siempre-commit-push]] (que obligaba push). En `unimar_tms` (código) sigue: jamás commit ni push.
